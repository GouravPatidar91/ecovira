
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import PaymentForm from "@/components/PaymentForm";
import OrderSummary from "@/components/payment/OrderSummary";
import { useAuth } from "@/contexts/AuthContext";

const PaymentContainer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { state: { items }, clearCart } = useCart();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [shippingAddress, setShippingAddress] = useState("");
  const [orderId, setOrderId] = useState<string | null>(null);
  
  useEffect(() => {
    const checkAuthAndCart = async () => {
      // Check authentication
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to complete your purchase",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }
      
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
    };
    
    checkAuthAndCart();
  }, [location.search, navigate, toast, items, user]);

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handlePaymentComplete = async (paymentId: string, transactionDetails: any) => {
    try {
      setIsLoading(true);
      
      // Verify authentication
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to complete your order",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      let orderData;
      
      if (!orderId) {
        // Generate a UUID on the client-side to avoid RLS policy issues
        const newOrderId = crypto.randomUUID();

        // Use the create_order RPC function to bypass RLS
        const { data, error } = await supabase.rpc(
          'create_order',
          { 
            p_buyer_id: user.id,
            p_total_amount: calculateTotal(),
            p_shipping_address: shippingAddress,
            p_order_id: newOrderId
          }
        );

        if (error) {
          console.error('Order creation error:', error);
          toast({
            title: "Order Creation Failed",
            description: "Could not create your order. Please try again.",
            variant: "destructive",
          });
          return;
        }
        
        orderData = { id: data || newOrderId };
        
        // Create order items one by one to avoid RLS issues
        for (const item of items) {
          const { error: itemError } = await supabase
            .from('order_items')
            .insert({
              order_id: orderData.id,
              product_id: item.product_id,
              quantity: item.quantity,
              unit_price: item.price,
              total_price: item.price * item.quantity
            });
            
          if (itemError) {
            console.error('Order item insert error:', itemError);
            // Continue with other items even if one fails
          }
        }
      } else {
        // Use existing order ID
        orderData = { id: orderId };
        
        // Update order status
        const { error: updateError } = await supabase
          .from('orders')
          .update({ 
            payment_status: 'paid',
            status: 'processing' 
          })
          .eq('id', orderId);
          
        if (updateError) {
          console.error('Error updating order status:', updateError);
        }
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

      // Clear cart and navigate to success page
      await clearCart();
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
    <div className="container mx-auto px-4 py-16">
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-market-600" />
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-8 text-center">Complete Your Payment</h1>
          
          <OrderSummary 
            items={items} 
            shippingAddress={shippingAddress}
            calculateTotal={calculateTotal}
          />
          
          <PaymentForm 
            amount={calculateTotal()}
            onPaymentComplete={handlePaymentComplete}
            onCancel={handleCancel}
          />
        </div>
      )}
    </div>
  );
};

export default PaymentContainer;
