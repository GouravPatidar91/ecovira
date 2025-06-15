
import { ReactNode, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CartProvider } from "@/contexts/CartContext";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
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
            {/* Sidebar removed */}
            {/* Main Content area - now full width */}
            <div className="col-span-12">
              <div className="p-7">
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
