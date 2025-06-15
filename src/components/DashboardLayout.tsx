import { ReactNode, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CartProvider } from "@/contexts/CartContext";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import DashboardSidebar from "@/components/DashboardSidebar";

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
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-gradient-to-br from-zinc-900 via-market-900/90 to-market-800/90">
          <DashboardSidebar />
          <main className="flex-1 flex flex-col">
            <div className="p-4">
              <SidebarTrigger className="mb-4 md:hidden" />
              <div className="container mx-auto px-1 md:px-6 py-4">
                {children}
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    </CartProvider>
  );
};

export default DashboardLayout;
