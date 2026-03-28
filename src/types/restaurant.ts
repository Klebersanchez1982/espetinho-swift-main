export type UserRole = 'garcom' | 'assador' | 'caixa';

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  available: boolean;
  stock: number;
}

export interface Client {
  name: string;
  phone: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  status: 'pendente' | 'preparo' | 'pronto';
}

export interface Order {
  id: string;
  table: string;
  client: Client;
  items: OrderItem[];
  status: 'aberta' | 'andamento' | 'fechada';
  createdAt: Date;
  closedAt?: Date;
  paymentMethod?: 'dinheiro' | 'pix' | 'cartao';
  totalPaid?: number;
}

export const CATEGORIES = ['Espetinhos', 'Bebidas', 'Adicionais', 'Porções'];

export const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'Espetinho de Carne', price: 8.00, category: 'Espetinhos', available: true, stock: 50 },
  { id: '2', name: 'Espetinho de Frango', price: 7.00, category: 'Espetinhos', available: true, stock: 50 },
  { id: '3', name: 'Espetinho de Linguiça', price: 7.50, category: 'Espetinhos', available: true, stock: 40 },
  { id: '4', name: 'Espetinho de Queijo Coalho', price: 6.00, category: 'Espetinhos', available: true, stock: 30 },
  { id: '5', name: 'Espetinho Misto', price: 9.00, category: 'Espetinhos', available: true, stock: 30 },
  { id: '6', name: 'Espetinho de Coração', price: 8.50, category: 'Espetinhos', available: true, stock: 25 },
  { id: '7', name: 'Cerveja Lata', price: 6.00, category: 'Bebidas', available: true, stock: 100 },
  { id: '8', name: 'Refrigerante Lata', price: 5.00, category: 'Bebidas', available: true, stock: 80 },
  { id: '9', name: 'Água', price: 3.00, category: 'Bebidas', available: true, stock: 60 },
  { id: '10', name: 'Suco Natural', price: 7.00, category: 'Bebidas', available: true, stock: 20 },
  { id: '11', name: 'Farofa', price: 5.00, category: 'Adicionais', available: true, stock: 30 },
  { id: '12', name: 'Vinagrete', price: 4.00, category: 'Adicionais', available: true, stock: 30 },
  { id: '13', name: 'Mandioca Frita', price: 15.00, category: 'Porções', available: true, stock: 15 },
  { id: '14', name: 'Batata Frita', price: 18.00, category: 'Porções', available: true, stock: 15 },
];
