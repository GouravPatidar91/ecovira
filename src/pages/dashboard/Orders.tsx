
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
    const getCurrentUserAndSubscribe = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Count pending orders with the corrected RLS policies
      const countPendingOrders = async () => {
        const viewedOrders = new Set(JSON.parse(localStorage.getItem("viewedOrders") || "[]"));
        
        const { data: pendingOrders } = await supabase
          .from('orders')
          .select('id')
          .eq('status', 'pending');

        if (!pendingOrders) return;
        
        // Filter orders that haven't been viewed yet
        const newOrdersCount = pendingOrders.filter(order => 
          !viewedOrders.has(order.id)
        ).length;
        
        setNewOrders(newOrdersCount);
        setShowAlert(newOrdersCount > 0);
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
            setNewOrders(prev => prev + 1);
            setShowAlert(true);
            
            toast({
              title: "New Order Received",
              description: "You have a new order from a customer",
            });
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
