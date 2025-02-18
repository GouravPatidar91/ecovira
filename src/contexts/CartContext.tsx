
import { createContext, useContext, useReducer, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  name: string;
  price: number;
  unit: string;
  image: string;
}

interface CartState {
  items: CartItem[];
  loading: boolean;
}

type CartAction =
  | { type: 'SET_CART'; payload: CartItem[] }
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'CLEAR_CART' };

const CartContext = createContext<{
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
  addToCart: (product: any, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
} | null>(null);

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'SET_CART':
      return { ...state, items: action.payload };
    case 'ADD_ITEM':
      return { ...state, items: [...state.items, action.payload] };
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter(item => item.product_id !== action.payload) };
    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'CLEAR_CART':
      return { ...state, items: [] };
    default:
      return state;
  }
};

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(cartReducer, { items: [], loading: false });
  const { toast } = useToast();

  useEffect(() => {
    const loadCart = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        const { data: cartItems, error } = await supabase
          .from('cart_items')
          .select(`
            id,
            product_id,
            quantity,
            products (
              name,
              price,
              unit,
              images
            )
          `)
          .eq('user_id', session.user.id);

        if (error) throw error;

        const formattedItems = cartItems.map(item => ({
          id: item.id,
          product_id: item.product_id,
          quantity: item.quantity,
          name: item.products.name,
          price: item.products.price,
          unit: item.products.unit,
          image: item.products.images?.[0] || '',
        }));

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

    // Subscribe to cart changes
    const channel = supabase
      .channel('cart_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cart_items'
        },
        () => {
          loadCart();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addToCart = async (product: any, quantity: number) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Authentication required",
        description: "Please log in to add items to your cart",
        variant: "destructive",
      });
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      // Check if item already exists in cart
      const { data: existingItem } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('user_id', session.user.id)
        .eq('product_id', product.id)
        .single();

      if (existingItem) {
        // Update quantity if item exists
        const newQuantity = existingItem.quantity + quantity;
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: newQuantity })
          .eq('id', existingItem.id);

        if (error) throw error;

        dispatch({
          type: 'UPDATE_QUANTITY',
          payload: { id: existingItem.id, quantity: newQuantity }
        });
      } else {
        // Add new item if it doesn't exist
        const { data, error } = await supabase
          .from('cart_items')
          .insert({
            user_id: session.user.id,
            product_id: product.id,
            quantity,
          })
          .select('id')
          .single();

        if (error) throw error;

        const cartItem: CartItem = {
          id: data.id,
          product_id: product.id,
          quantity,
          name: product.name,
          price: product.price,
          unit: product.unit,
          image: product.images?.[0] || '',
        };

        dispatch({ type: 'ADD_ITEM', payload: cartItem });
      }

      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart`,
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const removeFromCart = async (productId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('product_id', productId);

      if (error) throw error;

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
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', itemId);

      if (error) throw error;

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
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', session.user.id);

      if (error) throw error;

      dispatch({ type: 'CLEAR_CART' });
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

  return (
    <CartContext.Provider value={{ state, dispatch, addToCart, removeFromCart, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
