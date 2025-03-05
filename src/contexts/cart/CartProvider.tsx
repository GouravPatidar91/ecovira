
import { createContext, useReducer } from 'react';
import { cartReducer } from './cartReducer';
import { CartState, CartAction, Product } from './types';
import { useCartData } from './useCartData';
import { cartService } from './cartService';
import { supabase } from '@/integrations/supabase/client';

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
  
  // Define cart operations directly instead of using the hook
  const addToCart = async (product: Product, quantity: number) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        await cartService.addToCart(data.session.user.id, product, quantity);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const removeFromCart = async (productId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        await cartService.removeFromCart(data.session.user.id, productId);
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        await cartService.updateQuantity(data.session.user.id, itemId, quantity);
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const clearCart = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        await cartService.clearCart(data.session.user.id);
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

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
