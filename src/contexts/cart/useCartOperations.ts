import { useContext } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cartService } from './cartService';
import { Product } from './types';
import { CartContext } from './CartProvider';

export const useCartOperations = () => {
  const context = useContext(CartContext);
  const { toast } = useToast();
  
  if (!context) {
    throw new Error('useCartOperations must be used within a CartProvider');
  }
  
  const { dispatch } = context;

  const addToCart = async (product: Product, quantity: number) => {
    // Validate product object
    if (!product?.id) {
      console.error('Invalid product object:', product);
      toast({
        title: "Error",
        description: "Invalid product data",
        variant: "destructive",
      });
      throw new Error('Invalid product data');
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Authentication required",
        description: "Please log in to add items to your cart",
        variant: "destructive",
      });
      throw new Error('Authentication required');
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      console.log('Adding product to cart:', product);

      const result = await cartService.addToCart(session.user.id, product, quantity);
      console.log('Cart service result:', result);
      
      if (result.type === 'update') {
        // Update cart state
        dispatch({
          type: 'UPDATE_QUANTITY',
          payload: { id: result.id, quantity: result.quantity }
        });
      } else if (result.type === 'add') {
        dispatch({ type: 'ADD_ITEM', payload: result.item });
      }

      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart`,
      });
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const removeFromCart = async (productId: string) => {
    if (!productId) {
      console.error('Invalid product ID:', productId);
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please log in to manage your cart",
          variant: "destructive",
        });
        return;
      }

      await cartService.removeFromCart(session.user.id, productId);

      dispatch({ type: 'REMOVE_ITEM', payload: productId });
      toast({
        title: "Removed from cart",
        description: "Item has been removed from your cart",
      });
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast({
        title: "Error",
        description: "Failed to remove item from cart",
        variant: "destructive",
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (!itemId) {
      console.error('Invalid item ID:', itemId);
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please log in to manage your cart",
          variant: "destructive",
        });
        return;
      }

      await cartService.updateQuantity(session.user.id, itemId, quantity);

      dispatch({ type: 'UPDATE_QUANTITY', payload: { id: itemId, quantity } });
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast({
        title: "Error",
        description: "Failed to update quantity",
        variant: "destructive",
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const clearCart = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please log in to manage your cart",
          variant: "destructive",
        });
        return;
      }

      dispatch({ type: 'SET_LOADING', payload: true });
      
      await cartService.clearCart(session.user.id);

      dispatch({ type: 'CLEAR_CART' });
      toast({
        title: "Cart cleared",
        description: "All items have been removed from your cart",
      });
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast({
        title: "Error",
        description: "Failed to clear cart",
        variant: "destructive",
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  return {
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart
  };
};
