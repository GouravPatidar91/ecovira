
import { createContext, useReducer } from 'react';
import { cartReducer } from './cartReducer';
import { CartState, CartAction, Product } from './types';
import { useCartData } from './useCartData';
import { useCartOperations } from './useCartOperations';

// Define the context type
interface CartContextType {
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
  addToCart: (product: Product, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

// Create the context
export const CartContext = createContext<CartContextType | null>(null);

// Create the provider component
export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(cartReducer, { items: [], loading: false });
  
  // Load cart data and setup subscription
  useCartData(dispatch);
  
  // Use the cart operations hook for cart functionality
  const { addToCart, removeFromCart, updateQuantity, clearCart } = useCartOperations();

  return (
    <CartContext.Provider value={{ 
      state, 
      dispatch,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart
    }}>
      {children}
    </CartContext.Provider>
  );
};
