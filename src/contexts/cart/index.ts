
import { useContext } from 'react';
import { CartContext } from './CartProvider';
import { CartProvider } from './CartProvider';
import { CartState, CartAction, Product } from './types';

export interface UseCartReturn {
  items: CartState['items'];
  loading: boolean;
  addToCart: (product: Product, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

export const useCart = (): UseCartReturn => {
  const context = useContext(CartContext);
  
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  
  const { state, addToCart, removeFromCart, updateQuantity, clearCart } = context;
  
  return {
    items: state.items,
    loading: state.loading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart
  };
};

export { CartProvider };
