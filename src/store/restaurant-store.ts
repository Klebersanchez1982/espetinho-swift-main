import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Order, OrderItem, Product, UserRole, INITIAL_PRODUCTS } from '@/types/restaurant';
import {
  addProductToFirestore,
  subscribeProducts,
  toggleProductAvailabilityInFirestore,
  updateProductStockInFirestore,
} from '@/lib/firestore-products';
import {
  addItemToOrderInFirestore,
  addOrderToFirestore,
  closeOrderInFirestore,
  removeItemFromOrderInFirestore,
  subscribeOrders,
  updateOrderItemStatusInFirestore,
} from '@/lib/firestore-orders';
import { setUserRoleInFirestore, subscribeUserRole } from '@/lib/firestore-user-role';

let productsUnsubscribe: (() => void) | null = null;
let ordersUnsubscribe: (() => void) | null = null;
let roleUnsubscribe: (() => void) | null = null;

const runAsync = (action: () => Promise<void>, context: string) => {
  action().catch((error) => {
    console.error(`Erro em ${context}:`, error);
  });
};

const fireAndForget = (promise: Promise<void>) => {
  promise.catch((error) => {
    console.error('Erro ao sincronizar com Firestore:', error);
  });
};

interface RestaurantState {
  authUserId: string | null;
  authEmail: string | null;
  setAuthUserId: (uid: string | null, email?: string | null) => void;
  clearSession: () => void;
  clearRole: () => void;

  role: UserRole | null;
  availableRoles: UserRole[];
  setRole: (role: UserRole | null) => void;
  initRoleSync: (uid: string) => () => void;

  initProductsSync: () => () => void;
  initOrdersSync: () => () => void;

  products: Product[];
  addProduct: (product: Product) => void;
  updateProductStock: (productId: string, qty: number) => void;
  toggleProductAvailability: (productId: string) => void;

  orders: Order[];
  addOrder: (order: Order) => void;
  addItemToOrder: (orderId: string, item: OrderItem) => void;
  removeItemFromOrder: (orderId: string, itemId: string) => void;
  updateItemStatus: (orderId: string, itemId: string, status: OrderItem['status']) => void;
  closeOrder: (orderId: string, paymentMethod: Order['paymentMethod'], totalPaid: number) => void;
}

export const useRestaurantStore = create<RestaurantState>()(
  persist(
    (set, get) => ({
      authUserId: null,
      authEmail: null,
      setAuthUserId: (uid, email = null) => set({ authUserId: uid, authEmail: email ?? null, role: null }),
      clearSession: () => {
        set({
          authUserId: null,
          authEmail: null,
          role: null,
          availableRoles: [],
          orders: [],
          products: INITIAL_PRODUCTS,
        });
      },

      clearRole: () => {
        set({ role: null });
      },

      role: null,
      availableRoles: [],
      setRole: (role) => {
        set({ role });
        const uid = get().authUserId;
        const email = get().authEmail;
        if (uid) {
          const currentRoles = get().availableRoles;
          const nextRoles = role && !currentRoles.includes(role) ? [...currentRoles, role] : currentRoles;
          fireAndForget(setUserRoleInFirestore(uid, role, email, nextRoles));
          return;
        }
      },

      initRoleSync: (uid) => {
        if (roleUnsubscribe) {
          return roleUnsubscribe;
        }

        roleUnsubscribe = subscribeUserRole(
          uid,
          (role, roles) => {
            set({ role, availableRoles: roles });
          },
          (error) => {
            console.error('Erro ao ouvir role do usuario:', error);
          }
        );

        return () => {
          if (roleUnsubscribe) {
            roleUnsubscribe();
            roleUnsubscribe = null;
          }
        };
      },

      initProductsSync: () => {
        if (productsUnsubscribe) {
          return productsUnsubscribe;
        }

        productsUnsubscribe = subscribeProducts(
          (products) => {
            set({ products });
          },
          (error) => {
            console.error('Erro ao ouvir produtos do Firestore:', error);
          }
        );

        return () => {
          if (productsUnsubscribe) {
            productsUnsubscribe();
            productsUnsubscribe = null;
          }
        };
      },

      initOrdersSync: () => {
        if (ordersUnsubscribe) {
          return ordersUnsubscribe;
        }

        ordersUnsubscribe = subscribeOrders(
          (orders) => {
            set({ orders });
          },
          (error) => {
            console.error('Erro ao ouvir comandas do Firestore:', error);
          }
        );

        return () => {
          if (ordersUnsubscribe) {
            ordersUnsubscribe();
            ordersUnsubscribe = null;
          }
        };
      },

      products: INITIAL_PRODUCTS,
      addProduct: (product) => {
        runAsync(async () => {
          await addProductToFirestore(product);
        }, 'adicionar produto');
      },
      updateProductStock: (productId, qty) => {
        runAsync(async () => {
          await updateProductStockInFirestore(productId, qty);
        }, 'atualizar estoque');
      },
      toggleProductAvailability: (productId) => {
        runAsync(async () => {
          await toggleProductAvailabilityInFirestore(productId);
        }, 'alterar disponibilidade do produto');
      },

      orders: [],
      addOrder: (order) => {
        fireAndForget(addOrderToFirestore(order));
      },
      addItemToOrder: (orderId, item) => {
        fireAndForget(addItemToOrderInFirestore(orderId, item));
      },
      removeItemFromOrder: (orderId, itemId) => {
        fireAndForget(removeItemFromOrderInFirestore(orderId, itemId));
      },
      updateItemStatus: (orderId, itemId, status) => {
        fireAndForget(updateOrderItemStatusInFirestore(orderId, itemId, status));
      },
      closeOrder: (orderId, paymentMethod, totalPaid) => {
        fireAndForget(closeOrderInFirestore(orderId, paymentMethod, totalPaid));
      },
    }),
    {
      name: 'restaurant-store-v2',
      storage: createJSONStorage(() => localStorage),
      partialize: () => ({}),
    }
  )
);
