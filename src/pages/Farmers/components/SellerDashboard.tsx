
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Bell, Loader2 } from "lucide-react";
import { useSellerOrders } from "@/hooks/useSellerOrders";

const SellerDashboard = () => {
  const navigate = useNavigate();
  const { newOrdersCount, isLoading } = useSellerOrders();

  return (
    <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border">
      <h2 className="text-xl font-semibold mb-4">Seller Dashboard</h2>
      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-market-600" />
        </div>
      ) : (
        <>
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
              className="relative"
            >
              View Orders
              {newOrdersCount > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-red-600 text-white">
                  {newOrdersCount}
                </Badge>
              )}
            </Button>
          </div>
          {newOrdersCount > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800 flex items-center">
              <Bell className="h-5 w-5 mr-2 text-yellow-600" />
              You have {newOrdersCount} new {newOrdersCount === 1 ? 'order' : 'orders'} waiting for your approval!
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SellerDashboard;
