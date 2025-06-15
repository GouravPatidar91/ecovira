
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Tractor, Leaf, ShoppingBasket } from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  {
    icon: <Leaf className="text-agri-500" size={30}/>,
    title: "Fresh from the Farm",
    desc: "Order produce grown locally by verified farmers.",
  },
  {
    icon: <ShoppingBasket className="text-agri-500" size={30}/>,
    title: "Easy Shopping",
    desc: "Browse, chat, and buy—all in one beautiful marketplace.",
  },
  {
    icon: <Tractor className="text-agri-500" size={30}/>,
    title: "Empowering Growers",
    desc: "Support smallholders & enjoy the freshest possible food.",
  }
];

const Index = () => (
  <div className="min-h-screen bg-hero-agri">
    <Navigation />
    {/* Hero */}
    <section className="pt-24 pb-16 px-4">
      <div className="container mx-auto max-w-5xl flex flex-col items-center text-center">
        <span className="text-agri-600 font-bold uppercase tracking-widest mb-2 text-sm">Connecting Fields to Families</span>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-agri-800 drop-shadow-md font-agri mb-4">
          The Modern Agricultural Marketplace
        </h1>
        <p className="text-lg md:text-xl text-agri-700 mb-6 max-w-xl mx-auto">
          Discover, order, and support fresh local produce directly from trusted farmers—delivered right to your home.
        </p>
        <div className="flex gap-4 justify-center mb-8 mt-2">
          <Link to="/market">
            <Button size="lg" className="shadow-lg bg-agri-500 hover:bg-agri-600">
              <ShoppingBasket className="mr-2" />
              Shop the Market
            </Button>
          </Link>
          <Link to="/farmers">
            <Button size="lg" variant="secondary" className="shadow-lg">
              <Tractor className="mr-2" />
              Meet the Farmers
            </Button>
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-7 w-full">
          {features.map(({icon,title,desc}, i) => (
            <div key={title} className="glass p-7 transition hover:scale-[1.02]">
              <div className="mb-3">{icon}</div>
              <div className="text-xl font-bold mb-2 text-agri-800">{title}</div>
              <div className="text-agri-700 text-base">{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
    {/* Agri/Footer illustration could go here */}
    <footer className="bg-agri-50/90 border-t border-agri-100 mt-24 py-4 text-center text-sm text-agri-500">
      <span role="img" aria-label="Leaf">🌿</span> AgriChain © {new Date().getFullYear()}
    </footer>
  </div>
);

export default Index;
