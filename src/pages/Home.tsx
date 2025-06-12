
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/Navigation';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Welcome to Fresh Market
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Connect directly with local farmers and get the freshest produce
          </p>
          <div className="space-x-4">
            <Button 
              onClick={() => navigate('/market')}
              className="bg-market-600 hover:bg-market-700"
            >
              Browse Market
            </Button>
            <Button 
              onClick={() => navigate('/farmers')}
              variant="outline"
            >
              Meet Our Farmers
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
