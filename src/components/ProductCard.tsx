
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Leaf, ShoppingBag } from "lucide-react";
import { useCart } from "@/contexts/cart";
import ChatButton from "@/components/ChatButton";
import ProductRating from "@/components/ProductRating";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const handleAddToCart = async () => {
    try {
      setIsAddingToCart(true);
      await addToCart({
        id,
        name,
        price,
        unit,
        images: [image],
      }, 1);
      
      toast({
        title: "Success",
        description: `${name} has been added to your cart.`,
      });
    } catch (error) {
      console.error("Error adding product to cart:", error);
      toast({
        title: "Error",
        description: "Could not add item to cart. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleProductClick = () => {
    navigate(`/product/${id}`);
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
      <div 
        className="relative aspect-square cursor-pointer overflow-hidden" 
        onClick={handleProductClick}
      >
        <img
          src={image}
          alt={name}
          className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {organic && (
          <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
            <Leaf className="w-3 h-3 mr-1" />
            Organic
          </div>
        )}
      </div>
      <CardHeader className="p-3 sm:p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 
              className="font-semibold text-base sm:text-lg cursor-pointer hover:text-primary line-clamp-2"
              onClick={handleProductClick}
            >
              {name}
            </h3>
            <p className="text-gray-500 text-sm">${price} per {unit}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 pt-0 flex-grow">
        <div className="text-sm text-gray-600 space-y-2">
          <p className="font-medium text-gray-900">{farmer}</p>
          <p className="text-xs sm:text-sm">{location}</p>
          <ProductRating productId={id} size="sm" />
          <p className="text-xs text-gray-500 line-clamp-2">{description}</p>
        </div>
      </CardContent>
      <CardFooter className="p-3 sm:p-4 pt-0 flex flex-col gap-2">
        <Button
          onClick={handleAddToCart}
          disabled={quantity_available === 0 || isAddingToCart}
          className="w-full text-sm sm:text-base"
          size="sm"
        >
          <ShoppingBag className="w-4 h-4 mr-1" />
          {isAddingToCart ? "Adding..." : quantity_available === 0 ? "Out of Stock" : "Add to Cart"}
        </Button>
        
        <ChatButton 
          sellerId={seller_id} 
          productId={id} 
          className="w-full"
          variant="outline"
        />
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
