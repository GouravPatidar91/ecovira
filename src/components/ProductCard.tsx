
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Leaf } from "lucide-react";
import { useCart } from "@/contexts/cart";
import ChatButton from "@/components/ChatButton";
import ProductRating from "@/components/ProductRating";
import { useState } from "react";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  unit: string;
  image: string;
  farmer: string;
  location: string;
  organic: boolean;
  quantity_available: number;
  description: string;
  seller_id: string;
}

const ProductCard = ({
  id,
  name,
  price,
  unit,
  image,
  farmer,
  location,
  organic,
  quantity_available,
  description,
  seller_id,
}: ProductCardProps) => {
  const { addToCart } = useCart();
  const [chatError, setChatError] = useState(false);

  const handleAddToCart = () => {
    console.log("Adding to cart:", { id, name, price, unit, image });
    addToCart({
      id,
      name,
      price,
      unit,
      images: [image],
    }, 1);
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="relative aspect-square">
        <img
          src={image}
          alt={name}
          className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
        />
        {organic && (
          <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
            <Leaf className="w-3 h-3 mr-1" />
            Organic
          </div>
        )}
      </div>
      <CardHeader className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg">{name}</h3>
            <p className="text-gray-500 text-sm">${price} per {unit}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="text-sm text-gray-600 space-y-2">
          <p className="font-medium text-gray-900">{farmer}</p>
          <p>{location}</p>
          <ProductRating productId={id} size="sm" />
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex flex-col gap-2">
        <Button
          onClick={handleAddToCart}
          disabled={quantity_available === 0}
          className="w-full"
        >
          {quantity_available === 0 ? "Out of Stock" : "Add to Cart"}
        </Button>
        
        {/* Wrap ChatButton in error boundary */}
        {!chatError ? (
          <div className="w-full">
            <ErrorBoundary onError={() => setChatError(true)}>
              <ChatButton 
                sellerId={seller_id} 
                productId={id} 
                className="w-full"
              />
            </ErrorBoundary>
          </div>
        ) : (
          <Button variant="outline" className="w-full" disabled>
            Chat Unavailable
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

// Simple Error Boundary Component
const ErrorBoundary = ({ children, onError }: { children: React.ReactNode, onError: () => void }) => {
  try {
    return <>{children}</>;
  } catch (error) {
    onError();
    console.error("Error in ChatButton:", error);
    return null;
  }
};

export default ProductCard;
