
import { Button } from "@/components/ui/button";
import { Tractor } from "lucide-react";

interface FarmerHeroProps {
  isSeller: boolean;
  onJoinAsFarmer: () => void;
}

const FarmerHero = ({ isSeller, onJoinAsFarmer }: FarmerHeroProps) => {
  return (
    <section className="pt-24 pb-12 px-4 bg-gradient-to-r from-market-50 to-market-100">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
            Meet Our Local Farmers
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Connect with passionate farmers who bring fresh, quality produce directly to your table
          </p>
          {!isSeller && (
            <Button 
              size="lg"
              className="bg-market-600 hover:bg-market-700"
              onClick={onJoinAsFarmer}
            >
              <Tractor className="mr-2 h-5 w-5" />
              Join as a Farmer
            </Button>
          )}
        </div>
      </div>
    </section>
  );
};

export default FarmerHero;
