
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
          <div className="rounded-2xl bg-gradient-to-br from-zinc-900/80 via-market-800/50 to-zinc-900/85 border border-market-500/20 shadow-xl glassmorphic p-3">
            <SalesChart />
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-zinc-900/80 via-market-800/50 to-zinc-900/85 border border-market-500/20 shadow-xl glassmorphic p-3">
            <InventoryStatus />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Inventory;
