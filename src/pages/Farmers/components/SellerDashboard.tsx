
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
          getNewOrdersCount();
          
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
          getNewOrdersCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(updateChannel);
    };
  }, [toast]);

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

      console.log('Fetching new orders count for seller:', user.id);
      
      // Get viewed orders from localStorage
      const viewedOrders = new Set(JSON.parse(localStorage.getItem("viewedOrders") || "[]"));
      
      // Get all pending orders
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select('id')
        .eq('status', 'pending');

      if (error) {
        console.error('Error fetching orders:', error);
        setNewOrdersCount(0);
        return;
      }

      if (!ordersData || ordersData.length === 0) {
        console.log('No pending orders found');
        setNewOrdersCount(0);
        return;
      }

      // Check each order to see if it contains seller's products
      let sellerOrdersCount = 0;
      
      for (const order of ordersData) {
        // Check if this order has items from this seller
        const { data: orderItems } = await supabase
          .from('order_items')
          .select(`
            products (
              seller_id
            )
          `)
          .eq('order_id', order.id);

        // Check if any item in this order belongs to the current seller
        const hasSellerItems = orderItems?.some(item => 
          item.products?.seller_id === user.id
        );

        // If order has seller's items and hasn't been viewed, count it
        if (hasSellerItems && !viewedOrders.has(order.id)) {
          sellerOrdersCount++;
        }
      }
      
      console.log('New unviewed pending orders for this seller:', sellerOrdersCount);
      setNewOrdersCount(sellerOrdersCount);
    } catch (error) {
      console.error('Error getting new orders count:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
