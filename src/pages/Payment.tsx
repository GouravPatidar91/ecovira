
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navigation from "@/components/Navigation";
import PaymentForm from "@/components/PaymentForm";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { CartProvider } from "@/contexts/CartContext";

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [amount, setAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [orderExists, setOrderExists] = useState(false);

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
          .select('id, total_amount, payment_status')
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
        
        setOrderId(id);
        setAmount(parseFloat(total));
        setOrderExists(true);
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

  const handlePaymentComplete = async (paymentId: string) => {
    try {
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

      toast({
        title: "Payment Successful",
        description: "Your order has been placed successfully",
      });
      
      // Navigate to order confirmation page
      setTimeout(() => {
        navigate("/market");
      }, 1000);
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: "Payment Update Failed",
        description: "Your payment was processed but we couldn't update your order status",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    navigate("/market");
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
              <button 
                className="px-4 py-2 bg-market-600 text-white rounded hover:bg-market-700"
                onClick={() => navigate("/market")}
              >
                Return to Market
              </button>
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
            <h1 className="text-3xl font-bold text-center mb-8">Complete Your Payment</h1>
            <PaymentForm 
              amount={amount} 
              onPaymentComplete={handlePaymentComplete}
              onCancel={handleCancel}
            />
          </div>
        </div>
      </div>
    </CartProvider>
  );
};

export default Payment;
