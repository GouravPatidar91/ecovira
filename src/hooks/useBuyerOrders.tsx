
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
  seller_name: string;
}

interface BuyerOrder {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  payment_status: string;
  shipping_address: string;
  order_items: OrderItem[];
}

export const useBuyerOrders = () => {
  const [orders, setOrders] = useState<BuyerOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('No session found');
        return;
      }

      const { data, error } = await supabase.rpc('get_buyer_orders', {
        buyer_user_id: session.user.id
      });

      if (error) {
        console.error('Error fetching buyer orders:', error);
        toast({
          title: "Error",
          description: "Failed to fetch orders",
          variant: "destructive",
        });
        return;
      }

      console.log('Fetched orders:', data);
      
      // Transform the data to match our TypeScript interface
      const transformedOrders: BuyerOrder[] = (data || []).map((order: any) => ({
        ...order,
        order_items: Array.isArray(order.order_items) ? order.order_items : []
      }));
      
      setOrders(transformedOrders);
    } catch (error) {
      console.error('Error in fetchOrders:', error);
      toast({
        title: "Error",
        description: "Failed to fetch orders",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Set up real-time subscription for order updates
    const channel = supabase
      .channel('buyer-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        () => {
          fetchOrders(); // Refetch when orders are updated
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
    refetch: fetchOrders
  };
};
