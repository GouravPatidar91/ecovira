
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SellerDashboard = () => {
  const navigate = useNavigate();
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Get orders that the seller hasn't viewed yet
    const getNewOrdersCount = async () => {
      try {
        setIsLoading(true);
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('User authentication error:', userError);
          return;
        }
        
        if (!user) {
          console.log('No authenticated user found');
          return;
        }

        console.log('Fetching orders for seller:', user.id);
        
        // Get viewed orders from localStorage
        const viewedOrders = new Set(JSON.parse(localStorage.getItem("viewedOrders") || "[]"));
        
        // Get all orders with their items and products
        const { data: allOrders, error } = await supabase
          .from('orders')
          .select(`
            id,
            status,
            created_at,
            order_items(
              product:products(seller_id)
            )
          `)
          .eq('status', 'pending') // Only show pending orders that need review
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching orders:', error);
          toast({
            title: "Error",
            description: "Failed to load new orders",
            variant: "destructive",
          });
          return;
        }

        console.log('Retrieved orders:', allOrders);
        
        if (!allOrders || allOrders.length === 0) {
          console.log('No orders found');
          setNewOrdersCount(0);
          setIsLoading(false);
          return;
        }
        
        // Filter orders to only include those with products from this seller
        // and that haven't been viewed yet
        const newOrders = allOrders.filter(order => 
          order && 
          !viewedOrders.has(order.id) && 
          order.order_items && 
          order.order_items.some(item => item.product?.seller_id === user.id)
        ) || [];
        
        console.log('New unviewed orders for this seller:', newOrders.length);
        setNewOrdersCount(newOrders.length);
      } catch (error) {
        console.error('Error getting new orders count:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getNewOrdersCount();
    
    // Subscribe to new orders
    const channel = supabase
      .channel('seller-orders-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('New order created:', payload);
          // When a new order is created, update the count
          getNewOrdersCount();
          
          // Show a toast notification for the new order
          toast({
            title: "New Order Received",
            description: "You have received a new order that requires your approval",
          });
        }
      )
      .subscribe();

    // Also listen for order updates
    const updateChannel = supabase
      .channel('order-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders'
        },
        () => {
          // When an order is updated, refresh the count
          getNewOrdersCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(updateChannel);
    };
  }, [toast]);

  return (
    <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border">
      <h2 className="text-xl font-semibold mb-4">Seller Dashboard</h2>
      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-market-600" />
        </div>
      ) : (
        <>
          <div className="flex gap-4">
            <Button 
              onClick={() => navigate('/dashboard/products')}
              className="bg-market-600 hover:bg-market-700"
            >
              Manage Products
            </Button>
            <Button 
              onClick={() => navigate('/dashboard/orders')}
              variant="outline"
              className="relative"
            >
              View Orders
              {newOrdersCount > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-red-600 text-white">
                  {newOrdersCount}
                </Badge>
              )}
            </Button>
          </div>
          {newOrdersCount > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800 flex items-center">
              <Bell className="h-5 w-5 mr-2 text-yellow-600" />
              You have {newOrdersCount} new {newOrdersCount === 1 ? 'order' : 'orders'} waiting for your approval!
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SellerDashboard;
