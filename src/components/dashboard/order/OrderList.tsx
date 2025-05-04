
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Bell, 
  Loader2, 
  User,
  MapPin,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  payment_status: string;
  shipping_address: string;
  buyer: {
    full_name: string;
    id: string;
  };
  order_items: {
    id: string;
    quantity: number;
    product: {
      name: string;
      unit: string;
    };
  }[];
  is_new?: boolean;
}

const OrderList = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [viewedOrders, setViewedOrders] = useState<Set<string>>(
    new Set(JSON.parse(localStorage.getItem("viewedOrders") || "[]"))
  );

  useEffect(() => {
    fetchOrders();

    // Subscribe to order updates
    const channel = supabase
      .channel('order-updates')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            fetchOrders();
          } else if (payload.eventType === 'UPDATE' && payload.new && payload.old) {
            setOrders(prevOrders => 
              prevOrders.map(order => 
                order.id === payload.new.id 
                  ? { ...order, ...payload.new } 
                  : order
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("viewedOrders", JSON.stringify(Array.from(viewedOrders)));
  }, [viewedOrders]);

  const fetchOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // First get all orders
      const { data: allOrders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          buyer:profiles!orders_buyer_id_fkey(id, full_name),
          order_items(
            id,
            quantity,
            product:products(name, unit, seller_id)
          )
        `)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Filter orders to only include those with products from this seller
      const sellerOrders = allOrders?.filter(order => 
        order.order_items.some(item => item.product?.seller_id === user.id)
      ) || [];

      // Mark orders that haven't been viewed yet
      const ordersWithNewFlag = sellerOrders.map(order => ({
        ...order,
        is_new: !viewedOrders.has(order.id)
      }));

      setOrders(ordersWithNewFlag);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      });
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

      // If order is being approved (set to processing), notify the buyer
      if (status === 'processing') {
        await notifyBuyerOrderAccepted(orderId);
      }

      toast({
        title: "Success",
        description: status === 'processing' 
          ? "Order approved and buyer notified" 
          : "Order status updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const notifyBuyerOrderAccepted = async (orderId: string) => {
    try {
      // Get order to find the buyer
      const { data: order } = await supabase
        .from('orders')
        .select('buyer_id')
        .eq('id', orderId)
        .single();

      if (!order) return;

      // Here you would implement your notification system
      // For now we'll just console.log it
      console.log(`Notifying buyer ${order.buyer_id} that order ${orderId} has been accepted`);

      // In a real app, you might:
      // 1. Send an email
      // 2. Send a push notification
      // 3. Add an entry to a notifications table
    } catch (error) {
      console.error('Error notifying buyer:', error);
    }
  };

  const markOrderAsViewed = (orderId: string) => {
    setViewedOrders(prev => {
      const newSet = new Set(prev);
      newSet.add(orderId);
      return newSet;
    });
    
    setOrders(orders.map(order => 
      order.id === orderId ? { ...order, is_new: false } : order
    ));
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-white overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No orders found
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow 
                  key={order.id} 
                  className={order.is_new ? "bg-market-50" : ""}
                  onClick={() => {
                    if (order.is_new) markOrderAsViewed(order.id);
                  }}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      {order.id.slice(0, 8)}
                      {order.is_new && (
                        <Badge className="ml-2 bg-market-100 text-market-800">
                          New
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex flex-col">
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-1 text-gray-500" />
                              <span>{order.buyer?.full_name || 'Unknown'}</span>
                            </div>
                            {order.shipping_address && (
                              <div className="flex items-center text-xs text-gray-500 mt-1">
                                <MapPin className="h-3 w-3 mr-1" />
                                <span className="truncate max-w-[150px]">
                                  {order.shipping_address}
                                </span>
                              </div>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="p-2">
                            <div className="font-medium">{order.buyer?.full_name}</div>
                            {order.shipping_address && (
                              <div className="text-sm">{order.shipping_address}</div>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>
                    {order.order_items
                      .filter((item) => item.product) // Only show items with product data
                      .map((item) => (
                        <div key={item.id} className="text-sm">
                          {item.quantity} x {item.product.name} ({item.product.unit})
                        </div>
                      ))}
                  </TableCell>
                  <TableCell>${order.total_amount?.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge className={getStatusBadgeColor(order.status || 'pending')}>
                      {order.status || 'pending'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {order.status === 'pending' ? (
                      <div className="flex space-x-2">
                        <Button 
                          variant="default"
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => updateOrderStatus(order.id, 'processing')}
                        >
                          Accept Order
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-500"
                          onClick={() => updateOrderStatus(order.id, 'cancelled')}
                        >
                          Decline
                        </Button>
                      </div>
                    ) : (
                      <Select
                        value={order.status || 'pending'}
                        onValueChange={(value) => updateOrderStatus(order.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default OrderList;
