
import Navigation from "@/components/Navigation";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Seller } from "./Farmers/types";
import FarmerHero from "./Farmers/components/FarmerHero";
import SellerCard from "./Farmers/components/SellerCard";
import SellerDashboard from "./Farmers/components/SellerDashboard";
import SellerRegistrationSheet from "./Farmers/components/SellerRegistrationSheet";
import { ErrorBoundary } from "react-error-boundary";

const Farmers = () => {
  const navigate = useNavigate();
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [isSeller, setIsSeller] = useState(false);
  const [isSellerPanelOpen, setIsSellerPanelOpen] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          // Don't navigate away - users can browse farmers without logging in
          return;
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      }
    };

    checkAuth();
    fetchSellers();
    checkSellerStatus();
  }, []);

  const checkSellerStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return; // User not logged in
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .select('role, verification_status')
        .eq('id', session.user.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking seller status:', error);
        return;
      }
      
      if (data) {
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
      setLoading(true);
      setFetchError(false);

      const { data, error } = await supabase
        .from('profiles')
        .select('id, business_name, location, bio, role, avatar_url')
        .eq('role', 'farmer')
        .eq('verification_status', 'verified'); // Only show verified sellers

      if (error) {
        console.error("Error fetching sellers:", error);
        setFetchError(true);
        toast({
          title: "Error",
          description: "Failed to load farmers",
          variant: "destructive",
        });
        return;
      }
      
      setSellers(data || []);
    } catch (error) {
      console.error("Error in fetchSellers:", error);
      setFetchError(true);
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
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('verification_status')
          .eq('id', session.user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching profile:', error);
          toast({
            title: "Error",
            description: "Could not check profile status",
            variant: "destructive",
          });
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
    } catch (error) {
      console.error("Error in registration flow:", error);
      toast({
        title: "Error",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Fallback UI for errors
  const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error, resetErrorBoundary: () => void }) => (
    <div className="p-8 text-center">
      <h2 className="text-xl font-semibold text-red-600 mb-2">Something went wrong</h2>
      <p className="mb-4">We're having trouble loading the farmers page.</p>
      <Button onClick={() => {
        resetErrorBoundary();
        window.location.reload();
      }}>
        Try Again
      </Button>
    </div>
  );

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        
        <FarmerHero 
          isSeller={isSeller} 
          onJoinAsFarmer={handleJoinAsFarmer} 
        />

        <section className="py-12 px-4">
          <div className="container mx-auto max-w-6xl">
            {isSeller && verificationStatus === 'verified' && (
              <ErrorBoundary FallbackComponent={() => (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
                  <h2 className="text-lg font-semibold text-red-800">Could not load dashboard</h2>
                  <p className="text-red-700">There was a problem loading your seller dashboard.</p>
                </div>
              )}>
                <SellerDashboard />
              </ErrorBoundary>
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
            ) : fetchError ? (
              <div className="text-center py-10">
                <p className="text-gray-500 mb-4">We couldn't load the farmers list. Please try again later.</p>
                <Button onClick={fetchSellers} variant="outline">
                  Retry
                </Button>
              </div>
            ) : sellers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sellers.map((seller) => (
                  <SellerCard key={seller.id} seller={seller} />
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-500">No verified farmers available at the moment.</p>
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
    </ErrorBoundary>
  );
};

export default Farmers;
