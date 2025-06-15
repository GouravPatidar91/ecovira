
import { ReactNode, useEffect, useState } from "react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { Package, List, ShoppingBag, FileCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CartProvider } from "@/contexts/CartContext";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        setIsAdmin(data?.role === 'admin');
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  return (
    <CartProvider>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
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
              {isAdmin && (
                <Button 
                  variant="ghost" 
                  className="w-full justify-start"
                  onClick={() => navigate("/dashboard/admin-verification")}
                >
                  <FileCheck className="mr-2 h-4 w-4" />
                  Verifications
                </Button>
              )}
            </div>
            {/* Main Content */}
            <div className="col-span-12 md:col-span-9">
              {children}
            </div>
          </div>
        </div>
      </div>
    </CartProvider>
  );
};

export default DashboardLayout;
