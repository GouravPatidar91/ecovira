
import DashboardLayout from "@/components/DashboardLayout";
import OrderList from "@/components/dashboard/order/OrderList";

const Orders = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold">Orders</h1>
        </div>
        <OrderList />
      </div>
    </DashboardLayout>
  );
};

export default Orders;
