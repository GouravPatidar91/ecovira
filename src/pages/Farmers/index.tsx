
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Tractor } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Seller } from "./types";
import FarmersList from "./components/FarmersList";
import SellerDashboard from "./components/SellerDashboard";
import RegistrationSheet from "./components/RegistrationSheet";

const Farmers = () => {
  const navigate = useNavigate();
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [isSeller, setIsSeller] = useState(false);
  const [isSellerPanelOpen, setIsSellerPanelOpen] = useState(false);

  useEffect(() => {
    fetchSellers();
    checkSellerStatus();
  }, []);

  const checkSellerStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (error) throw error;
        setIsSeller(data.role === 'farmer');
      }
    } catch (error) {
      console.error('Error checking seller status:', error);
    }
  };

  const fetchSellers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, business_name, location, bio, role, avatar_url')
        .eq('role', 'farmer');

      if (error) throw error;
      setSellers(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load farmers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContinueToRegistration = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      // Check if user needs verification
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('verification_status')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      if (profile?.verification_status === 'pending') {
        toast({
          title: "Verification Pending",
          description: "Your seller verification is still under review",
        });
        setIsSellerPanelOpen(false);
        return;
      }

      if (profile?.verification_status === 'verified') {
        navigate('/dashboard/products');
        return;
      }

      // If not verified, redirect to verification
      navigate('/seller-verification');
    } else {
      // If not logged in, redirect to auth
      navigate('/auth?mode=seller');
    }
    setIsSellerPanelOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4 bg-gradient-to-r from-market-50 to-market-100">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
              Meet Our Local Farmers
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Connect with passionate farmers who bring fresh, quality produce directly to your table
            </p>
            {!isSeller && (
              <Button 
                size="lg"
                className="bg-market-600 hover:bg-market-700"
                onClick={() => setIsSellerPanelOpen(true)}
              >
                <Tractor className="mr-2 h-5 w-5" />
                Join as a Farmer
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Sellers Section */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          {isSeller && <SellerDashboard />}
          <FarmersList sellers={sellers} loading={loading} />
        </div>
      </section>

      <RegistrationSheet 
        isOpen={isSellerPanelOpen}
        onOpenChange={setIsSellerPanelOpen}
        onContinue={handleContinueToRegistration}
      />
    </div>
  );
};

export default Farmers;
