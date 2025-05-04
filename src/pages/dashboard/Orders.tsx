
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import OrderList from "@/components/dashboard/order/OrderList";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bell } from "lucide-react";

const Orders = () => {
  const [newOrders, setNewOrders] = useState(0);
  const [showAlert, setShowAlert] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Get current user ID
    const getCurrentUserAndSubscribe = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Count pending orders
      const countPendingOrders = async () => {
        // Get viewed orders from localStorage
        const viewedOrders = new Set(JSON.parse(localStorage.getItem("viewedOrders") || "[]"));
        
        // Get all orders
        const { data: allOrders } = await supabase
          .from('orders')
          .select(`
            id,
            order_items(
              product:products(seller_id)
            )
          `)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (!allOrders) return;
        
        // Filter orders to only include those with products from this seller
        // and that haven't been viewed yet
        const pendingOrders = allOrders.filter(order => 
          !viewedOrders.has(order.id) && 
          order.order_items.some(item => item.product?.seller_id === user.id)
        );
        
        const count = pendingOrders.length;
        setNewOrders(count);
        setShowAlert(count > 0);
      };

      countPendingOrders();

      // Subscribe to new orders
      const channel = supabase
        .channel('db-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'orders'
          },
          (payload) => {
            // Check if order items contain products from this seller
            const checkOrderProducts = async () => {
              const { data: orderItems } = await supabase
                .from('order_items')
                .select(`
                  product:products(seller_id)
                `)
                .eq('order_id', payload.new.id);

              // Check if any of the products in this order belongs to the current seller
              const isSellerOrder = orderItems?.some(item => 
                item.product?.seller_id === user.id
              );

              if (isSellerOrder) {
                setNewOrders(prev => prev + 1);
                setShowAlert(true);
                
                toast({
                  title: "New Order Received",
                  description: "You have a new order from a customer",
                });
              }
            };

            checkOrderProducts();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    getCurrentUserAndSubscribe();
  }, [toast]);

  const handleDismissAlert = () => {
    setShowAlert(false);
    setNewOrders(0);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold">Orders</h1>
          {newOrders > 0 && (
            <div className="flex items-center text-market-600">
              <Bell className="h-5 w-5 mr-1" />
              <span>{newOrders} new order{newOrders === 1 ? '' : 's'} to review</span>
            </div>
          )}
        </div>

        {showAlert && (
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertDescription className="flex justify-between items-center">
              <div>
                <span className="font-bold">Action Required:</span> You have {newOrders} new {newOrders === 1 ? 'order' : 'orders'} from customers! 
                Please review and either accept or decline them.
              </div>
              <button 
                onClick={handleDismissAlert}
                className="text-market-600 hover:text-market-800 font-medium"
              >
                Dismiss
              </button>
            </AlertDescription>
          </Alert>
        )}
        
        <OrderList />
      </div>
    </DashboardLayout>
  );
};

export default Orders;
