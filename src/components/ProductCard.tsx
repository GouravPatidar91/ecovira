
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Leaf, Package } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import ChatButton from "@/components/ChatButton";

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
        
        {/* Stock indicator */}
        <div className="absolute top-2 left-2 bg-white/90 text-gray-800 px-2 py-1 rounded-full text-xs font-medium flex items-center">
          <Package className="w-3 h-3 mr-1" />
          {quantity_available > 0 ? `${quantity_available} in stock` : "Out of stock"}
        </div>
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
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex flex-col gap-2">
        <Button
          onClick={() => addToCart({
            id,
            name,
            price,
            unit,
            images: [image],
          }, 1)}
          disabled={quantity_available === 0}
          className="w-full"
        >
          {quantity_available === 0 ? "Out of Stock" : "Add to Cart"}
        </Button>
        <ChatButton 
          sellerId={seller_id} 
          productId={id} 
          className="w-full"
        />
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
