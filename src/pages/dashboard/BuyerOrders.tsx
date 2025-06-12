
import React from "react";
import DashboardLayout from "@/components/DashboardLayout";
import BuyerOrderList from "@/components/dashboard/order/BuyerOrderList";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Package, InfoIcon } from "lucide-react";

const BuyerOrders = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Package className="h-6 w-6 text-market-600" />
            <h1 className="text-2xl font-semibold">My Orders</h1>
          </div>
        </div>

        <Alert className="bg-blue-50 border-blue-200">
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            Track your order status here. You can pay for accepted orders and monitor delivery progress.
          </AlertDescription>
        </Alert>
        
        <BuyerOrderList />
      </div>
    </DashboardLayout>
  );
};

export default BuyerOrders;
