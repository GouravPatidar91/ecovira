
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Search, Filter } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CartProvider } from "@/contexts/CartContext";
import { motion } from "framer-motion";
import React from "react";

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

const filterPanelMotion = {
  hidden: { x: 40, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 200, damping: 25, duration: 0.4 } },
  exit: { x: 40, opacity: 0, transition: { duration: 0.2 } }
};

const MarketFilterPanel = ({
  onClose,
}: { onClose: () => void }) => (
  <motion.div 
    initial="hidden" 
    animate="visible" 
    exit="exit" 
    variants={filterPanelMotion}
    className="fixed top-0 right-0 z-50 h-full w-80 max-w-full bg-gradient-to-br from-market-900 via-zinc-900/90 to-market-700 p-6 shadow-2xl border-l border-market-400/25 glassy-blur"
    style={{
      backdropFilter: "blur(18px)",
      background: "linear-gradient(120deg, #1a2a1b 60%, #33412c 100%)",
    }}
  >
    <div className="flex justify-between items-center mb-6">
      <h4 className="text-lg font-semibold text-market-100 tracking-wide">Filters</h4>
      <button onClick={onClose} aria-label="Close filters" className="text-zinc-300 hover:text-market-300 text-xl font-bold cursor-pointer">&times;</button>
    </div>
    {/* Placeholder for actual filter controls */}
    <div className="space-y-4">
      <div>
        <label className="block text-xs text-zinc-400 uppercase mb-1">Category</label>
        <div className="flex gap-2 flex-wrap">
          <span className="bg-market-700/70 text-market-100 px-3 py-1 rounded-full font-semibold text-xs hover:bg-market-400/60 transition cursor-pointer">All</span>
          <span className="bg-market-700/70 text-market-100 px-3 py-1 rounded-full font-semibold text-xs hover:bg-market-400/60 transition cursor-pointer">Fruits</span>
          <span className="bg-market-700/70 text-market-100 px-3 py-1 rounded-full font-semibold text-xs hover:bg-market-400/60 transition cursor-pointer">Vegetables</span>
          <span className="bg-market-700/70 text-market-100 px-3 py-1 rounded-full font-semibold text-xs hover:bg-market-400/60 transition cursor-pointer">Grains</span>
          {/* ... add more as relevant */}
        </div>
      </div>
      <div>
        <label className="block text-xs text-zinc-400 uppercase mb-1">Price Range</label>
        {/* Placeholder slider UI */}
        <div className="h-3 bg-market-700/30 rounded-full mb-2 relative">
          <div className="bg-market-400/90 h-3 rounded-full absolute left-1/4 right-1/4" />
        </div>
        <div className="flex justify-between text-xs text-zinc-500">
          <span>$1</span>
          <span>$100</span>
        </div>
      </div>
      {/* Add other filters as needed */}
    </div>
  </motion.div>
);

const pageVariants = {
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0, transition: { type: "spring" as const, duration: 0.7, delay: 0.12 } },
  exit: { opacity: 0, y: 28, transition: { duration: 0.26 } }
};

const productGridMotion = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.12 } }
};

const productCardMotion = {
  hidden: { y: 50, opacity: 0, scale: 0.98 },
  visible: {
    y: 0, opacity: 1, scale: 1,
    transition: { duration: 0.45, type: "spring" as const, damping: 20, stiffness: 220 }
  }
};

const Market = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false);

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
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
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
      <motion.div
        className="min-h-screen bg-gradient-to-br from-zinc-900 via-market-900 to-market-800 transition-colors duration-300 relative overflow-hidden"
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
      >
        <Navigation />

        {/* Hero Section */}
        <section className="pt-24 pb-12 px-4 bg-gradient-to-r from-market-900 via-market-950/90 to-market-700 shadow-lg">
          <div className="container mx-auto max-w-6xl">
            <motion.div
              className="text-center space-y-6"
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: "easeOut" }}
            >
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-market-100 via-white to-market-400 drop-shadow-glow font-sans">
                Urban Fresh Market
              </h1>
              <p className="text-lg text-zinc-300 max-w-2xl mx-auto">
                Browse our selection of fresh, locally sourced produce directly from farmers in your area
              </p>
              
              {/* Search and Filter */}
              <motion.div
                className="flex flex-col md:flex-row gap-4 max-w-2xl mx-auto mt-8"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.34, duration: 0.33 }}
              >
                <div className="relative flex-1 z-20">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-market-200" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    className="w-full pl-12 pr-4 py-3 rounded-full border-none shadow ring-2 ring-market-400/25 backdrop-blur-xl font-medium text-white bg-slate-900/50 placeholder:text-market-300 focus:ring-market-500 glassy-blur"
                    style={{
                      background:
                        "linear-gradient(110deg, rgba(40,60,30,.24), rgba(70,100,60,.22) 100%)",
                      backdropFilter: "blur(18px)"
                    }}
                  />
                </div>
                <motion.div
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 350, damping: 18 }}
                >
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 bg-zinc-900/80 border-market-400 hover:bg-market-800 hover:text-market-200 text-market-200 font-semibold shadow-lg backdrop-blur-xl"
                    onClick={() => setShowFilters(true)}
                    style={{ minWidth: 108 }}
                  >
                    <Filter className="h-5 w-5" />
                    Filters
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Slide-out Filter Panel */}
        {showFilters && (
          <MarketFilterPanel onClose={() => setShowFilters(false)} />
        )}

        {/* Products Grid */}
        <section className="py-12 px-4">
          <div className="container mx-auto max-w-6xl">
            {isLoading ? (
              <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                variants={productGridMotion}
                initial="hidden"
                animate="visible"
              >
                {[...Array(8)].map((_, index) => (
                  <motion.div
                    key={index}
                    className="animate-pulse"
                    variants={productCardMotion}
                  >
                    <div className="bg-market-300/30 aspect-square rounded-lg mb-4" />
                    <div className="h-4 bg-market-200/40 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-market-200/40 rounded w-1/2" />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-7"
                variants={productGridMotion}
                initial="hidden"
                animate="visible"
              >
                {products.map((product) => (
                  <motion.div
                    key={product.id}
                    variants={productCardMotion}
                    whileHover={{
                      scale: 1.022,
                      boxShadow: "0 10px 38px 0 rgba(60,120,40,0.11)"
                    }}
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
      </motion.div>
    </CartProvider>
  );
};

export default Market;
