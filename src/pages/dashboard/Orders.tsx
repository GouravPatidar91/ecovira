
import DashboardLayout from "@/components/DashboardLayout";
import OrderList from "@/components/dashboard/order/OrderList";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bell } from "lucide-react";
import { useSellerOrders } from "@/hooks/useSellerOrders";

const Orders = () => {
  const { newOrdersCount } = useSellerOrders();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold">Orders</h1>
          {newOrdersCount > 0 && (
            <div className="flex items-center text-market-600">
              <Bell className="h-5 w-5 mr-1" />
              <span>{newOrdersCount} new order{newOrdersCount === 1 ? '' : 's'} to review</span>
            </div>
          )}
        </div>

        {newOrdersCount > 0 && (
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertDescription>
              <span className="font-bold">Action Required:</span> You have {newOrdersCount} new {newOrdersCount === 1 ? 'order' : 'orders'} from customers! 
              Please review and either accept or decline them.
            </AlertDescription>
          </Alert>
        )}
        
        <OrderList />
      </div>
    </DashboardLayout>
  );
};

export default Orders;
