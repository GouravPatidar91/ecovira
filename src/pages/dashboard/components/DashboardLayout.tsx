
import React from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { LayoutGrid, Package, ShoppingCart, Settings, LogOut } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const checkUserStatus = async () => {
      if (!user) {
        console.log("No user found, redirecting to auth");
        navigate("/auth");
        return;
      }
      
      try {
        console.log("Checking verification status for user:", user.id);
        const { data, error } = await supabase
          .from('profiles')
          .select('role, verification_status')
          .eq('id', user.id)
          .maybeSingle();
          
        if (error) {
          console.error('Error checking user status:', error);
          toast({
            title: "Error",
            description: "Could not verify your account status",
            variant: "destructive",
          });
          navigate("/");
          return;
        }
        
        console.log("User profile data:", data);
        
        if (data?.role === 'farmer' && data?.verification_status === 'verified') {
          console.log("User is a verified farmer, allowing access");
          setIsVerified(true);
        } else {
          console.log("User is not a verified farmer, redirecting");
          toast({
            title: "Access Denied",
            description: "You need to be a verified seller to access this dashboard",
            variant: "destructive",
          });
          navigate("/farmers");
        }
      } catch (error) {
        console.error('Error in dashboard:', error);
        toast({
          title: "Error",
          description: "An error occurred while loading your dashboard",
          variant: "destructive",
        });
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };
    
    checkUserStatus();
  }, [user, navigate, toast]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto p-6 mt-8">
          <h1 className="text-2xl font-bold mb-6">Seller Dashboard</h1>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isVerified) {
    return null; // Already redirected by the useEffect
  }
  
  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar className="border-r border-gray-200">
        <SidebarContent>
          <div className="px-6 py-4">
            <h2 className="text-lg font-semibold text-market-700">Seller Dashboard</h2>
          </div>
          <SidebarGroup>
            <SidebarGroupLabel>Management</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <a href="/dashboard/seller" className="flex items-center">
                      <LayoutGrid className="mr-2 h-4 w-4" />
                      <span>Overview</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <a href="/dashboard/products" className="flex items-center">
                      <Package className="mr-2 h-4 w-4" />
                      <span>Products</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <a href="/dashboard/orders" className="flex items-center">
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      <span>Orders</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>Account</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <a href="/dashboard/settings" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={handleSignOut} className="flex items-center text-red-500">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <div className="flex-1">
        <Navigation />
        <main className="container mx-auto p-6 mt-4">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
