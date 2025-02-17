
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CartSheet } from "@/components/CartSheet";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const Navigation = () => {
  const navigate = useNavigate();
  const [isSeller, setIsSeller] = useState(false);

  useEffect(() => {
    checkSellerStatus();
  }, []);

  const checkSellerStatus = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data } = await supabase
        .from('profiles')
        .select('role, is_seller')
        .eq('id', session.user.id)
        .single();
      
      setIsSeller(data?.is_seller || data?.role === 'farmer' || false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-xl font-bold text-market-600">
              FarmFresh
            </Link>
            <div className="hidden md:flex space-x-4">
              <Link to="/market">
                <Button variant="ghost">Market</Button>
              </Link>
              <Link to="/farmers">
                <Button variant="ghost">Farmers</Button>
              </Link>
              <Link to="/about">
                <Button variant="ghost">About</Button>
              </Link>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {isSeller && (
              <Link to="/dashboard/products">
                <Button variant="outline">Seller Dashboard</Button>
              </Link>
            )}
            <CartSheet />
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
