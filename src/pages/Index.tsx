import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CartProvider } from "@/contexts/cart";

interface Product {
  id: string;
  name: string;
  price: number;
  unit: string;
  images: string[];
  seller: {
    business_name: string;
    location: string;
  };
  is_organic: boolean;
  quantity_available: number;
  description: string;
  seller_id: string;
}

const Index = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select(`
            id,
            name,
            price,
            unit,
            images,
            is_organic,
            quantity_available,
            description,
            seller_id,
            seller:profiles (
              business_name,
              location
            )
          `)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(4);

        if (error) throw error;

        setProducts(data);
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

    fetchProducts();
  }, []);

  return (
    <CartProvider>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        
        {/* Hero Section */}
        <section className="pt-20 pb-12 px-4">
          <div className="container mx-auto">
            <div className="max-w-2xl mx-auto text-center space-y-4 animate-fade-in">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
                Fresh from Farm to Table
              </h1>
              <p className="text-lg text-gray-600">
                Connect directly with local farmers and get the freshest produce for
                your business
              </p>
              {/* Search Bar */}
              <div className="relative max-w-xl mx-auto mt-8">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for products, farmers, or locations..."
                  className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-market-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-12 px-4">
          <div className="container mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-semibold text-gray-900">
                Featured Products
              </h2>
              <Button variant="outline" className="text-market-600 border-market-600 hover:bg-market-50">
                View All
              </Button>
            </div>
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="bg-gray-200 aspect-square rounded-lg mb-4" />
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    price={product.price}
                    unit={product.unit}
                    image={product.images?.[0] || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80"}
                    farmer={product.seller.business_name}
                    location={product.seller.location}
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

        {/* Why Choose Us */}
        <section className="py-12 px-4 bg-white">
          <div className="container mx-auto">
            <h2 className="text-2xl font-semibold text-gray-900 text-center mb-8">
              Why Choose EcoVira
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: "Direct from Farmers",
                  description:
                    "Connect directly with local farmers and get the freshest produce.",
                },
                {
                  title: "Quality Guaranteed",
                  description:
                    "All products are verified for quality and freshness.",
                },
                {
                  title: "Secure Transactions",
                  description:
                    "Safe and secure payment processing for all orders.",
                },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="p-6 text-center rounded-lg bg-gray-50 hover:shadow-md transition-shadow duration-300"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </CartProvider>
  );
};

export default Index;
