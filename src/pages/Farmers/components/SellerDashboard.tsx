
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Bell } from "lucide-react";

const SellerDashboard = () => {
  const navigate = useNavigate();
  const [newOrdersCount, setNewOrdersCount] = useState(0);

  useEffect(() => {
    // Get orders that the seller hasn't viewed yet
    const getNewOrdersCount = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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
        .order('created_at', { ascending: false });

      if (!allOrders) return;
      
      // Filter orders to only include those with products from this seller
      // and that haven't been viewed yet
      const newOrders = allOrders.filter(order => 
        !viewedOrders.has(order.id) && 
        order.order_items.some(item => item.product?.seller_id === user.id)
      );
      
      setNewOrdersCount(newOrders.length);
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
        () => {
          // When a new order is created, update the count
          getNewOrdersCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border">
      <h2 className="text-xl font-semibold mb-4">Seller Dashboard</h2>
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
            <Badge className="absolute -top-2 -right-2 bg-market-600 text-white">
              {newOrdersCount}
            </Badge>
          )}
        </Button>
      </div>
    </div>
  );
};

export default SellerDashboard;
