
export type ItemStatus = 'ORDERED' | 'PREPARING' | 'FINISHED';
export type OrderStatus = 'OPEN' | 'CLOSED';
export type AppTab = 'orders' | 'kitchen' | 'billing' | 'menu';

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  available: boolean;
  description?: string;
  image?: string;
}

export interface OrderItem {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  status: ItemStatus;
  timestamp: number;
}

export interface Order {
  id: string;
  tableNumber: number;
  status: OrderStatus;
  items: OrderItem[];
  createdAt: any;
  subtotal: number;
  tax: number;
  total: number;
  waiterName?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}
