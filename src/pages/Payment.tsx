
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { CartProvider } from "@/contexts/CartContext";
import PaymentForm from "@/components/PaymentForm";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      const params = new URLSearchParams(location.search);
      const id = params.get("orderId");

      if (!id) {
        toast({
          title: "Error",
          description: "Order ID is missing",
          variant: "destructive",
        });
        navigate("/market");
        return;
      }

      setOrderId(id);

      try {
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

        // Fetch order details
        const { data: order, error } = await supabase
          .from('orders')
          .select(`
            id,
            buyer_id,
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

        if (error || !order) {
          console.error('Error fetching order:', error);
          toast({
            title: "Error",
            description: "Could not retrieve order details",
            variant: "destructive",
          });
          navigate("/market");
          return;
        }

        // Validate this order belongs to the current user
        if (order.buyer_id !== session.user.id) {
          toast({
            title: "Unauthorized",
            description: "You don't have access to this order",
            variant: "destructive",
          });
          navigate("/market");
          return;
        }

        setOrderDetails(order);
      } catch (error) {
        console.error("Error fetching order details:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderDetails();
  }, [location.search, navigate, toast]);

  const handlePaymentComplete = (paymentId: string, transactionDetails: any) => {
    // Navigate to order processing page with orderId
    navigate(`/order-payment?orderId=${orderId}`);
  };

  const handleCancel = () => {
    toast({
      title: "Payment Canceled",
      description: "Your payment has been canceled",
    });
    navigate("/market");
  };

  return (
    <CartProvider>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-16">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-market-600" />
            </div>
          ) : orderDetails ? (
            <div className="max-w-2xl mx-auto">
              <h1 className="text-2xl font-bold mb-8 text-center">Complete Your Payment</h1>
              <div className="mb-6 bg-white rounded-lg shadow p-4">
                <h2 className="text-lg font-medium mb-2">Order Summary</h2>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Order ID:</span> {orderDetails.id}</p>
                  <p><span className="font-medium">Date:</span> {new Date(orderDetails.created_at).toLocaleString()}</p>
                  <p><span className="font-medium">Shipping Address:</span> {orderDetails.shipping_address}</p>
                  <div className="border-t border-gray-200 my-2 pt-2">
                    <p className="font-medium">Items:</p>
                    <ul className="mt-1 space-y-1">
                      {orderDetails.order_items?.map((item: any, idx: number) => (
                        <li key={idx} className="flex justify-between">
                          <span>
                            {item.products?.name || 'Product'} ({item.quantity} {item.quantity === 1 ? item.products?.unit || 'unit' : `${item.products?.unit || 'unit'}s`})
                          </span>
                          <span>${(item.unit_price * item.quantity).toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="border-t border-gray-200 my-2 pt-2">
                    <div className="flex justify-between font-medium">
                      <span>Total Amount:</span>
                      <span>${orderDetails.total_amount?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <PaymentForm 
                amount={orderDetails.total_amount}
                onPaymentComplete={handlePaymentComplete}
                onCancel={handleCancel}
              />
            </div>
          ) : (
            <div className="text-center">
              <p>No order details found. Please try again.</p>
            </div>
          )}
        </div>
      </div>
    </CartProvider>
  );
};

export default Payment;
