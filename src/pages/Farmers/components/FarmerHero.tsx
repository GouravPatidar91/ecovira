
import { Button } from "@/components/ui/button";
import { Tractor } from "lucide-react";

interface FarmerHeroProps {
  isSeller: boolean;
  onJoinAsFarmer: () => void;
}

const FarmerHero = ({ isSeller, onJoinAsFarmer }: FarmerHeroProps) => {
  return (
    <section className="pt-28 pb-16 px-4 bg-gradient-to-r from-market-800/95 via-zinc-900/95 to-market-900/85 relative overflow-hidden rounded-b-3xl shadow-2xl">
      <div className="absolute -top-16 -right-16 w-96 h-96 bg-market-600/30 rounded-full mix-blend-lighten blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-market-800/30 rounded-full blur-2xl pointer-events-none" />
      <div className="container mx-auto max-w-6xl z-10 relative">
        <div className="text-center space-y-7">
          <h1 className="text-4xl md:text-5xl font-extrabold text-market-100 drop-shadow-lg">
            Meet Our Local Farmers
          </h1>
          <p className="text-lg text-market-200 max-w-2xl mx-auto drop-shadow">
            Connect with passionate farmers who bring fresh, quality produce directly to your table
          </p>
          {!isSeller && (
            <Button 
              size="lg"
              className="bg-gradient-to-br from-market-600 via-market-700 to-zinc-900 text-white glassmorphic shadow-xl hover:from-market-700 hover:to-market-800"
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
