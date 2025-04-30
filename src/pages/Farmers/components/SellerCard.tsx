
import { Button } from "@/components/ui/button";
import { ShoppingBasket } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Seller {
  id: string;
  business_name: string | null;
  location: string | null;
  bio: string | null;
  avatar_url: string | null;
}

const SellerCard = ({ seller }: { seller: Seller }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-3 sm:space-x-4">
        <div className="relative shrink-0">
          <img
            src={seller.avatar_url || "https://via.placeholder.com/64"}
            alt={seller.business_name || "Farmer"}
            className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover"
            loading="lazy"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-semibold truncate">{seller.business_name || "Unknown Farmer"}</h3>
          <p className="text-gray-500 text-xs sm:text-sm">{seller.location || "Location not specified"}</p>
          <p className="text-gray-600 mt-1 sm:mt-2 text-sm line-clamp-2 sm:line-clamp-3">{seller.bio || "No bio available"}</p>
          <div className="flex gap-2 mt-3 sm:mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/market?seller=${seller.id}`)}
              className="w-full text-xs sm:text-sm"
            >
              <ShoppingBasket className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              View Products
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerCard;
