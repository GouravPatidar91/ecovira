
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
      <div className="min-h-screen flex bg-gradient-to-br from-zinc-900 via-market-900/90 to-market-800/90">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-12 gap-7">
            {/* Sidebar */}
            <div className="col-span-12 md:col-span-3 space-y-2 bg-gradient-to-b from-zinc-900/80 via-market-800/70 to-zinc-700/80 rounded-2xl shadow-xl border border-market-600/15 p-5 mr-2 glassmorphic backdrop-blur-lg">
              <Button 
                variant="ghost" 
                className="w-full justify-start text-market-100 hover:bg-market-600/30 transition"
                onClick={() => navigate("/dashboard/products")}
              >
                <Package className="mr-2 h-4 w-4" />
                Products
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-market-100 hover:bg-market-600/30 transition"
                onClick={() => navigate("/dashboard/orders")}
              >
                <List className="mr-2 h-4 w-4" />
                Orders
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-market-100 hover:bg-market-600/30 transition"
                onClick={() => navigate("/dashboard/inventory")}
              >
                <ShoppingBag className="mr-2 h-4 w-4" />
                Inventory
              </Button>
              {isAdmin && (
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-market-100 hover:bg-market-600/30 transition"
                  onClick={() => navigate("/dashboard/admin-verification")}
                >
                  <FileCheck className="mr-2 h-4 w-4" />
                  Verifications
                </Button>
              )}
            </div>
            {/* Main Content */}
            <div className="col-span-12 md:col-span-9">
              <div className="bg-gradient-to-br from-zinc-900/80 via-market-800/65 to-zinc-900/90 rounded-2xl shadow-xl border border-market-600/15 p-7 glassmorphic backdrop-blur-lg">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </CartProvider>
  );
};

export default DashboardLayout;
