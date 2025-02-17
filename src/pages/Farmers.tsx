
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Leaf, ShoppingBasket, MessageCircle, Tractor } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Messages } from "@/components/chat/Messages";

interface Seller {
  id: string;
  business_name: string | null;
  location: string | null;
  description: string | null;
  is_organic: boolean;
  avatar_url: string | null;
}

const Farmers = () => {
  const navigate = useNavigate();
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [isSeller, setIsSeller] = useState(false);

  useEffect(() => {
    fetchSellers();
    checkSellerStatus();
  }, []);

  const checkSellerStatus = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data } = await supabase
        .from('profiles')
        .select('role, is_seller')
        .eq('id', session.user.id)
        .single();
      
      setIsSeller(data?.is_seller || data?.role === 'farmer' || false);
    }
  };

  const fetchSellers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or('is_seller.eq.true,role.eq.farmer');

      if (error) throw error;
      setSellers((data || []).map(seller => ({
        id: seller.id,
        business_name: seller.business_name,
        location: seller.location,
        description: seller.description || seller.bio,
        is_organic: seller.is_organic || false,
        avatar_url: seller.avatar_url
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
                onClick={() => navigate("/auth?mode=seller")}
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
                        alt={seller.business_name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      {seller.is_organic && (
                        <div className="absolute -top-1 -right-1 bg-green-500 text-white p-1 rounded-full">
                          <Leaf className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{seller.business_name}</h3>
                      <p className="text-gray-500 text-sm">{seller.location}</p>
                      <p className="text-gray-600 mt-2">{seller.description}</p>
                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/market?seller=${seller.id}`)}
                        >
                          <ShoppingBasket className="w-4 h-4 mr-1" />
                          View Products
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                        >
                          <MessageCircle className="w-4 h-4 mr-1" />
                          Contact
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
    </div>
  );
};

export default Farmers;
