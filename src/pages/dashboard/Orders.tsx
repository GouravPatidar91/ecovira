
import React, { useEffect, useState } from "react";
import DashboardLayout from "./components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface Order {
  id: string;
  buyer_id: string;
  total_amount: number;
  created_at: string;
  status: string;
  payment_status: string;
  shipping_address: string | null;
  buyer_name: string | null;
}

const Orders = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;

      try {
        setLoading(true);
        console.log("Fetching orders for seller:", user.id);
        
        // Get all products from this seller
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('id')
          .eq('seller_id', user.id);
          
        if (productsError) throw productsError;
        
        if (!products || products.length === 0) {
          setOrders([]);
          setLoading(false);
          return;
        }
        
        const productIds = products.map(product => product.id);
        
        // Get all order items containing these products
        const { data: orderItems, error: orderItemsError } = await supabase
          .from('order_items')
          .select('order_id')
          .in('product_id', productIds);
          
        if (orderItemsError) throw orderItemsError;
        
        if (!orderItems || orderItems.length === 0) {
          setOrders([]);
          setLoading(false);
          return;
        }
        
        const orderIds = [...new Set(orderItems.map(item => item.order_id))];
        
        // Get the orders
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select(`
            id,
            buyer_id,
            total_amount,
            created_at,
            status,
            payment_status,
            shipping_address
          `)
          .in('id', orderIds)
          .order('created_at', { ascending: false });
          
        if (ordersError) throw ordersError;
        
        // Get buyer names for the orders
        if (ordersData && ordersData.length > 0) {
          const buyerIds = [...new Set(ordersData.map(order => order.buyer_id))];
          
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', buyerIds);
            
          if (profilesError) throw profilesError;
          
          const profileMap = new Map();
          profiles?.forEach(profile => {
            profileMap.set(profile.id, profile.full_name);
          });
          
          const ordersWithBuyerNames = ordersData.map(order => ({
            ...order,
            buyer_name: profileMap.get(order.buyer_id) || 'Unknown'
          }));
          
          setOrders(ordersWithBuyerNames);
        } else {
          setOrders([]);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
        toast({
          title: "Error",
          description: "Failed to load orders",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, toast]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500">Processing</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500">Cancelled</Badge>;
      default:
        return <Badge className="bg-yellow-500">Pending</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500">Paid</Badge>;
      case 'refunded':
        return <Badge className="bg-purple-500">Refunded</Badge>;
      default:
        return <Badge className="bg-yellow-500">Pending</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Orders</CardTitle>
            <CardDescription>Manage your customer orders</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-6">
                <Loader2 className="h-8 w-8 animate-spin text-market-600" />
              </div>
            ) : orders.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.id.substring(0, 8)}...</TableCell>
                        <TableCell>{order.buyer_name}</TableCell>
                        <TableCell>{formatDate(order.created_at)}</TableCell>
                        <TableCell>${order.total_amount.toFixed(2)}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell>{getPaymentStatusBadge(order.payment_status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500">No orders found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Orders;
