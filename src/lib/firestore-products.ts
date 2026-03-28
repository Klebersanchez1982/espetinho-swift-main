import {
  collection,
  doc,
  onSnapshot,
  runTransaction,
  setDoc,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { INITIAL_PRODUCTS, Product } from '@/types/restaurant';

const productsCollection = collection(db, 'products');

type ProductDoc = Omit<Product, 'id'>;

const toProductDoc = (product: Product): ProductDoc => ({
  name: product.name,
  price: product.price,
  category: product.category,
  available: product.available,
  stock: product.stock,
});

const seedInitialProducts = async () => {
  const batch = writeBatch(db);

  for (const product of INITIAL_PRODUCTS) {
    batch.set(doc(productsCollection, product.id), toProductDoc(product));
  }

  await batch.commit();
};

export const subscribeProducts = (
  onProducts: (products: Product[]) => void,
  onError?: (error: unknown) => void
): Unsubscribe => {
  let seeded = false;

  return onSnapshot(
    productsCollection,
    async (snapshot) => {
      if (snapshot.empty && !seeded) {
        seeded = true;
        await seedInitialProducts();
        return;
      }

      const products = snapshot.docs.map((snapshotDoc) => ({
        id: snapshotDoc.id,
        ...(snapshotDoc.data() as ProductDoc),
      }));

      onProducts(products);
    },
    (error) => {
      if (onError) {
        onError(error);
      }
    }
  );
};

export const addProductToFirestore = async (product: Product) => {
  await setDoc(doc(productsCollection, product.id), toProductDoc(product));
};

export const updateProductStockInFirestore = async (productId: string, qtyDelta: number) => {
  const productRef = doc(productsCollection, productId);

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(productRef);

    if (!snapshot.exists()) {
      throw new Error('Produto nao encontrado para atualizar estoque.');
    }

    const current = snapshot.data() as ProductDoc;
    const nextStock = Math.max(0, current.stock + qtyDelta);

    transaction.update(productRef, {
      stock: nextStock,
      available: nextStock > 0 ? current.available : false,
    });
  });
};

export const toggleProductAvailabilityInFirestore = async (productId: string) => {
  const productRef = doc(productsCollection, productId);

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(productRef);

    if (!snapshot.exists()) {
      throw new Error('Produto nao encontrado para alterar disponibilidade.');
    }

    const current = snapshot.data() as ProductDoc;

    transaction.update(productRef, {
      available: !current.available,
    });
  });
};
