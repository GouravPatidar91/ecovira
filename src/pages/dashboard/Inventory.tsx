
import DashboardLayout from "@/components/DashboardLayout";
import InventoryStatus from "@/components/dashboard/stats/InventoryStatus";
import SalesChart from "@/components/dashboard/stats/SalesChart";

const Inventory = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <SalesChart />
          <InventoryStatus />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Inventory;
