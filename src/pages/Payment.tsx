
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { CartProvider, useCart } from "@/contexts/CartContext";
import PaymentForm from "@/components/PaymentForm";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

// Create a wrapper component that will be inside CartProvider
const PaymentContent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { state: { items }, clearCart } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [shippingAddress, setShippingAddress] = useState("");
  
  useEffect(() => {
    // Extract shipping address from URL parameter
    const params = new URLSearchParams(location.search);
    const address = params.get("address");
    
    if (!address) {
      toast({
        title: "Error",
        description: "Shipping address is missing",
        variant: "destructive",
      });
      navigate("/market");
      return;
    }

    setShippingAddress(address);
    
    // Check if cart is empty
    if (items.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Your shopping cart is empty",
        variant: "destructive",
      });
      navigate("/market");
      return;
    }
  }, [location.search, navigate, toast, items]);

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handlePaymentComplete = async (paymentId: string, transactionDetails: any) => {
    try {
      setIsLoading(true);
      
      // Get the session to check authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please log in to complete your order",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      // Create the order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          buyer_id: session.user.id,
          total_amount: calculateTotal(),
          shipping_address: shippingAddress,
          status: 'processing',
          payment_status: 'paid'
        })
        .select()
        .single();

      if (orderError) {
        console.error('Order creation error:', orderError);
        toast({
          title: "Order Creation Failed",
          description: "Could not create your order. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Create order items
      const orderItems = items.map(item => ({
        order_id: orderData.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Order items error:', itemsError);
        
        // Clean up the order since the items couldn't be added
        await supabase.from('orders').delete().eq('id', orderData.id);
        
        toast({
          title: "Order Items Failed",
          description: "Could not add items to your order. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Create payment transaction record
      const { error: paymentError } = await supabase
        .from('payment_transactions')
        .insert({
          order_id: orderData.id,
          amount: calculateTotal(),
          payment_id: paymentId,
          transaction_id: transactionDetails.id,
          payment_method: 'card',
          metadata: transactionDetails
        });

      if (paymentError) {
        console.error('Payment record error:', paymentError);
      }

      // Clear cart
      await clearCart();
      
      // Navigate to order processing page with orderId
      navigate(`/order-payment?orderId=${orderData.id}`);
    } catch (error) {
      console.error('Error during order creation:', error);
      toast({
        title: "Order Processing Error",
        description: "Failed to process your order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    toast({
      title: "Payment Canceled",
      description: "Your payment has been canceled",
    });
    navigate("/market");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-16">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-market-600" />
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-8 text-center">Complete Your Payment</h1>
            <div className="mb-6 bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-medium mb-2">Order Summary</h2>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Shipping Address:</span> {shippingAddress}</p>
                <div className="border-t border-gray-200 my-2 pt-2">
                  <p className="font-medium">Items:</p>
                  <ul className="mt-1 space-y-1">
                    {items.map((item, idx) => (
                      <li key={idx} className="flex justify-between">
                        <span>
                          {item.name} ({item.quantity} {item.quantity === 1 ? item.unit : `${item.unit}s`})
                        </span>
                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="border-t border-gray-200 my-2 pt-2">
                  <div className="flex justify-between font-medium">
                    <span>Total Amount:</span>
                    <span>${calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <PaymentForm 
              amount={calculateTotal()}
              onPaymentComplete={handlePaymentComplete}
              onCancel={handleCancel}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// Main component that provides the cart context
const Payment = () => {
  return (
    <CartProvider>
      <PaymentContent />
    </CartProvider>
  );
};

export default Payment;
