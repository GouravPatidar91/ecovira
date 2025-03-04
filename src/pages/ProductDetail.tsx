
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import { Leaf, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/cart";
import ProductReviews from "@/components/ProductReviews";
import ProductRating from "@/components/ProductRating";
import ChatButton from "@/components/ChatButton";

interface ProductDetails {
  id: string;
  name: string;
  price: number;
  unit: string;
  images: string[];
  is_organic: boolean;
  quantity_available: number;
  description: string;
  seller_id: string;
  seller_name: string;
  seller_location: string;
}

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!id) return;

      try {
        const { data, error } = await supabase
          .from("products")
          .select(`
            *,
            profiles:seller_id (
              full_name,
              business_name,
              location
            )
          `)
          .eq("id", id)
          .single();

        if (error) throw error;

        setProduct({
          id: data.id,
          name: data.name,
          price: data.price,
          unit: data.unit,
          images: data.images || ["/placeholder.svg"],
          is_organic: data.is_organic,
          quantity_available: data.quantity_available,
          description: data.description || "",
          seller_id: data.seller_id,
          seller_name: data.profiles.business_name || data.profiles.full_name || "Unknown Seller",
          seller_location: data.profiles.location || "Unknown Location",
        });
      } catch (error) {
        console.error("Error fetching product:", error);
        toast({
          title: "Error",
          description: "Failed to load product details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [id, toast]);

  const handleAddToCart = () => {
    if (!product) return;

    addToCart(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        unit: product.unit,
        images: product.images,
      },
      quantity
    );

    toast({
      title: "Added to cart",
      description: `${quantity} x ${product.name} added to your cart`,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto p-4 mt-8 text-center">
          Loading product details...
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto p-4 mt-8 text-center">
          Product not found
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto p-4 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-6 rounded-lg shadow">
          {/* Product Images */}
          <div className="relative rounded-lg overflow-hidden aspect-square">
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {product.is_organic && (
              <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center">
                <Leaf className="w-4 h-4 mr-2" />
                Organic
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-4">
            <h1 className="text-2xl md:text-3xl font-bold">{product.name}</h1>
            
            <ProductRating productId={product.id} size="lg" />
            
            <div className="text-2xl font-semibold">${product.price} per {product.unit}</div>
            
            <div className="space-y-1">
              <div className="font-medium">{product.seller_name}</div>
              <div className="text-gray-500">{product.seller_location}</div>
            </div>
            
            <div className="border-t border-b py-4 my-4">
              <h3 className="font-medium mb-2">Description</h3>
              <p className="text-gray-600">{product.description}</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  variant="outline"
                  size="icon"
                  disabled={quantity <= 1}
                >
                  -
                </Button>
                <span className="w-12 text-center">{quantity}</span>
                <Button
                  onClick={() => setQuantity(Math.min(product.quantity_available, quantity + 1))}
                  variant="outline"
                  size="icon"
                  disabled={quantity >= product.quantity_available}
                >
                  +
                </Button>
                <span className="text-sm text-gray-500">
                  {product.quantity_available} available
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleAddToCart}
                  className="w-full sm:w-auto flex-1"
                  disabled={product.quantity_available === 0}
                >
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  {product.quantity_available === 0 ? "Out of Stock" : "Add to Cart"}
                </Button>
                <ChatButton
                  sellerId={product.seller_id}
                  productId={product.id}
                  className="w-full sm:w-auto flex-1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <ProductReviews productId={product.id} />
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
