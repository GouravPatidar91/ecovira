
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const checkUserStatus = async () => {
      console.log("Dashboard - Auth loading:", loading);
      console.log("Dashboard - User:", user);
      
      // Wait until auth loading is complete
      if (loading) {
        return;
      }
      
      if (!user) {
        console.log("No user found, redirecting to auth");
        navigate("/auth", { state: { from: location.pathname } });
        return;
      }
      
      try {
        console.log("Checking user profile");
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
        
        console.log("User profile data:", data);
        
        if (data?.role === 'farmer' && data?.verification_status === 'verified') {
          console.log("Verified farmer detected");
          // If current path is just /dashboard, redirect to seller dashboard
          if (location.pathname === '/dashboard') {
            console.log("Redirecting to products dashboard");
            navigate('/dashboard/products');
          }
          // Else we're already on a dashboard subpage, so we don't need to navigate
        } else if (data?.role === 'farmer' && data?.verification_status !== 'verified') {
          // If farmer but not verified
          toast({
            title: "Verification Required",
            description: "You need to be verified to access the seller dashboard",
          });
          navigate("/farmers");
        } else {
          // Regular user dashboard (not implemented yet)
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
  }, [user, navigate, toast, location.pathname, loading]);
  
  if (loading || isLoading) {
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
  
  // If the user is not authenticated, this component will redirect in the useEffect
  // So we only render the dashboard if we have a user
  return user ? (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto p-6 mt-8">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        {/* The actual dashboard content will be rendered by the nested routes */}
      </div>
    </div>
  ) : null;
};

export default Dashboard;
