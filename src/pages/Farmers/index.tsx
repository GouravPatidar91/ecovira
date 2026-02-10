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
  const [userProfile, setUserProfile] = useState<Seller | null>(null);

  useEffect(() => {
    fetchSellers();
    checkSellerStatus();
  }, []);

  const checkSellerStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Use the RPC function that joins profiles with user_roles
        const { data, error } = await supabase.rpc('get_user_profile_with_role', {
          p_user_id: session.user.id
        });

        if (error) throw error;
        
        if (data && data.length > 0) {
          const profile = data[0];
          setUserProfile({
            id: profile.id,
            business_name: profile.business_name,
            location: profile.location,
            bio: profile.bio,
            role: profile.role as 'farmer' | 'buyer' | 'admin',
            avatar_url: profile.avatar_url,
          });
          setIsSeller(profile.role === 'farmer');
        }
      }
    } catch (error) {
      console.error('Error checking seller status:', error);
    }
  };

  const fetchSellers = async () => {
    try {
      // Use the RPC function for verified farmers
      const { data, error } = await supabase.rpc('get_verified_farmers');

      if (error) throw error;
      setSellers((data || []).map((f: any) => ({
        id: f.id,
        business_name: f.business_name,
        location: f.location,
        bio: f.bio,
        role: 'farmer' as const,
        avatar_url: f.avatar_url,
      })));
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

  const handleAvatarChange = () => {
    checkSellerStatus();
    fetchSellers();
  };

  const handleContinueToRegistration = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('verification_status')
        .eq('id', session.user.id)
        .maybeSingle();

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

      navigate('/seller-verification');
    } else {
      navigate('/auth?mode=seller');
    }
    setIsSellerPanelOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
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

      <section className="py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          {isSeller && userProfile && (
            <SellerDashboard userProfile={userProfile} onAvatarChange={handleAvatarChange} />
          )}
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
