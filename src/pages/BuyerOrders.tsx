import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Package, Clock, CheckCircle, XCircle, Truck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";

interface OrderItem {
  id: string;
  quantity: number;
  product_name: string;
  product_unit: string;
  unit_price: number;
  total_price: number;
}

interface BuyerOrder {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  payment_status: string;
  shipping_address: string;
  order_items: OrderItem[];
}

const BuyerOrders = () => {
  const [orders, setOrders] = useState<BuyerOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchBuyerOrders();
  }, []);

  const fetchBuyerOrders = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please log in to view your orders",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      // Get buyer's orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('buyer_id', session.user.id)
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
        toast({
          title: "Error",
          description: "Failed to fetch your orders",
          variant: "destructive",
        });
        return;
      }

      // Get order items for each order
      const ordersWithItems = await Promise.all(
        (ordersData || []).map(async (order) => {
          const { data: itemsData, error: itemsError } = await supabase.rpc(
            'get_order_items',
            {
              p_order_id: order.id,
              p_user_id: session.user.id
            }
          );

          return {
            ...order,
            order_items: itemsError ? [] : itemsData || []
          };
        })
      );

      setOrders(ordersWithItems);
    } catch (error) {
      console.error('Error in fetchBuyerOrders:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'processing': return <Package className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Awaiting Seller Response';
      case 'processing': return 'Accepted by Seller';
      case 'completed': return 'Order Completed';
      case 'cancelled': return 'Order Declined';
      default: return status;
    }
  };

  const proceedToPayment = (orderId: string) => {
    navigate(`/order-payment?orderId=${orderId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading your orders...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <CartProvider>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">My Orders</h1>
            
            {orders.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                  <p className="text-gray-500 mb-4">You haven't placed any orders yet.</p>
                  <Button onClick={() => navigate("/market")}>
                    Start Shopping
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => (
                  <Card key={order.id} className="overflow-hidden">
                    <CardHeader className="bg-white border-b">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg flex items-center">
                            <span className="font-mono text-sm mr-2">#{order.id.slice(0, 8)}</span>
                            <Badge className={`border ${getStatusColor(order.status || 'pending')}`}>
                              <span className="flex items-center">
                                {getStatusIcon(order.status || 'pending')}
                                <span className="ml-1">{getStatusText(order.status || 'pending')}</span>
                              </span>
                            </Badge>
                          </CardTitle>
                          <p className="text-sm text-gray-500 mt-1">
                            Ordered on {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">${order.total_amount?.toFixed(2)}</p>
                          <p className="text-sm text-gray-500">
                            Payment: <span className="capitalize">{order.payment_status || 'pending'}</span>
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="p-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium mb-3 flex items-center">
                            <Package className="h-4 w-4 mr-2" />
                            Order Items
                          </h4>
                          <div className="space-y-2">
                            {order.order_items.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                                <div>
                                  <span className="font-medium">{item.product_name}</span>
                                  <p className="text-sm text-gray-500">
                                    {item.quantity} {item.quantity === 1 ? item.product_unit : `${item.product_unit}s`} × ${item.unit_price}
                                  </p>
                                </div>
                                <span className="font-medium">${item.total_price.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-3 flex items-center">
                            <Truck className="h-4 w-4 mr-2" />
                            Delivery Information
                          </h4>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm">{order.shipping_address || 'No shipping address provided'}</p>
                          </div>
                          
                          {order.status === 'processing' && order.payment_status === 'pending' && (
                            <div className="mt-4">
                              <Button 
                                onClick={() => proceedToPayment(order.id)}
                                className="w-full"
                              >
                                Proceed to Payment
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Order Timeline */}
                      <div className="mt-6 pt-6 border-t">
                        <h4 className="font-medium mb-3">Order Timeline</h4>
                        <div className="flex items-center space-x-4">
                          <div className={`flex items-center ${order.status === 'pending' ? 'text-yellow-600' : 'text-green-600'}`}>
                            <div className={`w-3 h-3 rounded-full ${order.status === 'pending' ? 'bg-yellow-400' : 'bg-green-400'} mr-2`}></div>
                            <span className="text-sm">Order Placed</span>
                          </div>
                          <div className="flex-1 h-px bg-gray-200"></div>
                          <div className={`flex items-center ${['processing', 'completed'].includes(order.status || '') ? 'text-green-600' : 'text-gray-400'}`}>
                            <div className={`w-3 h-3 rounded-full ${['processing', 'completed'].includes(order.status || '') ? 'bg-green-400' : 'bg-gray-300'} mr-2`}></div>
                            <span className="text-sm">Seller Accepted</span>
                          </div>
                          <div className="flex-1 h-px bg-gray-200"></div>
                          <div className={`flex items-center ${order.status === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>
                            <div className={`w-3 h-3 rounded-full ${order.status === 'completed' ? 'bg-green-400' : 'bg-gray-300'} mr-2`}></div>
                            <span className="text-sm">Completed</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </CartProvider>
  );
};

export default BuyerOrders;
