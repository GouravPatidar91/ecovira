
import Navigation from "@/components/Navigation";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

const Index = () => {
  // Sample products data
  const products = [
    {
      name: "Fresh Organic Tomatoes",
      price: 2.99,
      unit: "lb",
      image: "https://images.unsplash.com/photo-1524593166156-312f362cada0?auto=format&fit=crop&q=80",
      farmer: "Green Valley Farm",
      location: "California",
      organic: true,
    },
    {
      name: "Sweet Corn",
      price: 0.99,
      unit: "ear",
      image: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&q=80",
      farmer: "Sunrise Acres",
      location: "Iowa",
      organic: false,
    },
    {
      name: "Fresh Strawberries",
      price: 4.99,
      unit: "lb",
      image: "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?auto=format&fit=crop&q=80",
      farmer: "Berry Fields",
      location: "Oregon",
      organic: true,
    },
    {
      name: "Organic Carrots",
      price: 1.99,
      unit: "lb",
      image: "https://images.unsplash.com/photo-1598170845023-6b9f165b11c8?auto=format&fit=crop&q=80",
      farmer: "Root Valley",
      location: "Vermont",
      organic: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-20 pb-12 px-4">
        <div className="container mx-auto">
          <div className="max-w-2xl mx-auto text-center space-y-4 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
              Fresh from Farm to Table
            </h1>
            <p className="text-lg text-gray-600">
              Connect directly with local farmers and get the freshest produce for
              your business
            </p>
            {/* Search Bar */}
            <div className="relative max-w-xl mx-auto mt-8">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search for products, farmers, or locations..."
                className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-market-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-semibold text-gray-900">
              Featured Products
            </h2>
            <Button variant="outline" className="text-market-600 border-market-600 hover:bg-market-50">
              View All
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up">
            {products.map((product, index) => (
              <ProductCard key={index} {...product} />
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-12 px-4 bg-white">
        <div className="container mx-auto">
          <h2 className="text-2xl font-semibold text-gray-900 text-center mb-8">
            Why Choose FarmFresh
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Direct from Farmers",
                description:
                  "Connect directly with local farmers and get the freshest produce.",
              },
              {
                title: "Quality Guaranteed",
                description:
                  "All products are verified for quality and freshness.",
              },
              {
                title: "Secure Transactions",
                description:
                  "Safe and secure payment processing for all orders.",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="p-6 text-center rounded-lg bg-gray-50 hover:shadow-md transition-shadow duration-300"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
