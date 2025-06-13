
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CreditCard, Package, MapPin, Calendar } from "lucide-react";
import { format } from "date-fns";

interface OrderItem {
  id: string;
  quantity: number;
  product_name: string;
  product_unit: string;
  unit_price: number;
  total_price: number;
  seller_name: string;
}

interface PaymentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  totalAmount: number;
  shippingAddress: string;
  orderItems: OrderItem[];
  orderDate: string;
  onPaymentComplete?: () => void;
}

const PaymentDetailsModal = ({
  isOpen,
  onClose,
  orderId,
  totalAmount,
  shippingAddress,
  orderItems,
  orderDate,
  onPaymentComplete
}: PaymentDetailsModalProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handlePayment = async () => {
    try {
      setIsProcessing(true);
      
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
        window.open(data.url, '_blank');
        
        toast({
          title: "Payment Session Created",
          description: "A new tab has opened for payment. Complete your payment there.",
        });

        onClose();
        
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Details
          </DialogTitle>
          <DialogDescription>
            Review your order details and proceed with payment
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Summary */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-gray-500" />
              <h3 className="font-medium">Order #{orderId.slice(0, 8)}</h3>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              Order Date: {format(new Date(orderDate), 'PPP')}
            </div>
          </div>

          <Separator />

          {/* Order Items */}
          <div className="space-y-4">
            <h4 className="font-medium">Items in this order:</h4>
            <div className="space-y-3">
              {orderItems.map((item) => (
                <div key={item.id} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.product_name}</p>
                    <p className="text-sm text-gray-600">Sold by: {item.seller_name}</p>
                    <p className="text-sm text-gray-600">
                      Quantity: {item.quantity} {item.product_unit}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${item.total_price.toFixed(2)}</p>
                    <p className="text-sm text-gray-500">
                      ${item.unit_price.toFixed(2)} per {item.product_unit}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Shipping Address */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <h4 className="font-medium">Shipping Address</h4>
            </div>
            <p className="text-gray-600 ml-6">{shippingAddress}</p>
          </div>

          <Separator />

          {/* Payment Summary */}
          <div className="space-y-3">
            <h4 className="font-medium">Payment Summary</h4>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium">Total Amount:</span>
                <span className="text-xl font-bold text-blue-600">
                  ${totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handlePayment}
              disabled={isProcessing}
              className="flex-1"
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
            
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isProcessing}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDetailsModal;
