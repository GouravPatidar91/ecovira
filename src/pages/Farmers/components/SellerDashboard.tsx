
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const SellerDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const checkSellerStatus = async () => {
      try {
        setIsLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate("/auth");
          return;
        }
        
        const { data, error } = await supabase
          .from('profiles')
          .select('role, verification_status')
          .eq('id', session.user.id)
          .single();

        if (error) throw error;
        
        if (data.role !== 'farmer' || data.verification_status !== 'verified') {
          setHasError(true);
          toast({
            title: "Access Denied",
            description: "You need to be a verified seller to access this dashboard.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error checking seller status:', error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    checkSellerStatus();
  }, [navigate, toast]);

  const handleManageProducts = () => {
    console.log("Navigating to seller dashboard");
    navigate('/dashboard/seller');
  };

  const handleViewOrders = () => {
    console.log("Navigating to orders view");
    navigate('/dashboard/orders');
  };

  if (isLoading) {
    return <div className="p-6 bg-white rounded-lg shadow-sm border">Loading dashboard...</div>;
  }

  if (hasError) {
    return null; // Don't show the dashboard if there's an error
  }

  return (
    <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border">
      <h2 className="text-xl font-semibold mb-4">Seller Dashboard</h2>
      <div className="flex gap-4">
        <Button 
          onClick={handleManageProducts}
          className="bg-market-600 hover:bg-market-700"
        >
          Manage Products
        </Button>
        <Button 
          onClick={handleViewOrders}
          variant="outline"
        >
          View Orders
        </Button>
      </div>
    </div>
  );
};

export default SellerDashboard;
