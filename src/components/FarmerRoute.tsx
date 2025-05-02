
import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface FarmerRouteProps {
  children: ReactNode;
}

const FarmerRoute = ({ children }: FarmerRouteProps) => {
  const [isVerifiedFarmer, setIsVerifiedFarmer] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkFarmerStatus();
  }, []);

  const checkFarmerStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please log in to access the farmer dashboard",
          variant: "destructive",
        });
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('role, verification_status')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;

      if (data.role !== 'farmer' || data.verification_status !== 'verified') {
        toast({
          title: "Access Denied",
          description: "Only verified farmers can access this dashboard",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      setIsVerifiedFarmer(true);
    } catch (error) {
      console.error('Error checking farmer status:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return isVerifiedFarmer ? <>{children}</> : null;
};

export default FarmerRoute;
