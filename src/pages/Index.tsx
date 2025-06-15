
import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CartProvider } from "@/contexts/CartContext";
import { motion } from "framer-motion";

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

const productGridMotion = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.09,
      delayChildren: 0.14,
    }
  }
};
// Fix urban animation variant for Framer Motion
const productCardMotion = {
  hidden: { y: 60, opacity: 0, scale: 0.98 },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.48,
      type: "spring" as const,
      damping: 20,
      stiffness: 220
    }
  }
};

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
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-700 ">
        <Navigation />

        {/* Hero Section */}
        <section className="pt-24 pb-12 px-4 bg-gradient-to-r from-market-700 to-market-200 shadow-xl urban-hero">
          <div className="container mx-auto">
            <motion.div
              className="max-w-2xl mx-auto text-center space-y-5 animate-fade-in"
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-white font-sans drop-shadow-glow urban-gradient-text">
                Fresh from Farm to Table
              </h1>
              <motion.p
                className="text-xl text-gray-200"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                Connect directly with local farmers and get the freshest produce for your business
              </motion.p>
              {/* Search Bar */}
              <motion.div
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.55, duration: 0.33 }}
                className="relative max-w-xl mx-auto mt-8"
              >
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  placeholder="Search for products, farmers, or locations..."
                  className="w-full pl-12 pr-4 py-3 rounded-full border-none shadow ring-2 ring-market-400/25 bg-white/10 backdrop-blur-md font-medium text-white focus:ring-market-500"
                  style={{ outline: "none" }}
                />
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-14 px-4">
          <div className="container mx-auto">
            <div className="flex justify-between items-center mb-8">
              <motion.h2
                className="text-2xl md:text-3xl font-extrabold text-white tracking-tight"
                initial={{ opacity: 0, x: -32 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                Featured Products
              </motion.h2>
              <Button
                variant="outline"
                className="text-market-200 border-market-400 hover:bg-market-950 hover:text-market-50 transition bg-white/10 backdrop-blur"
              >
                View All
              </Button>
            </div>
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="bg-market-300/40 aspect-square rounded-xl mb-4" />
                    <div className="h-4 bg-market-200/40 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-market-200/40 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : (
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7 animate-slide-up"
                variants={productGridMotion}
                initial="hidden"
                animate="visible"
              >
                {products.map((product, i) => (
                  <motion.div
                    key={product.id}
                    variants={productCardMotion}
                    whileHover={{ scale: 1.025, boxShadow: "0 10px 40px 0 rgba(5,10,50,0.17)" }}
                  >
                    <ProductCard
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
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-14 px-4 bg-zinc-800/75">
          <div className="container mx-auto">
            <motion.h2
              className="text-2xl font-bold text-white text-center mb-8 tracking-tight"
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.55 }}
            >
              Why Choose EcoVira
            </motion.h2>
            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={productGridMotion}
            >
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
                <motion.div
                  key={index}
                  className="p-8 text-center rounded-2xl bg-gradient-to-br from-zinc-900 via-market-900/40 to-zinc-700 shadow-xl border border-market-300/30 hover:shadow-2xl hover:scale-105 transition-all duration-300"
                  variants={productCardMotion}
                >
                  <h3 className="text-lg font-bold text-market-200 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-200">{feature.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      </div>
    </CartProvider>
  );
};

export default Index;
