
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ProductCardProps {
  name: string;
  price: number;
  unit: string;
  image: string;
  farmer: string;
  location: string;
  organic: boolean;
}

const ProductCard = ({
  name,
  price,
  unit,
  image,
  farmer,
  location,
  organic,
}: ProductCardProps) => {
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
        <Button className="w-full bg-market-500 hover:bg-market-600">
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
