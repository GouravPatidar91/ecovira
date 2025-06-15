
import FarmerCard from "./FarmerCard";
import { Seller } from "../types";

interface FarmersListProps {
  sellers: Seller[];
  loading: boolean;
}

const FarmersList = ({ sellers, loading }: FarmersListProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-gradient-to-br from-market-700/40 to-zinc-800/60 border border-market-500/20 rounded-2xl shadow-xl p-8 glassmorphic text-market-100">
              <div className="w-16 h-16 bg-gray-700/20 rounded-full mb-4" />
              <div className="h-4 bg-gray-600/60 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-700/40 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
      {sellers.map((seller) => (
        <FarmerCard key={seller.id} seller={seller} />
      ))}
    </div>
  );
};

export default FarmersList;
