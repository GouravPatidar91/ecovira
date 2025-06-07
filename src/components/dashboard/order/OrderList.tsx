
import React from "react";
import { Loader2 } from "lucide-react";
import { useSellerOrders } from "@/hooks/useSellerOrders";
import OrderTable from "./OrderTable";

const OrderList = () => {
  const { orders, isLoading, updateOrderStatus, markOrderAsViewed } = useSellerOrders();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <OrderTable 
        orders={orders}
        onUpdateStatus={updateOrderStatus}
        onMarkAsViewed={markOrderAsViewed}
      />
    </div>
  );
};

export default OrderList;
