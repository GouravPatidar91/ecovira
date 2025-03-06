
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const checkUserStatus = async () => {
      if (!user) {
        navigate("/auth");
        return;
      }
      
      try {
        // Check if the user is a verified farmer
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
        
        if (data?.role === 'farmer' && data?.verification_status === 'verified') {
          console.log("Verified farmer detected, redirecting to product management");
          // If verified farmer, stay on the products management page
          // We're already on dashboard/products, so we don't need to navigate
        } else if (data?.role === 'farmer' && data?.verification_status !== 'verified') {
          // If farmer but not verified
          toast({
            title: "Verification Required",
            description: "You need to be verified to access the seller dashboard",
          });
          navigate("/farmers");
        } else {
          // Regular user should also stay on this page
          console.log("Regular user, staying on dashboard page");
        }
      } catch (error) {
        console.error('Error in dashboard:', error);
        toast({
          title: "Error",
          description: "An error occurred while loading your dashboard",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    checkUserStatus();
  }, [user, navigate, toast]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto p-6 mt-8">
          <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto p-6 mt-8">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        {/* The actual dashboard content will be rendered by the nested routes */}
      </div>
    </div>
  );
};

export default Dashboard;
