
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ShoppingBasket } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Seller {
  id: string;
  business_name: string | null;
  location: string | null;
  bio: string | null;
  avatar_url: string | null;
}

interface FarmerCardProps {
  seller: Seller;
}

const FarmerCard = ({ seller }: FarmerCardProps) => {
  const navigate = useNavigate();
  
  const getInitials = (name: string | null) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-4">
        <Avatar className="w-16 h-16 flex-shrink-0">
          <AvatarImage src={seller.avatar_url || ''} alt={seller.business_name || "Farmer"} />
          <AvatarFallback className="text-xl">
            {getInitials(seller.business_name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="text-lg font-semibold">{seller.business_name || "Unknown Farmer"}</h3>
          <p className="text-gray-500 text-sm">{seller.location || "Location not specified"}</p>
          <p className="text-gray-600 mt-2 text-sm">{seller.bio || "No bio available"}</p>
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/market?seller=${seller.id}`)}
              className="w-full"
            >
              <ShoppingBasket className="w-4 h-4 mr-1" />
              View Products
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FarmerCard;
