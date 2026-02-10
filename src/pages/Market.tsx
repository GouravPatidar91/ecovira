
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Search, Filter } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CartProvider } from "@/contexts/CartContext";

interface Product {
  id: string;
  name: string;
  price: number;
  unit: string;
  images: string[];
  seller_business_name: string;
  seller_location: string;
  is_organic: boolean;
  quantity_available: number;
  description: string;
  seller_id: string;
}

const Market = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    fetchProducts();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchProducts = async () => {
    try {
      // Fetch products first
      const { data: productsData, error } = await supabase
        .from('products')
        .select('id, name, price, unit, images, is_organic, quantity_available, description, seller_id')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!productsData || productsData.length === 0) {
        setProducts([]);
        return;
      }

      // Get unique seller IDs and fetch their profiles
      const sellerIds = [...new Set(productsData.map(p => p.seller_id))];
      const { data: sellers } = await supabase
        .from('profiles')
        .select('id, business_name, location')
        .in('id', sellerIds);

      const sellerMap = new Map((sellers || []).map(s => [s.id, s]));

      setProducts(productsData.map(p => {
        const seller = sellerMap.get(p.seller_id);
        return {
          ...p,
          images: p.images || [],
          seller_business_name: seller?.business_name || 'Unknown',
          seller_location: seller?.location || 'Unknown',
        };
      }));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CartProvider>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        
        <section className="pt-24 pb-12 px-4 bg-gradient-to-r from-market-50 to-market-100">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
                Fresh, Local Produce at Your Fingertips
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Browse our selection of fresh, locally sourced produce directly from farmers in your area
              </p>
              
              <div className="flex flex-col md:flex-row gap-4 max-w-2xl mx-auto mt-8">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-market-500 focus:border-transparent"
                  />
                </div>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="container mx-auto max-w-6xl">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="bg-gray-200 aspect-square rounded-lg mb-4" />
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    price={product.price}
                    unit={product.unit}
                    image={product.images?.[0] || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80"}
                    farmer={product.seller_business_name}
                    location={product.seller_location}
                    organic={product.is_organic}
                    quantity_available={product.quantity_available}
                    description={product.description}
                    seller_id={product.seller_id}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </CartProvider>
  );
};

export default Market;
