import Navigation from "@/components/Navigation";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CartProvider } from "@/contexts/CartContext";
import { Seller } from "./Farmers/types";
import FarmerHero from "./Farmers/components/FarmerHero";
import FarmersList from "./Farmers/components/FarmersList";
import SellerCard from "./Farmers/components/SellerCard";
import SellerDashboard from "./Farmers/components/SellerDashboard";
import SellerRegistrationSheet from "./Farmers/components/SellerRegistrationSheet";

const Farmers = () => {
  const navigate = useNavigate();
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [isSeller, setIsSeller] = useState(false);
  const [isSellerPanelOpen, setIsSellerPanelOpen] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);

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
          .select('role, verification_status')
          .eq('id', session.user.id)
          .single();

        if (error) throw error;
        
        setIsSeller(data.role === 'farmer');
        setVerificationStatus(data.verification_status);
        
        // If verification is pending, show a message
        if (data.verification_status === 'pending') {
          toast({
            title: "Verification Pending",
            description: "Your seller verification is still under review.",
          });
        }
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
        .eq('role', 'farmer')
        .eq('verification_status', 'verified'); // Only show verified sellers

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

  const handleJoinAsFarmer = () => {
    setIsSellerPanelOpen(true);
  };

  const handleContinueToRegistration = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
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
          description: "Your seller verification is still under review. You'll be notified once approved.",
        });
        setIsSellerPanelOpen(false);
        return;
      }

      if (profile?.verification_status === 'verified') {
        navigate('/dashboard/products');
        return;
      }

      navigate('/seller-verification');
    } else {
      navigate('/auth?mode=seller');
    }
    setIsSellerPanelOpen(false);
  };

  return (
    <CartProvider>
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-market-900/90 to-market-800/95 transition-colors duration-500">
        <Navigation />
        
        <FarmerHero 
          isSeller={isSeller} 
          onJoinAsFarmer={handleJoinAsFarmer} 
        />

        <section className="py-14 px-4">
          <div className="container mx-auto max-w-6xl">
            {isSeller && verificationStatus === 'verified' && <SellerDashboard />}
            {isSeller && verificationStatus === 'pending' && (
              <div className="bg-yellow-300/10 border border-yellow-400/20 rounded-xl p-6 mb-8 shadow-lg glassmorphic">
                <h2 className="text-lg font-semibold text-yellow-200">Verification Pending</h2>
                <p className="text-yellow-200">
                  Your seller verification is currently under review. You'll be notified once your application is approved.
                </p>
              </div>
            )}
            {isSeller && verificationStatus === 'rejected' && (
              <div className="bg-red-400/10 border border-red-400/20 rounded-xl p-6 mb-8 shadow-lg glassmorphic">
                <h2 className="text-lg font-semibold text-red-200">Verification Rejected</h2>
                <p className="text-red-200">
                  Your seller verification was not approved. Please contact support for more information.
                </p>
              </div>
            )}

            <FarmersList sellers={sellers} loading={loading} />
          </div>
        </section>

        <SellerRegistrationSheet 
          isOpen={isSellerPanelOpen}
          onOpenChange={setIsSellerPanelOpen}
          onContinue={handleContinueToRegistration}
        />
      </div>
    </CartProvider>
  );
};

export default Farmers;
