
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Heart, Users, Sprout, ShieldCheck } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4 bg-gradient-to-r from-market-50 to-market-100">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
              About EcoVira
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Connecting local farmers with customers, promoting sustainable agriculture, and building stronger communities
            </p>
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center space-y-6">
            <h2 className="text-3xl font-semibold text-gray-900">Our Mission</h2>
            <p className="text-lg text-gray-600">
              EcoVira is dedicated to revolutionizing the way local produce reaches your table. We believe in creating a sustainable ecosystem that benefits both farmers and consumers, while promoting environmental responsibility and community growth.
            </p>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-12 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-semibold text-gray-900 text-center mb-12">Our Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Heart className="h-8 w-8 text-market-500" />,
                title: "Community First",
                description: "Supporting local farmers and strengthening community bonds through direct farm-to-table connections.",
              },
              {
                icon: <Users className="h-8 w-8 text-market-500" />,
                title: "Fair Partnership",
                description: "Ensuring fair prices for farmers while providing quality produce to consumers.",
              },
              {
                icon: <Sprout className="h-8 w-8 text-market-500" />,
                title: "Sustainability",
                description: "Promoting sustainable farming practices and reducing environmental impact.",
              },
              {
                icon: <ShieldCheck className="h-8 w-8 text-market-500" />,
                title: "Quality Assured",
                description: "Maintaining high standards for all products and ensuring food safety.",
              },
            ].map((value, index) => (
              <div key={index} className="text-center space-y-4 p-6 rounded-lg hover:bg-gray-50 transition-colors duration-300">
                <div className="inline-block p-3 bg-market-50 rounded-full">
                  {value.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Join Us */}
      <section className="py-12 px-4 bg-gradient-to-r from-market-500 to-market-600 text-white">
        <div className="container mx-auto max-w-4xl text-center space-y-6">
          <h2 className="text-3xl font-semibold">Join Our Growing Community</h2>
          <p className="text-lg opacity-90">
            Whether you're a farmer looking to expand your reach or a customer seeking fresh, local produce, EcoVira is here to connect you.
          </p>
          <div className="flex justify-center gap-4">
            <Button variant="secondary" className="bg-white text-market-600 hover:bg-gray-100">
              Join as a Farmer
            </Button>
            <Button variant="outline" className="text-white border-white hover:bg-white/10">
              Shop Now
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
