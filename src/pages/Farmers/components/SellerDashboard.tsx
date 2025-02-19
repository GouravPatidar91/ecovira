
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const SellerDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border">
      <h2 className="text-xl font-semibold mb-4">Seller Dashboard</h2>
      <div className="flex gap-4">
        <Button 
          onClick={() => navigate('/dashboard/products')}
          className="bg-market-600 hover:bg-market-700"
        >
          Manage Products
        </Button>
        <Button 
          onClick={() => navigate('/dashboard/orders')}
          variant="outline"
        >
          View Orders
        </Button>
      </div>
    </div>
  );
};

export default SellerDashboard;
