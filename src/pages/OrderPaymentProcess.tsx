
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { CartProvider } from "@/contexts/CartContext";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

const OrderPaymentProcess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'processing' | 'success' | 'failed'>('processing');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Process URL parameters when the component mounts
  useEffect(() => {
    const fetchOrderAndProcess = async () => {
      try {
        // Extract order ID from URL parameters
        const params = new URLSearchParams(location.search);
        const id = params.get('orderId');
        
        if (!id) {
          setError('Missing order ID');
          setPaymentStatus('failed');
          setIsProcessing(false);
          return;
        }
        
        setOrderId(id);
        
        // Get the session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setError('Authentication required');
          setPaymentStatus('failed');
          setIsProcessing(false);
          return;
        }
        
        // Fetch order details to validate
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .select(`
            id, 
            total_amount, 
            shipping_address, 
            status,
            payment_status,
            created_at,
            order_items (
              quantity,
              unit_price,
              product_id,
              products (
                name,
                unit
              )
            )
          `)
          .eq('id', id)
          .single();
          
        if (orderError || !order) {
          console.error('Error fetching order:', orderError);
          setError('Could not retrieve order details');
          setPaymentStatus('failed');
          setIsProcessing(false);
          return;
        }
        
        // Validate this order belongs to the current user
        if (order && session && order.buyer_id !== session.user.id) {
          setError('Unauthorized access to order');
          setPaymentStatus('failed');
          setIsProcessing(false);
          return;
        }
        
        setOrderDetails(order);
        
        // Simulate payment processing
        setTimeout(() => {
          processPayment(order);
        }, 2000);
        
      } catch (error) {
        console.error('Error in order processing:', error);
        setError('An unexpected error occurred');
        setPaymentStatus('failed');
        setIsProcessing(false);
      }
    };
    
    fetchOrderAndProcess();
  }, [location.search]);
  
  // Function to process payment
  const processPayment = async (order: any) => {
    try {
      // For demonstration, we'll simulate a successful payment
      // You would integrate with a payment gateway here
      const isSuccessful = true; // In a real app, this would be the result from payment gateway
      
      if (isSuccessful) {
        // Update order status
        const { error: updateError } = await supabase
          .from('orders')
          .update({ 
            payment_status: 'paid',
            status: 'processing' 
          })
          .eq('id', order.id);
          
        if (updateError) {
          throw updateError;
        }
        
        // Get order items to update product stock
        const { data: orderItems, error: itemsError } = await supabase
          .from('order_items')
          .select('product_id, quantity')
          .eq('order_id', order.id);

        if (itemsError) {
          console.error('Error fetching order items:', itemsError);
          throw itemsError;
        }

        // Update product stock for each item
        for (const item of orderItems || []) {
          try {
            const { error: updateStockError } = await supabase.functions.invoke(
              "update_product_quantity", 
              {
                body: {
                  product_id: item.product_id,
                  quantity: item.quantity
                }
              }
            );

            if (updateStockError) {
              console.error('Error updating product stock:', updateStockError);
            }
          } catch (error) {
            console.error('Function invocation error:', error);
          }
        }
        
        // Create a transaction record
        const transactionId = `tx_${Math.random().toString(36).substring(2, 15)}`;
        const timestamp = new Date().toISOString();
        const amount = order.total_amount;
        const cardLast4 = "4242"; // Simulated data
        const cardType = "Visa"; // Simulated data
        
        const { error: txError } = await supabase
          .from('payment_transactions')
          .insert({
            order_id: order.id,
            payment_id: `pay_${Math.random().toString(36).substring(2, 15)}`,
            amount: amount,
            transaction_id: transactionId,
            payment_method: `${cardType} ending in ${cardLast4}`,
            status: 'completed'
          });
          
        if (txError) {
          console.error('Error recording transaction:', txError);
        }
        
        // Clear the cart after successful payment
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { error: clearCartError } = await supabase
            .from('cart_items')
            .delete()
            .eq('user_id', session.user.id);
            
          if (clearCartError) {
            console.error('Error clearing cart:', clearCartError);
          }
        }
        
        // Update state and show success toast
        setPaymentStatus('success');
        toast({
          title: "Payment Successful",
          description: "Your payment has been processed successfully",
        });
        
      } else {
        // Handle payment failure
        setPaymentStatus('failed');
        setError('Payment was declined');
        toast({
          title: "Payment Failed",
          description: "Your payment could not be processed",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      setPaymentStatus('failed');
      setError('An error occurred while processing your payment');
      toast({
        title: "Payment Error",
        description: "There was a problem processing your payment",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReturnToMarket = () => {
    navigate('/market');
  };

  const handleViewOrders = () => {
    navigate('/dashboard/orders');
  };

  return (
    <CartProvider>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto">
            <Card className="shadow-lg">
              <CardContent className="pt-6">
                {isProcessing ? (
                  <div className="text-center py-12">
                    <Loader2 className="h-12 w-12 animate-spin text-market-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Processing Your Payment</h2>
                    <p className="text-gray-600">
                      Please wait while we process your payment...
                    </p>
                  </div>
                ) : paymentStatus === 'success' ? (
                  <div className="text-center py-8">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
                    <p className="text-gray-600 mb-6">
                      Thank you for your order. Your payment has been processed successfully.
                    </p>
                    
                    {orderDetails && (
                      <div className="text-left border-t border-b py-4 my-4">
                        <h3 className="font-semibold text-lg mb-2">Order Summary</h3>
                        <div className="grid grid-cols-2 gap-2">
                          <p className="text-gray-500">Order ID:</p>
                          <p>{orderDetails.id}</p>
                          <p className="text-gray-500">Date:</p>
                          <p>{new Date(orderDetails.created_at).toLocaleString()}</p>
                          <p className="text-gray-500">Shipping Address:</p>
                          <p>{orderDetails.shipping_address}</p>
                          <p className="text-gray-500">Amount:</p>
                          <p>${orderDetails.total_amount?.toFixed(2)}</p>
                          <p className="text-gray-500">Status:</p>
                          <p className="capitalize">{orderDetails.status}</p>
                        </div>
                        
                        {orderDetails.order_items && orderDetails.order_items.length > 0 && (
                          <div className="mt-4">
                            <h4 className="font-medium mb-2">Items:</h4>
                            <ul className="space-y-2">
                              {orderDetails.order_items.map((item: any, idx: number) => (
                                <li key={idx} className="flex justify-between text-sm">
                                  <span>
                                    {item.products?.name || 'Product'} ({item.quantity} {item.quantity === 1 ? item.products?.unit || 'unit' : `${item.products?.unit || 'unit'}s`})
                                  </span>
                                  <span>${(item.unit_price * item.quantity).toFixed(2)}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                      <AlertCircle className="h-8 w-8 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Payment Failed</h2>
                    <p className="text-red-600 mb-6">{error || "There was an issue processing your payment."}</p>
                    <Alert variant="destructive">
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>
                        Your payment could not be completed. Please try again or contact customer support.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row gap-4 pb-6">
                {paymentStatus === 'failed' ? (
                  <Button onClick={handleReturnToMarket} className="w-full">
                    Return to Market
                  </Button>
                ) : paymentStatus === 'success' ? (
                  <>
                    <Button onClick={handleReturnToMarket} variant="outline" className="flex-1">
                      Continue Shopping
                    </Button>
                    <Button onClick={handleViewOrders} className="flex-1">
                      View My Orders
                    </Button>
                  </>
                ) : null}
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </CartProvider>
  );
};

export default OrderPaymentProcess;
