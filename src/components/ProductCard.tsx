
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { Loader2 } from "lucide-react";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  unit: string;
  image: string;
  farmer: string;
  location: string;
  organic: boolean;
  description?: string;
  quantity_available: number;
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
  description,
  quantity_available,
}: ProductCardProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { addToCart, state } = useCart();

  const handleAddToCart = async () => {
    setIsLoading(true);
    await addToCart({ id, name, price, unit, images: [image] }, 1);
    setIsLoading(false);
  };

  const isInCart = state.items.some(item => item.product_id === id);

  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg">
      <CardContent className="p-0 relative">
        <div className="aspect-square overflow-hidden">
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        {organic && (
          <Badge
            className="absolute top-2 right-2 bg-market-500 hover:bg-market-600"
            variant="secondary"
          >
            Organic
          </Badge>
        )}
      </CardContent>
      <CardFooter className="flex flex-col items-start p-4 space-y-2">
        <div className="flex justify-between items-start w-full">
          <div>
            <h3 className="font-semibold text-lg">{name}</h3>
            <p className="text-sm text-gray-500">
              by {farmer} • {location}
            </p>
          </div>
          <p className="font-semibold text-market-600">
            ${price}/{unit}
          </p>
        </div>
        {description && (
          <p className="text-sm text-gray-600 line-clamp-2">{description}</p>
        )}
        <Button 
          className="w-full bg-market-500 hover:bg-market-600"
          onClick={handleAddToCart}
          disabled={isLoading || isInCart || quantity_available === 0}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : isInCart ? (
            "In Cart"
          ) : quantity_available === 0 ? (
            "Out of Stock"
          ) : (
            "Add to Cart"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
