
import React from "react";
import { CartProvider } from "@/contexts/CartContext";
import Navigation from "@/components/Navigation";
import PaymentContainer from "@/components/payment/PaymentContainer";

// Main component that provides the cart context
const Payment = () => {
  return (
    <CartProvider>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <PaymentContainer />
      </div>
    </CartProvider>
  );
};

export default Payment;
