
import { useContext } from 'react';
import { CartContext, CartProvider } from './CartProvider';
import type { CartItem, CartState, Product } from './types';

export { CartProvider };

// Create the hook for using the cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

// Export types
export type { CartItem, CartState, Product };
