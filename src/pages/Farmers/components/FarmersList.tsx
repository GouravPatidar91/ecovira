
import FarmerCard from "./FarmerCard";
import { Seller } from "../types";

interface FarmersListProps {
  sellers: Seller[];
  loading: boolean;
}

const FarmersList = ({ sellers, loading }: FarmersListProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-16 h-16 bg-gray-200 rounded-full mb-4" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sellers.map((seller) => (
        <FarmerCard key={seller.id} seller={seller} />
      ))}
    </div>
  );
};

export default FarmersList;
