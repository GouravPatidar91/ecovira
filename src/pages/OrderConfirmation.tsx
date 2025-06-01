
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircle, Clock, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { CartProvider } from "@/contexts/CartContext";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface OrderDetails {
  id: string;
  buyer_id: string;
  total_amount: number;
  shipping_address: string | null;
  status: string | null;
  payment_status: string | null;
  created_at: string;
  order_items?: any[];
}

const OrderConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const orderId = params.get('orderId');
        
        if (!orderId) {
          toast({
            title: "Error",
            description: "No order ID provided",
            variant: "destructive",
          });
          navigate("/market");
          return;
        }
        
        const { data } = await supabase.auth.getSession();
        const session = data.session;
        
        if (!session) {
          toast({
            title: "Authentication required",
            description: "Please log in to view your order",
            variant: "destructive",
          });
          navigate("/auth");
          return;
        }

        // Use the get_order_details RPC function
        const { data: orderData, error: orderError } = await supabase.rpc(
          'get_order_details',
          { 
            p_order_id: orderId,
            p_user_id: session.user.id 
          }
        );

        if (orderError || !orderData || orderData.length === 0) {
          console.error('Error fetching order:', orderError);
          toast({
            title: "Error",
            description: "Could not retrieve order details",
            variant: "destructive",
          });
          navigate("/market");
          return;
        }
          
        setOrderDetails(orderData[0]);

        // Fetch order items
        const { data: orderItems, error: itemsError } = await supabase.rpc(
          'get_order_items',
          {
            p_order_id: orderId,
            p_user_id: session.user.id
          }
        );
          
        if (!itemsError && orderItems) {
          setOrderDetails(prevState => {
            if (prevState) {
              return { ...prevState, order_items: orderItems };
            }
            return prevState;
          });
        }
        
      } catch (error) {
        console.error('Error in order confirmation:', error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
        navigate("/market");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOrderDetails();
  }, [location.search, navigate, toast]);

  const handleContinueShopping = () => {
    navigate("/market");
  };

  if (isLoading) {
    return (
      <CartProvider>
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-2xl mx-auto text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-market-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading order details...</p>
            </div>
          </div>
        </div>
      </CartProvider>
    );
  }

  return (
    <CartProvider>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto">
            <Card className="shadow-lg">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl">Order Request Sent!</CardTitle>
                <p className="text-gray-600">
                  Your order request has been sent to the sellers for review.
                </p>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <Clock className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="font-medium text-blue-800">What happens next?</span>
                  </div>
                  <ul className="text-sm text-blue-700 space-y-1 ml-7">
                    <li>• Sellers will review your order request</li>
                    <li>• You'll be notified when they accept or decline</li>
                    <li>• If accepted, you can proceed to payment</li>
                    <li>• If declined, you can modify your order</li>
                  </ul>
                </div>
                
                {orderDetails && (
                  <div className="border-t border-b py-4">
                    <h3 className="font-semibold text-lg mb-3 flex items-center">
                      <Package className="h-5 w-5 mr-2" />
                      Order Summary
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="text-gray-500">Order ID:</span>
                      <span className="font-mono">{orderDetails.id.slice(0, 8)}</span>
                      <span className="text-gray-500">Date:</span>
                      <span>{new Date(orderDetails.created_at).toLocaleDateString()}</span>
                      <span className="text-gray-500">Shipping Address:</span>
                      <span>{orderDetails.shipping_address}</span>
                      <span className="text-gray-500">Total Amount:</span>
                      <span className="font-medium">${orderDetails.total_amount?.toFixed(2)}</span>
                      <span className="text-gray-500">Status:</span>
                      <span className="capitalize font-medium text-yellow-600">
                        {orderDetails.status || 'Pending Review'}
                      </span>
                    </div>
                    
                    {orderDetails.order_items && orderDetails.order_items.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Items:</h4>
                        <ul className="space-y-2">
                          {orderDetails.order_items.map((item: any, idx: number) => (
                            <li key={idx} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                              <span>
                                {item.product_name || 'Product'} ({item.quantity} {item.quantity === 1 ? item.product_unit || 'unit' : `${item.product_unit || 'unit'}s`})
                              </span>
                              <span>${(item.unit_price * item.quantity).toFixed(2)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
              
              <CardFooter>
                <Button onClick={handleContinueShopping} className="w-full">
                  Continue Shopping
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </CartProvider>
  );
};

export default OrderConfirmation;
