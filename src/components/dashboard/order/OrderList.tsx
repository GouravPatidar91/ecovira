
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
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface OrderItem {
  id: string;
  quantity: number;
  product_name: string;
  product_unit: string;
}

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
  order_items: OrderItem[];
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
    fetchOrdersUsingFunction();

    // Subscribe to order changes
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
          console.log('Order update received:', payload);
          if (payload.eventType === 'INSERT') {
            fetchOrdersUsingFunction();
            toast({
              title: "New Order Request",
              description: "You have received a new order request from a customer!",
            });
          } else if (payload.eventType === 'UPDATE') {
            fetchOrdersUsingFunction();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  useEffect(() => {
    localStorage.setItem("viewedOrders", JSON.stringify(Array.from(viewedOrders)));
  }, [viewedOrders]);

  const fetchOrdersUsingFunction = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user found');
        setOrders([]);
        return;
      }

      console.log('Fetching orders using alternative method for seller:', user.id);

      // First, get orders by checking if user is seller for any products in the order
      const { data: sellerProducts } = await supabase
        .from('products')
        .select('id')
        .eq('seller_id', user.id);

      if (!sellerProducts || sellerProducts.length === 0) {
        console.log('No products found for seller');
        setOrders([]);
        return;
      }

      const productIds = sellerProducts.map(p => p.id);

      // Get order items for seller's products
      const { data: orderItems } = await supabase
        .from('order_items')
        .select(`
          order_id,
          quantity,
          product_id,
          products!inner (
            name,
            unit
          )
        `)
        .in('product_id', productIds);

      if (!orderItems || orderItems.length === 0) {
        console.log('No order items found for seller products');
        setOrders([]);
        return;
      }

      // Get unique order IDs
      const orderIds = [...new Set(orderItems.map(item => item.order_id))];

      // Fetch order details
      const { data: orderDetails } = await supabase
        .from('orders')
        .select(`
          id,
          created_at,
          total_amount,
          status,
          payment_status,
          shipping_address,
          buyer_id
        `)
        .in('id', orderIds)
        .order('created_at', { ascending: false });

      if (!orderDetails) {
        console.log('No order details found');
        setOrders([]);
        return;
      }

      // Get buyer profiles
      const buyerIds = [...new Set(orderDetails.map(order => order.buyer_id))];
      const { data: buyerProfiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', buyerIds);

      // Transform the data
      const ordersWithDetails = orderDetails.map(order => {
        const relatedItems = orderItems
          .filter(item => item.order_id === order.id)
          .map(item => ({
            id: item.product_id,
            quantity: item.quantity,
            product_name: item.products?.name || 'Unknown Product',
            product_unit: item.products?.unit || ''
          }));

        const buyer = buyerProfiles?.find(buyer => buyer.id === order.buyer_id) || 
                     { id: order.buyer_id, full_name: 'Unknown' };

        return {
          id: order.id,
          created_at: order.created_at,
          total_amount: order.total_amount,
          status: order.status || 'pending',
          payment_status: order.payment_status || 'pending',
          shipping_address: order.shipping_address || '',
          buyer,
          order_items: relatedItems,
          is_new: !viewedOrders.has(order.id)
        };
      });

      console.log('Successfully fetched orders using alternative method:', ordersWithDetails.length);
      setOrders(ordersWithDetails);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to load orders. Please try refreshing the page.",
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

      if (status === 'processing') {
        toast({
          title: "Order Accepted",
          description: "Order has been accepted and the buyer will be notified. They can now proceed to payment.",
        });
      } else if (status === 'cancelled') {
        toast({
          title: "Order Declined",
          description: "Order has been declined and the buyer will be notified.",
        });
      } else {
        toast({
          title: "Success",
          description: "Order status updated successfully",
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
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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
                  No order requests found
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow 
                  key={order.id} 
                  className={order.is_new ? "bg-market-50 border-l-4 border-l-market-500" : ""}
                  onClick={() => {
                    if (order.is_new) markOrderAsViewed(order.id);
                  }}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <span className="font-mono text-sm">#{order.id.slice(0, 8)}</span>
                      {order.is_new && (
                        <Badge className="ml-2 bg-market-600 text-white">
                          New Request
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(order.created_at).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex flex-col">
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-1 text-gray-500" />
                              <span className="font-medium">{order.buyer?.full_name || 'Unknown'}</span>
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
                              <div className="text-sm mt-1">
                                <strong>Delivery to:</strong><br />
                                {order.shipping_address}
                              </div>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {order.order_items.map((item) => (
                        <div key={item.id} className="text-sm">
                          <span className="font-medium">{item.quantity}x</span> {item.product_name}
                          <span className="text-gray-500 ml-1">({item.product_unit})</span>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-lg">${order.total_amount?.toFixed(2)}</span>
                  </TableCell>
                  <TableCell>
                    <Badge className={`border ${getStatusBadgeColor(order.status || 'pending')}`}>
                      {order.status === 'pending' ? 'Awaiting Response' : 
                       order.status === 'processing' ? 'Accepted' :
                       order.status === 'cancelled' ? 'Declined' :
                       order.status || 'pending'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {order.status === 'pending' ? (
                      <div className="flex space-x-2">
                        <Button 
                          variant="default"
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => updateOrderStatus(order.id, 'processing')}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Accept
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => updateOrderStatus(order.id, 'cancelled')}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Decline
                        </Button>
                      </div>
                    ) : (
                      <Select
                        value={order.status || 'pending'}
                        onValueChange={(value) => updateOrderStatus(order.id, value)}
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="processing">Accepted</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Declined</SelectItem>
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
