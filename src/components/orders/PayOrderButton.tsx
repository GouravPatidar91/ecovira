
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";
import PaymentDetailsModal from "./PaymentDetailsModal";

interface OrderItem {
  id: string;
  quantity: number;
  product_name: string;
  product_unit: string;
  unit_price: number;
  total_price: number;
  seller_name: string;
}

interface PayOrderButtonProps {
  orderId: string;
  totalAmount: number;
  shippingAddress: string;
  orderItems: OrderItem[];
  orderDate: string;
  onPaymentComplete?: () => void;
}

const PayOrderButton = ({ 
  orderId, 
  totalAmount, 
  shippingAddress,
  orderItems,
  orderDate,
  onPaymentComplete 
}: PayOrderButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePayClick = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <Button 
        onClick={handlePayClick}
        className="w-full sm:w-auto"
      >
        <CreditCard className="mr-2 h-4 w-4" />
        Pay ${totalAmount.toFixed(2)}
      </Button>

      <PaymentDetailsModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        orderId={orderId}
        totalAmount={totalAmount}
        shippingAddress={shippingAddress}
        orderItems={orderItems}
        orderDate={orderDate}
        onPaymentComplete={() => {
          if (onPaymentComplete) {
            onPaymentComplete();
          }
          handleModalClose();
        }}
      />
    </>
  );
};

export default PayOrderButton;
