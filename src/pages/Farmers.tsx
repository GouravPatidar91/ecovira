import Navigation from "@/components/Navigation";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CartProvider } from "@/contexts/CartContext";
import { Seller } from "./Farmers/types";
import FarmerHero from "./Farmers/components/FarmerHero";
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
  const [userProfile, setUserProfile] = useState<Seller | null>(null);

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
          .select('id, business_name, location, bio, role, avatar_url, verification_status')
          .eq('id', session.user.id)
          .single();

        if (error) throw error;
        
        setUserProfile(data);
        setIsSeller(data.role === 'farmer');
        setVerificationStatus(data.verification_status);
        
        if (data.verification_status === 'pending' && !sessionStorage.getItem('pending_toast_shown')) {
          toast({
            title: "Verification Pending",
            description: "Your seller verification is still under review.",
          });
          sessionStorage.setItem('pending_toast_shown', 'true');
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

  const handleAvatarChange = () => {
    fetchSellers();
    checkSellerStatus();
  };

  return (
    <CartProvider>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        
        <FarmerHero 
          isSeller={isSeller} 
          onJoinAsFarmer={handleJoinAsFarmer} 
        />

        <section className="py-12 px-4">
          <div className="container mx-auto max-w-6xl">
            {isSeller && verificationStatus === 'verified' && userProfile && (
              <SellerDashboard userProfile={userProfile} onAvatarChange={handleAvatarChange} />
            )}
            {isSeller && verificationStatus === 'pending' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
                <h2 className="text-lg font-semibold text-yellow-800">Verification Pending</h2>
                <p className="text-yellow-700">
                  Your seller verification is currently under review. You'll be notified once your application is approved.
                </p>
              </div>
            )}
            {isSeller && verificationStatus === 'rejected' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
                <h2 className="text-lg font-semibold text-red-800">Verification Rejected</h2>
                <p className="text-red-700">
                  Your seller verification was not approved. Please contact support for more information.
                </p>
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                      <div className="w-16 h-16 bg-gray-200 rounded-full mb-4" />
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sellers.map((seller) => (
                  <SellerCard key={seller.id} seller={seller} />
                ))}
              </div>
            )}
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
