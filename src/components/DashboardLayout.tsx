
import { ReactNode } from "react";
import Navigation from "./Navigation";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { Package, List, ShoppingBag } from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <div className="col-span-12 md:col-span-3 space-y-2">
            <Button 
              variant="ghost" 
              className="w-full justify-start"
              onClick={() => navigate("/dashboard/products")}
            >
              <Package className="mr-2 h-4 w-4" />
              Products
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start"
              onClick={() => navigate("/dashboard/orders")}
            >
              <List className="mr-2 h-4 w-4" />
              Orders
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start"
              onClick={() => navigate("/dashboard/inventory")}
            >
              <ShoppingBag className="mr-2 h-4 w-4" />
              Inventory
            </Button>
          </div>
          {/* Main Content */}
          <div className="col-span-12 md:col-span-9">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
