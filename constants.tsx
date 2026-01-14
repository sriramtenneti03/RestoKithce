
import React from 'react';
import { 
  Pizza, 
  Coffee, 
  IceCream, 
  Soup, 
  UtensilsCrossed 
} from 'lucide-react';

export const TABLES = Array.from({ length: 12 }, (_, i) => i + 1);
export const TAX_RATE = 0.05; // 5% GST/Sales Tax

export const CATEGORIES = [
  { id: 'all', name: 'All Items', icon: <UtensilsCrossed size={18} /> },
  { id: 'starters', name: 'Starters', icon: <Soup size={18} /> },
  { id: 'main', name: 'Main Course', icon: <Pizza size={18} /> },
  { id: 'drinks', name: 'Beverages', icon: <Coffee size={18} /> },
  { id: 'desserts', name: 'Desserts', icon: <IceCream size={18} /> },
];

export const COLLECTIONS = {
  MENU: 'menu',
  ORDERS: 'orders'
};
