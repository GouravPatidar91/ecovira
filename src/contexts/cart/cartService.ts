
import { supabase } from '@/integrations/supabase/client';
import { CartItem, Product } from './types';

export const cartService = {
  async loadCart() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return [];
    }

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

    if (error) {
      console.error('Error loading cart:', error);
      throw error;
    }

    console.log('Cart items from DB:', cartItems);

    const formattedItems = cartItems.map(item => ({
      id: item.id,
      product_id: item.product_id,
      quantity: item.quantity,
      name: item.products.name,
      price: item.products.price,
      unit: item.products.unit,
      image: item.products.images?.[0] || '',
    }));

    console.log('Formatted cart items:', formattedItems);
    return formattedItems;
  },

  async setupSubscription(userId: string, onCartChange: () => void) {
    const channel = supabase
      .channel('cart_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cart_items',
          filter: `user_id=eq.${userId}`
        },
        () => {
          onCartChange();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  async addToCart(userId: string, product: Product, quantity: number) {
    if (!product?.id) {
      throw new Error('Invalid product data');
    }

    // Check if item already exists in cart
    const { data: existingItem, error: queryError } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('user_id', userId)
      .eq('product_id', product.id)
      .maybeSingle();

    if (queryError) {
      console.error('Error checking for existing item:', queryError);
      throw queryError;
    }

    if (existingItem) {
      // Update quantity if item exists
      const newQuantity = existingItem.quantity + quantity;
      const { error: updateError } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', existingItem.id);

      if (updateError) {
        console.error('Error updating cart item:', updateError);
        throw updateError;
      }

      return {
        type: 'update',
        id: existingItem.id,
        quantity: newQuantity
      };
    } else {
      // Add new item if it doesn't exist
      const { data: insertedItem, error: insertError } = await supabase
        .from('cart_items')
        .insert({
          user_id: userId,
          product_id: product.id,
          quantity,
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('Error inserting cart item:', insertError);
        throw insertError;
      }

      if (!insertedItem) {
        throw new Error('Failed to insert item into cart');
      }

      const cartItem: CartItem = {
        id: insertedItem.id,
        product_id: product.id,
        quantity,
        name: product.name,
        price: product.price,
        unit: product.unit,
        image: product.images?.[0] || '',
      };

      return {
        type: 'add',
        item: cartItem
      };
    }
  },

  async removeFromCart(userId: string, productId: string) {
    if (!productId) {
      throw new Error('Invalid product ID');
    }

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId);

    if (error) throw error;
  },

  async updateQuantity(userId: string, itemId: string, quantity: number) {
    if (!itemId) {
      throw new Error('Invalid item ID');
    }

    const { error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', itemId)
      .eq('user_id', userId);

    if (error) throw error;
  },

  async clearCart(userId: string) {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
  }
};
