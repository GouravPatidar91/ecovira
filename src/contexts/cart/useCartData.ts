
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cartService } from './cartService';

export const useCartData = (dispatch: React.Dispatch<any>) => {
  const { toast } = useToast();

  useEffect(() => {
    const loadCart = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          // If no session, clear the cart state
          dispatch({ type: 'SET_CART', payload: [] });
          return;
        }

        dispatch({ type: 'SET_LOADING', payload: true });
        
        const formattedItems = await cartService.loadCart();
        dispatch({ type: 'SET_CART', payload: formattedItems });
      } catch (error) {
        console.error('Error loading cart:', error);
        toast({
          title: "Error",
          description: "Failed to load cart items",
          variant: "destructive",
        });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    loadCart();

    // Set up subscription to listen for changes to cart items
    const setupSubscription = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const unsubscribe = await cartService.setupSubscription(
        session.user.id,
        loadCart
      );

      return unsubscribe;
    };

    const unsubscribePromise = setupSubscription();
    
    return () => {
      unsubscribePromise.then(unsubscribe => {
        if (unsubscribe) unsubscribe();
      });
    };
  }, [dispatch, toast]);
};
