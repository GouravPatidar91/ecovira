
import React from "react";
import { CartItem } from "@/contexts/CartContext";

interface OrderSummaryProps {
  items: CartItem[];
  shippingAddress: string;
  calculateTotal: () => number;
}

const OrderSummary = ({ items, shippingAddress, calculateTotal }: OrderSummaryProps) => {
  return (
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
  );
};

export default OrderSummary;
