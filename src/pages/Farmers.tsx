
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ShoppingBasket, Tractor } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface Seller {
  id: string;
  business_name: string | null;
  location: string | null;
  bio: string | null;
  role: 'farmer' | 'buyer' | 'admin';
  avatar_url: string | null;
}

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

  const handleJoinAsFarmer = () => {
    setIsSellerPanelOpen(true);
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
                onClick={handleJoinAsFarmer}
              >
                <Tractor className="mr-2 h-5 w-5" />
                Join as a Farmer
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Sellers Grid */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          {isSeller && (
            <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border">
              <h2 className="text-xl font-semibold mb-4">Seller Dashboard</h2>
              <div className="flex gap-4">
                <Button 
                  onClick={() => navigate('/dashboard/products')}
                  className="bg-market-600 hover:bg-market-700"
                >
                  Manage Products
                </Button>
                <Button 
                  onClick={() => navigate('/dashboard/orders')}
                  variant="outline"
                >
                  View Orders
                </Button>
              </div>
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
                <div key={seller.id} className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start space-x-4">
                    <div className="relative">
                      <img
                        src={seller.avatar_url || "https://via.placeholder.com/64"}
                        alt={seller.business_name || "Farmer"}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{seller.business_name || "Unknown Farmer"}</h3>
                      <p className="text-gray-500 text-sm">{seller.location || "Location not specified"}</p>
                      <p className="text-gray-600 mt-2">{seller.bio || "No bio available"}</p>
                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/market?seller=${seller.id}`)}
                          className="w-full"
                        >
                          <ShoppingBasket className="w-4 h-4 mr-1" />
                          View Products
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Seller Registration Sheet */}
      <Sheet open={isSellerPanelOpen} onOpenChange={setIsSellerPanelOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Become a Farmer</SheetTitle>
            <SheetDescription>
              Join our community of local farmers and start selling your produce today.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <p className="text-sm text-gray-600">
              To become a farmer on our platform, you'll need to:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-2">
              <li>Create an account or sign in</li>
              <li>Complete your business profile</li>
              <li>Add your products</li>
              <li>Start selling to local customers</li>
            </ul>
            <div className="pt-6">
              <Button 
                className="w-full"
                onClick={() => {
                  setIsSellerPanelOpen(false);
                  navigate("/auth?mode=seller");
                }}
              >
                Continue to Registration
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Farmers;
