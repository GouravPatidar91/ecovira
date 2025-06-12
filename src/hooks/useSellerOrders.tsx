
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface OrderItem {
  id: string;
  quantity: number;
  product_name: string;
  product_unit: string;
  unit_price: number;
  total_price: number;
}

interface SellerOrder {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  payment_status: string;
  shipping_address: string;
  buyer_id: string;
  buyer_name: string;
  order_items: OrderItem[];
  is_new?: boolean;
}

export const useSellerOrders = () => {
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const { toast } = useToast();

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('No session found');
        return;
      }

      const { data, error } = await supabase.rpc('get_seller_orders', {
        seller_user_id: session.user.id
      });

      if (error) {
        console.error('Error fetching seller orders:', error);
        toast({
          title: "Error",
          description: "Failed to fetch orders",
          variant: "destructive",
        });
        return;
      }

      console.log('Fetched orders:', data);
      
      if (data && Array.isArray(data)) {
        const processedOrders = data.map((order: any) => ({
          ...order,
          is_new: order.status === 'pending'
        }));
        
        setOrders(processedOrders);
        setNewOrdersCount(processedOrders.filter((order: SellerOrder) => order.status === 'pending').length);
      }
    } catch (error) {
      console.error('Error in fetchOrders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) {
        console.error('Error updating order status:', error);
        toast({
          title: "Error",
          description: "Failed to update order status",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: `Order ${status === 'processing' ? 'accepted' : status}`,
      });

      // Refresh orders after update
      fetchOrders();
    } catch (error) {
      console.error('Error in updateOrderStatus:', error);
    }
  };

  const markOrderAsViewed = async (orderId: string) => {
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === orderId ? { ...order, is_new: false } : order
      )
    );
  };

  useEffect(() => {
    fetchOrders();

    // Set up real-time subscription for new orders
    const channel = supabase
      .channel('seller-orders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders'
        },
        () => {
          fetchOrders(); // Refetch when new order is inserted
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders'
        },
        () => {
          fetchOrders(); // Refetch when order is updated
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    orders,
    isLoading,
    newOrdersCount,
    updateOrderStatus,
    markOrderAsViewed,
    refetch: fetchOrders
  };
};
