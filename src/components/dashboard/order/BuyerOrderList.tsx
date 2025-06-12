
import React from "react";
import { Loader2 } from "lucide-react";
import { useBuyerOrders } from "@/hooks/useBuyerOrders";
import BuyerOrderTable from "./BuyerOrderTable";

const BuyerOrderList = () => {
  const { orders, isLoading } = useBuyerOrders();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <BuyerOrderTable orders={orders} />
    </div>
  );
};

export default BuyerOrderList;
