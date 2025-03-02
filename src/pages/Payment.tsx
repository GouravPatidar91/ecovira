
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

  useEffect(() => {
    // Get order information from URL params
    const urlParams = new URLSearchParams(location.search);
    const id = urlParams.get("orderId");
    const total = urlParams.get("amount");
    
    if (!id || !total) {
      toast({
        title: "Error",
        description: "Invalid payment information",
        variant: "destructive",
      });
      navigate("/market");
      return;
    }
    
    setOrderId(id);
    setAmount(parseFloat(total));
    setIsLoading(false);
  }, [location, navigate, toast]);

  const handlePaymentComplete = async (paymentId: string) => {
    try {
      // Update order with payment details
      const { error } = await supabase
        .from('orders')
        .update({ 
          payment_status: 'paid',
          status: 'processing'
        })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Payment Successful",
        description: "Your order has been placed successfully",
      });
      
      // Navigate to order confirmation page
      setTimeout(() => {
        navigate("/dashboard/orders");
      }, 1000);
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: "Error",
        description: "Failed to update order status",
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
