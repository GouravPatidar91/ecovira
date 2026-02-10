
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

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
  product_name: string;
  product_unit: string;
}

interface OrderDetails {
  id: string;
  buyer_id: string;
  total_amount: number;
  shipping_address: string | null;
  status: string | null;
  payment_status: string | null;
  created_at: string;
  order_items?: OrderItem[];
}

const OrderPaymentProcess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'processing' | 'success' | 'failed'>('processing');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchOrderAndProcess = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const id = params.get('orderId');
        
        if (!id) {
          setError('Missing order ID');
          setPaymentStatus('failed');
          setIsProcessing(false);
          return;
        }
        
        setOrderId(id);
        
        const { data } = await supabase.auth.getSession();
        const session = data.session;
        
        if (!session) {
          setError('Authentication required');
          setPaymentStatus('failed');
          setIsProcessing(false);
          return;
        }

        // Fetch order directly
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', id)
          .eq('buyer_id', session.user.id)
          .maybeSingle();

        if (orderError || !orderData) {
          setError('Could not retrieve order details - not authorized or order not found');
          setPaymentStatus('failed');
          setIsProcessing(false);
          return;
        }
          
        setOrderDetails(orderData);

        // Fetch order items with product info
        const { data: items, error: itemsError } = await supabase
          .from('order_items')
          .select('*, products(name, unit)')
          .eq('order_id', id);
          
        if (!itemsError && items) {
          const mappedItems: OrderItem[] = items.map((item: any) => ({
            id: item.id,
            order_id: item.order_id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
            created_at: item.created_at,
            product_name: item.products?.name || 'Product',
            product_unit: item.products?.unit || 'unit',
          }));
          setOrderDetails(prev => prev ? { ...prev, order_items: mappedItems } : prev);
        }
        
        setTimeout(() => {
          processPayment();
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
  
  const processPayment = async () => {
    try {
      if (!orderDetails || !orderId) {
        throw new Error("Missing order details");
      }
      
      const isSuccessful = true;
      
      if (isSuccessful) {
        if (orderDetails.payment_status !== 'paid') {
          const { error: updateError } = await supabase
            .from('orders')
            .update({ payment_status: 'paid', status: 'processing' })
            .eq('id', orderId);
            
          if (updateError) throw updateError;
        }
        
        if (orderDetails.order_items && orderDetails.order_items.length > 0) {
          for (const item of orderDetails.order_items) {
            try {
              const { error: updateStockError } = await supabase.functions.invoke(
                "update_product_quantity", 
                { body: { product_id: item.product_id, quantity: item.quantity } }
              );
              if (updateStockError) console.error('Error updating product stock:', updateStockError);
            } catch (error) {
              console.error('Function invocation error:', error);
            }
          }
        }
        
        setPaymentStatus('success');
        toast({ title: "Payment Successful", description: "Your payment has been processed successfully" });
      } else {
        setPaymentStatus('failed');
        setError('Payment was declined');
        toast({ title: "Payment Failed", description: "Your payment could not be processed", variant: "destructive" });
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      setPaymentStatus('failed');
      setError('An error occurred while processing your payment');
      toast({ title: "Payment Error", description: "There was a problem processing your payment", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
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
                    <p className="text-gray-600">Please wait while we process your payment...</p>
                  </div>
                ) : paymentStatus === 'success' ? (
                  <div className="text-center py-8">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
                    <p className="text-gray-600 mb-6">Thank you for your order.</p>
                    
                    {orderDetails && (
                      <div className="text-left border-t border-b py-4 my-4">
                        <h3 className="font-semibold text-lg mb-2">Order Summary</h3>
                        <div className="grid grid-cols-2 gap-2">
                          <p className="text-gray-500">Order ID:</p><p>{orderDetails.id}</p>
                          <p className="text-gray-500">Date:</p><p>{new Date(orderDetails.created_at).toLocaleString()}</p>
                          <p className="text-gray-500">Shipping Address:</p><p>{orderDetails.shipping_address}</p>
                          <p className="text-gray-500">Amount:</p><p>${orderDetails.total_amount?.toFixed(2)}</p>
                          <p className="text-gray-500">Status:</p><p className="capitalize">{orderDetails.status}</p>
                        </div>
                        
                        {orderDetails.order_items && orderDetails.order_items.length > 0 && (
                          <div className="mt-4">
                            <h4 className="font-medium mb-2">Items:</h4>
                            <ul className="space-y-2">
                              {orderDetails.order_items.map((item, idx) => (
                                <li key={idx} className="flex justify-between text-sm">
                                  <span>{item.product_name} ({item.quantity} {item.product_unit})</span>
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
                      <AlertDescription>Your payment could not be completed. Please try again.</AlertDescription>
                    </Alert>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row gap-4 pb-6">
                {paymentStatus === 'failed' ? (
                  <Button onClick={() => navigate('/market')} className="w-full">Return to Market</Button>
                ) : paymentStatus === 'success' ? (
                  <>
                    <Button onClick={() => navigate('/market')} variant="outline" className="flex-1">Continue Shopping</Button>
                    <Button onClick={() => navigate('/dashboard/orders')} className="flex-1">View My Orders</Button>
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
