
import { useEffect, useState } from "react";
import DashboardLayout from "./components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Package, ShoppingCart, TrendingUp, Users } from "lucide-react";

const SellerDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    revenue: 0,
    customers: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        
        // Fetch product count
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('id')
          .eq('seller_id', user.id);
          
        if (productsError) throw productsError;
        
        // Get all orders that contain this seller's products
        const { data: orderItems, error: ordersError } = await supabase
          .from('order_items')
          .select(`
            id,
            order_id,
            product_id,
            quantity,
            total_price,
            products!inner(seller_id)
          `)
          .eq('products.seller_id', user.id);
          
        if (ordersError) throw ordersError;
        
        // Calculate total revenue
        const revenue = orderItems?.reduce((sum, item) => sum + (Number(item.total_price) || 0), 0) || 0;
        
        // Get unique order IDs to count orders
        const uniqueOrderIds = new Set(orderItems?.map(item => item.order_id) || []);
        
        // Get unique customer IDs
        const { data: orders, error: customersError } = await supabase
          .from('orders')
          .select('buyer_id')
          .in('id', Array.from(uniqueOrderIds));
          
        if (customersError) throw customersError;
        
        const uniqueCustomers = new Set(orders?.map(order => order.buyer_id) || []);
        
        setStats({
          products: products?.length || 0,
          orders: uniqueOrderIds.size,
          revenue,
          customers: uniqueCustomers.size,
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, toast]);

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : stats.products}
            </div>
            <p className="text-xs text-muted-foreground">
              Total active products
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : stats.orders}
            </div>
            <p className="text-xs text-muted-foreground">
              Total orders received
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : `$${stats.revenue.toFixed(2)}`}
            </div>
            <p className="text-xs text-muted-foreground">
              Total revenue earned
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : stats.customers}
            </div>
            <p className="text-xs text-muted-foreground">
              Unique customers
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Your most recent customer orders</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Loading recent orders...</p>
            ) : stats.orders === 0 ? (
              <p className="text-muted-foreground">No orders yet</p>
            ) : (
              <p>Order list will appear here</p> // Placeholder for future order list component
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
            <CardDescription>Your best selling products</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Loading top products...</p>
            ) : stats.products === 0 ? (
              <p className="text-muted-foreground">No products yet</p>
            ) : (
              <p>Product list will appear here</p> // Placeholder for future product list component
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SellerDashboard;
