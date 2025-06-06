
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
    getNewOrdersCountAlternative();
    
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
          getNewOrdersCountAlternative();
          
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
          getNewOrdersCountAlternative();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(updateChannel);
    };
  }, [toast]);

  const getNewOrdersCountAlternative = async () => {
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

      console.log('Fetching new orders count using alternative method for seller:', user.id);
      
      // Get viewed orders from localStorage
      const viewedOrders = new Set(JSON.parse(localStorage.getItem("viewedOrders") || "[]"));
      
      // Get seller's products first
      const { data: sellerProducts } = await supabase
        .from('products')
        .select('id')
        .eq('seller_id', user.id);

      if (!sellerProducts || sellerProducts.length === 0) {
        console.log('No products found for seller');
        setNewOrdersCount(0);
        return;
      }

      const productIds = sellerProducts.map(p => p.id);

      // Get order items for seller's products
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('order_id')
        .in('product_id', productIds);

      if (!orderItems || orderItems.length === 0) {
        console.log('No order items found for seller products');
        setNewOrdersCount(0);
        return;
      }

      // Get unique order IDs
      const orderIds = [...new Set(orderItems.map(item => item.order_id))];

      // Get pending orders
      const { data: pendingOrders } = await supabase
        .from('orders')
        .select('id')
        .in('id', orderIds)
        .eq('status', 'pending');

      if (!pendingOrders || pendingOrders.length === 0) {
        console.log('No pending orders found for seller');
        setNewOrdersCount(0);
        return;
      }

      // Count unviewed pending orders
      const newOrdersCount = pendingOrders.filter(order => 
        !viewedOrders.has(order.id)
      ).length;
      
      console.log('New unviewed pending orders for this seller:', newOrdersCount);
      setNewOrdersCount(newOrdersCount);
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
