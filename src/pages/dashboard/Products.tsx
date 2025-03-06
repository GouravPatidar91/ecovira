
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

interface Product {
  id: string;
  name: string;
  price: number;
  quantity_available: number;
  image_url: string | null;
  created_at: string;
}

const Products = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSellerVerified, setIsSellerVerified] = useState(false);

  useEffect(() => {
    const checkUserAndLoadProducts = async () => {
      if (!user) {
        navigate("/auth");
        return;
      }

      try {
        // First check if the user is a verified seller
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role, verification_status')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) {
          console.error("Error checking seller status:", profileError);
          toast({
            title: "Error",
            description: "Could not verify your seller status",
            variant: "destructive",
          });
          navigate("/");
          return;
        }

        if (profileData?.role !== 'farmer' || profileData?.verification_status !== 'verified') {
          console.log("User is not a verified seller:", profileData);
          toast({
            title: "Access Denied",
            description: "You need to be a verified seller to manage products.",
            variant: "destructive",
          });
          navigate("/farmers");
          return;
        }

        setIsSellerVerified(true);

        // Load the seller's products
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('seller_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error("Error fetching products:", error);
          toast({
            title: "Error",
            description: "Failed to load your products",
            variant: "destructive",
          });
          return;
        }

        setProducts(data || []);
      } catch (error) {
        console.error("Error in product management:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkUserAndLoadProducts();
  }, [user, navigate, toast]);

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Products Management</h1>
        <p>Loading your products...</p>
      </div>
    );
  }

  if (!isSellerVerified) {
    return null; // The useEffect will have redirected already
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Products Management</h1>
        <Button
          onClick={() => navigate("/dashboard/products/new")}
          className="bg-market-600 hover:bg-market-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-3">No Products Yet</h2>
          <p className="text-gray-500 mb-6">
            You haven't added any products to your store yet.
          </p>
          <Button
            onClick={() => navigate("/dashboard/products/new")}
            className="bg-market-600 hover:bg-market-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Your First Product
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="h-48 bg-gray-100 relative">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    No image
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
                <p className="text-market-600 font-medium mb-2">
                  ${product.price.toFixed(2)}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    Stock: {product.quantity_available}
                  </span>
                  <Link
                    to={`/dashboard/products/${product.id}`}
                    className="text-market-600 hover:text-market-700 font-medium text-sm"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Products;
