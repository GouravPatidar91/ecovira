
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  payment_status: string;
  shipping_address: string;
  buyer_id: string;
  buyer_name: string;
  order_items: {
    id: string;
    quantity: number;
    product_name: string;
    product_unit: string;
    unit_price: number;
    total_price: number;
  }[];
  is_new?: boolean;
}

export const useSellerOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchSellerOrders = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user found');
        setOrders([]);
        setNewOrdersCount(0);
        return;
      }

      console.log('Fetching orders for seller:', user.id);

      // Use RPC function to get seller orders
      const { data: sellerOrders, error } = await supabase.rpc('get_seller_orders', {
        seller_user_id: user.id
      });

      if (error) {
        console.error('Error fetching seller orders:', error);
        throw error;
      }

      if (!sellerOrders || sellerOrders.length === 0) {
        console.log('No orders found for this seller');
        setOrders([]);
        setNewOrdersCount(0);
        return;
      }

      // Get viewed orders from localStorage
      const viewedOrders = new Set(JSON.parse(localStorage.getItem("viewedOrders") || "[]"));

      // Transform and mark new orders
      const transformedOrders = sellerOrders.map((order: any) => ({
        ...order,
        is_new: !viewedOrders.has(order.id) && order.status === 'pending'
      }));

      // Count new pending orders
      const newCount = transformedOrders.filter(order => order.is_new).length;
      
      console.log('Successfully fetched seller orders:', transformedOrders.length);
      console.log('New pending orders:', newCount);
      
      setOrders(transformedOrders);
      setNewOrdersCount(newCount);
    } catch (error) {
      console.error('Error in fetchSellerOrders:', error);
      toast({
        title: "Error",
        description: "Failed to load orders. Please try refreshing the page.",
        variant: "destructive",
      });
      setOrders([]);
      setNewOrdersCount(0);
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

      if (error) throw error;

      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status } : order
      ));

      if (status === 'processing') {
        toast({
          title: "Order Accepted",
          description: "Order has been accepted and the buyer will be notified.",
        });
      } else if (status === 'cancelled') {
        toast({
          title: "Order Declined",
          description: "Order has been declined and the buyer will be notified.",
        });
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const markOrderAsViewed = (orderId: string) => {
    const viewedOrders = new Set(JSON.parse(localStorage.getItem("viewedOrders") || "[]"));
    viewedOrders.add(orderId);
    localStorage.setItem("viewedOrders", JSON.stringify(Array.from(viewedOrders)));
    
    setOrders(orders.map(order => 
      order.id === orderId ? { ...order, is_new: false } : order
    ));
    
    setNewOrdersCount(prev => Math.max(0, prev - 1));
  };

  useEffect(() => {
    fetchSellerOrders();

    // Subscribe to order changes
    const channel = supabase
      .channel('seller-orders-updates')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('Order update received:', payload);
          fetchSellerOrders();
          if (payload.eventType === 'INSERT') {
            toast({
              title: "New Order Request",
              description: "You have received a new order request!",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  return {
    orders,
    newOrdersCount,
    isLoading,
    updateOrderStatus,
    markOrderAsViewed,
    refetch: fetchSellerOrders
  };
};
