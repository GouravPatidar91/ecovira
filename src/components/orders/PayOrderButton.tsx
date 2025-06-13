
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CreditCard } from "lucide-react";

interface PayOrderButtonProps {
  orderId: string;
  totalAmount: number;
  shippingAddress: string;
  onPaymentComplete?: () => void;
}

const PayOrderButton = ({ 
  orderId, 
  totalAmount, 
  shippingAddress, 
  onPaymentComplete 
}: PayOrderButtonProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handlePayment = async () => {
    try {
      setIsProcessing(true);
      
      // Create payment session for this specific order
      const { data, error } = await supabase.functions.invoke('create-order-payment', {
        body: {
          orderId,
          amount: totalAmount,
          shippingAddress
        }
      });

      if (error) {
        console.error('Payment creation error:', error);
        toast({
          title: "Payment Error",
          description: "Failed to create payment session. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (data?.url) {
        // Open payment in new tab
        window.open(data.url, '_blank');
        
        toast({
          title: "Payment Session Created",
          description: "A new tab has opened for payment. Complete your payment there.",
        });

        // Optional: Call onPaymentComplete callback
        if (onPaymentComplete) {
          onPaymentComplete();
        }
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Button 
      onClick={handlePayment}
      disabled={isProcessing}
      className="w-full sm:w-auto"
    >
      {isProcessing ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Creating Payment...
        </>
      ) : (
        <>
          <CreditCard className="mr-2 h-4 w-4" />
          Pay ${totalAmount.toFixed(2)}
        </>
      )}
    </Button>
  );
};

export default PayOrderButton;
