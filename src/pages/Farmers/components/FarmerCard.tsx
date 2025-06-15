
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

interface FarmerCardProps {
  seller: Seller;
}

const FarmerCard = ({ seller }: FarmerCardProps) => {
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-to-br from-zinc-900/80 via-market-700/65 to-zinc-900/90 border border-market-700/25 rounded-2xl shadow-2xl p-8 text-market-100 backdrop-blur-lg glassmorphic hover:scale-105 hover:shadow-2xl transition-transform duration-200 cursor-pointer">
      <div className="flex items-start space-x-5">
        <div>
          <img
            src={seller.avatar_url || "https://via.placeholder.com/64"}
            alt={seller.business_name || "Farmer"}
            className="w-16 h-16 rounded-full object-cover border-2 border-market-500 shadow"
          />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold">{seller.business_name || "Unknown Farmer"}</h3>
          <p className="text-market-200 text-sm">{seller.location || "Location not specified"}</p>
          <p className="text-market-300 mt-2">{seller.bio || "No bio available"}</p>
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/market?seller=${seller.id}`)}
              className="w-full border-market-500 shadow hover:bg-market-700/40 hover:text-white"
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
