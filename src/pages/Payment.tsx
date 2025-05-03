
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navigation from "@/components/Navigation";
import PaymentForm from "@/components/PaymentForm";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { CartProvider } from "@/contexts/CartContext";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OrderSummary {
  id: string;
  total_amount: number;
  shipping_address: string;
  created_at: string;
  items: Array<{
    product_name: string;
    quantity: number;
    unit_price: number;
  }>;
}

interface TransactionDetails {
  id: string;
  timestamp: string;
  cardLast4: string;
  cardType: string;
  amount: number;
}

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [amount, setAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [orderExists, setOrderExists] = useState(false);
  const [orderSummary, setOrderSummary] = useState<OrderSummary | null>(null);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState<TransactionDetails | null>(null);

  useEffect(() => {
    // Get order information from URL params and validate order
    const fetchAndValidateOrder = async () => {
      try {
        const urlParams = new URLSearchParams(location.search);
        const id = urlParams.get("orderId");
        const total = urlParams.get("amount");
        
        if (!id || !total) {
          throw new Error("Missing order information");
        }
        
        // Validate that the order exists in the database
        const { data: order, error } = await supabase
          .from('orders')
          .select('id, total_amount, payment_status, shipping_address, created_at')
          .eq('id', id)
          .single();
        
        if (error || !order) {
          console.error("Error fetching order:", error);
          throw new Error("Order not found");
        }
        
        if (order.payment_status === 'paid') {
          toast({
            title: "Order Already Paid",
            description: "This order has already been paid for",
          });
          navigate("/dashboard/orders");
          return;
        }
        
        // Fetch order items for the summary
        const { data: orderItems, error: itemsError } = await supabase
          .from('order_items')
          .select(`
            quantity, 
            unit_price,
            products (name)
          `)
          .eq('order_id', id);
        
        if (itemsError) {
          console.error("Error fetching order items:", itemsError);
          // Continue without items data
        }
        
        // Create order summary
        const summary: OrderSummary = {
          id: order.id,
          total_amount: order.total_amount,
          shipping_address: order.shipping_address || 'Not provided',
          created_at: new Date(order.created_at).toLocaleString(),
          items: (orderItems || []).map(item => ({
            product_name: item.products?.name || 'Unknown product',
            quantity: item.quantity,
            unit_price: item.unit_price
          }))
        };
        
        setOrderId(id);
        setAmount(parseFloat(total));
        setOrderExists(true);
        setOrderSummary(summary);
      } catch (error) {
        console.error("Error validating order:", error);
        toast({
          title: "Invalid Order",
          description: "Could not find or validate the order",
          variant: "destructive",
        });
        navigate("/market");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAndValidateOrder();
  }, [location, navigate, toast]);

  const handlePaymentComplete = async (paymentId: string, txDetails: TransactionDetails) => {
    try {
      setTransactionDetails(txDetails);
      
      if (!orderId) {
        throw new Error('Order ID is missing');
      }

      // Update order with payment details
      const { error } = await supabase
        .from('orders')
        .update({ 
          payment_status: 'paid',
          status: 'processing'
        })
        .eq('id', orderId);

      if (error) {
        console.error('Error updating order:', error);
        throw error;
      }

      // Get order items to update product stock
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('product_id, quantity')
        .eq('order_id', orderId);

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
            console.error('Error updating product stock:', updateStockError, 'for product:', item.product_id);
          }
        } catch (error) {
          console.error('Function invocation error:', error);
        }
      }

      // Record the payment transaction
      try {
        const { error: txError } = await supabase
          .from('payment_transactions')
          .insert({
            order_id: orderId,
            payment_id: paymentId,
            amount: amount,
            transaction_id: txDetails.id,
            payment_method: `${txDetails.cardType} ending in ${txDetails.cardLast4}`,
            status: 'completed'
          });

        if (txError) {
          console.error('Error recording transaction:', txError);
        }
      } catch (error) {
        console.error('Transaction recording error:', error);
      }

      setPaymentComplete(true);
      
      toast({
        title: "Payment Successful",
        description: "Your order has been placed successfully",
      });
      
      // We'll let the user choose when to navigate away instead of automatic redirection
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: "Payment Update Failed",
        description: "Your payment was processed but we couldn't update your order status",
        variant: "destructive",
      });
    }
  };

  const handleNavigateToMarket = () => {
    navigate("/market");
  };
  
  const handleNavigateToOrders = () => {
    navigate("/dashboard/orders");
  };

  if (isLoading) {
    return (
      <CartProvider>
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          <div className="flex items-center justify-center h-[80vh]">
            <Loader2 className="h-8 w-8 animate-spin text-market-600" />
          </div>
        </div>
      </CartProvider>
    );
  }

  if (!orderExists) {
    return (
      <CartProvider>
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-2xl mx-auto text-center">
              <h1 className="text-3xl font-bold mb-4">Order Not Found</h1>
              <p className="mb-6">We couldn't find the order you're looking for.</p>
              <Button 
                className="px-4 py-2 bg-market-600 text-white rounded hover:bg-market-700"
                onClick={() => navigate("/market")}
              >
                Return to Market
              </Button>
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
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-center mb-8">
              {paymentComplete ? "Payment Successful" : "Complete Your Payment"}
            </h1>
            
            {paymentComplete ? (
              <div className="bg-white rounded-lg shadow p-6 mb-8">
                <div className="text-center mb-6">
                  <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <Check className="h-8 w-8 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
                  <p className="text-gray-600 mb-4">Thank you for your order. Your payment has been processed successfully.</p>
                </div>
                
                {transactionDetails && (
                  <div className="border-t pt-4 mt-4 mb-6">
                    <h3 className="font-semibold mb-3">Transaction Details</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p className="text-gray-500">Transaction ID:</p>
                      <p>{transactionDetails.id}</p>
                      <p className="text-gray-500">Date:</p>
                      <p>{new Date(transactionDetails.timestamp).toLocaleString()}</p>
                      <p className="text-gray-500">Payment Method:</p>
                      <p>{transactionDetails.cardType} ending in {transactionDetails.cardLast4}</p>
                      <p className="text-gray-500">Amount:</p>
                      <p>${transactionDetails.amount.toFixed(2)}</p>
                      <p className="text-gray-500">Order ID:</p>
                      <p>{orderId}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button onClick={handleNavigateToMarket} variant="outline" className="flex-1">
                    Continue Shopping
                  </Button>
                  <Button onClick={handleNavigateToOrders} className="flex-1">
                    View My Orders
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                  <PaymentForm 
                    amount={amount} 
                    onPaymentComplete={handlePaymentComplete}
                    onCancel={handleNavigateToMarket}
                  />
                </div>
                
                <div className="md:col-span-1">
                  {orderSummary && (
                    <Card className="p-4">
                      <h3 className="font-bold text-lg mb-4">Order Summary</h3>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-500">Order ID</p>
                          <p className="font-medium">{orderSummary.id.slice(0, 8)}...</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500">Shipping Address</p>
                          <p className="font-medium">{orderSummary.shipping_address}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500 mb-2">Items</p>
                          <div className="space-y-2">
                            {orderSummary.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span>{item.product_name} x {item.quantity}</span>
                                <span>${(item.unit_price * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="border-t pt-3 mt-3">
                          <div className="flex justify-between font-bold">
                            <span>Total</span>
                            <span>${orderSummary.total_amount.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}
                  
                  <Alert className="mt-4 bg-blue-50 border-blue-200">
                    <AlertTitle>Test Payment</AlertTitle>
                    <AlertDescription>
                      This is a mock payment system. No real payments will be processed.
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </CartProvider>
  );
};

export default Payment;
