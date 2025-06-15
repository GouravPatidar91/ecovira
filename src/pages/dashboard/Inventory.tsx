
import DashboardLayout from "@/components/DashboardLayout";
import InventoryStatus from "@/components/dashboard/stats/InventoryStatus";
import SalesChart from "@/components/dashboard/stats/SalesChart";

const Inventory = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-2xl font-extrabold text-market-100 drop-shadow">Dashboard</h1>
        </div>

        <div className="grid grid-cols-1 gap-7">
          {/* Removed unnecessary inner card wrappers */}
          <SalesChart />
          <InventoryStatus />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Inventory;
