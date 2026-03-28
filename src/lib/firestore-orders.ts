import {
  type Transaction,
  Timestamp,
  collection,
  doc,
  onSnapshot,
  runTransaction,
  setDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Order, OrderItem } from '@/types/restaurant';

const ordersCollection = collection(db, 'orders');
const productsCollection = collection(db, 'products');

type OrderDoc = Omit<Order, 'id'>;

type ProductDoc = {
  name: string;
  price: number;
  category: string;
  available: boolean;
  stock: number;
};

const toDate = (value: unknown): Date => {
  if (value instanceof Timestamp) {
    return value.toDate();
  }

  if (value instanceof Date) {
    return value;
  }

  return new Date(value as string);
};

const toOrder = (id: string, data: OrderDoc): Order => ({
  id,
  table: data.table,
  client: data.client,
  items: data.items,
  status: data.status,
  createdAt: toDate(data.createdAt),
  closedAt: data.closedAt ? toDate(data.closedAt) : undefined,
  paymentMethod: data.paymentMethod,
  totalPaid: data.totalPaid,
});

const toOrderDoc = (order: Order): OrderDoc => ({
  table: order.table,
  client: order.client,
  items: order.items,
  status: order.status,
  createdAt: order.createdAt,
  closedAt: order.closedAt,
  paymentMethod: order.paymentMethod,
  totalPaid: order.totalPaid,
});

const getItemTotals = (items: OrderItem[]) =>
  items.reduce<Record<string, number>>((acc, item) => {
    acc[item.productId] = (acc[item.productId] || 0) + item.quantity;
    return acc;
  }, {});

const deductStockInTransaction = async (
  transaction: Transaction,
  itemTotals: Record<string, number>
) => {
  for (const [productId, quantity] of Object.entries(itemTotals)) {
    const productRef = doc(productsCollection, productId);
    const productSnapshot = await transaction.get(productRef);

    if (!productSnapshot.exists()) {
      throw new Error('Produto nao encontrado ao registrar pedido.');
    }

    const product = productSnapshot.data() as ProductDoc;
    const nextStock = Math.max(0, product.stock - quantity);

    transaction.update(productRef, {
      stock: nextStock,
      available: nextStock > 0 ? product.available : false,
    });
  }
};

export const subscribeOrders = (
  onOrders: (orders: Order[]) => void,
  onError?: (error: unknown) => void
): Unsubscribe => {
  return onSnapshot(
    ordersCollection,
    (snapshot) => {
      const orders = snapshot.docs
        .map((snapshotDoc) => toOrder(snapshotDoc.id, snapshotDoc.data() as OrderDoc))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      onOrders(orders);
    },
    (error) => {
      if (onError) {
        onError(error);
      }
    }
  );
};

export const addOrderToFirestore = async (order: Order) => {
  const orderRef = doc(ordersCollection, order.id);

  await runTransaction(db, async (transaction) => {
    const existing = await transaction.get(orderRef);
    if (existing.exists()) {
      throw new Error('Comanda ja existe.');
    }

    await deductStockInTransaction(transaction, getItemTotals(order.items));
    transaction.set(orderRef, toOrderDoc(order));
  });
};

export const addItemToOrderInFirestore = async (orderId: string, item: OrderItem) => {
  const orderRef = doc(ordersCollection, orderId);

  await runTransaction(db, async (transaction) => {
    const orderSnapshot = await transaction.get(orderRef);
    if (!orderSnapshot.exists()) {
      throw new Error('Comanda nao encontrada.');
    }

    const current = orderSnapshot.data() as OrderDoc;
    const nextItems = [...current.items, item];

    await deductStockInTransaction(transaction, { [item.productId]: item.quantity });

    transaction.update(orderRef, {
      items: nextItems,
      status: 'andamento',
    });
  });
};

export const removeItemFromOrderInFirestore = async (orderId: string, itemId: string) => {
  const orderRef = doc(ordersCollection, orderId);

  await runTransaction(db, async (transaction) => {
    const orderSnapshot = await transaction.get(orderRef);
    if (!orderSnapshot.exists()) {
      throw new Error('Comanda nao encontrada.');
    }

    const current = orderSnapshot.data() as OrderDoc;
    const nextItems = current.items.filter((item) => item.id !== itemId);

    transaction.update(orderRef, {
      items: nextItems,
    });
  });
};

export const updateOrderItemStatusInFirestore = async (
  orderId: string,
  itemId: string,
  status: OrderItem['status']
) => {
  const orderRef = doc(ordersCollection, orderId);

  await runTransaction(db, async (transaction) => {
    const orderSnapshot = await transaction.get(orderRef);
    if (!orderSnapshot.exists()) {
      throw new Error('Comanda nao encontrada.');
    }

    const current = orderSnapshot.data() as OrderDoc;

    transaction.update(orderRef, {
      items: current.items.map((item) => (item.id === itemId ? { ...item, status } : item)),
    });
  });
};

export const closeOrderInFirestore = async (
  orderId: string,
  paymentMethod: Order['paymentMethod'],
  totalPaid: number
) => {
  const orderRef = doc(ordersCollection, orderId);

  await runTransaction(db, async (transaction) => {
    const orderSnapshot = await transaction.get(orderRef);
    if (!orderSnapshot.exists()) {
      throw new Error('Comanda nao encontrada.');
    }

    transaction.update(orderRef, {
      status: 'fechada',
      paymentMethod,
      totalPaid,
      closedAt: new Date(),
    });
  });
};

export const upsertOrderToFirestore = async (order: Order) => {
  await setDoc(doc(ordersCollection, order.id), toOrderDoc(order), { merge: true });
};
