
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit, Trash2 } from "lucide-react";
import DashboardLayout from "./components/DashboardLayout";
import ProductForm from "./components/ProductForm";

interface Product {
  id: string;
  name: string;
  price: number;
  quantity_available: number;
  images?: string[] | null; 
  image_url?: string | null; 
  created_at: string;
  status: string;
  description?: string;
  unit: string;
  category?: string;
}

const Products = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showProductForm, setShowProductForm] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user]);

  const fetchProducts = async () => {
    if (!user) {
      console.log("No user found, redirecting to auth");
      navigate("/auth");
      return;
    }

    try {
      console.log("Fetching products for user:", user.id);
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', user.id);
        
      if (error) {
        console.error("Error fetching products:", error);
        toast({
          title: "Error",
          description: "Could not load your products.",
          variant: "destructive",
        });
        return;
      }

      console.log("Products loaded:", data);

      // Map the data to match our Product interface
      const formattedProducts = data?.map(product => ({
        ...product,
        // If images array exists, use the first image as image_url for backwards compatibility
        image_url: product.images && product.images.length > 0 ? product.images[0] : null
      })) || [];

      setProducts(formattedProducts);
      console.log("Products formatted:", formattedProducts);
    } catch (error) {
      console.error("Error in product management:", error);
      toast({
        title: "Error",
        description: "An error occurred while loading your products",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewProduct = () => {
    setShowProductForm(true);
  };

  const handleEditProduct = (id: string) => {
    navigate(`/dashboard/product/${id}`);
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
        
      if (error) {
        throw error;
      }
      
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
      
      // Refresh products list
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({
        title: "Error",
        description: "Could not delete product",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout>
      {showProductForm ? (
        <ProductForm 
          onCancel={() => setShowProductForm(false)} 
          onSuccess={() => {
            setShowProductForm(false);
            fetchProducts();
          }}
        />
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Products</h1>
            <Button onClick={handleNewProduct}>
              <Plus className="mr-2 h-4 w-4" /> Add Product
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-10">
              <p>Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-2">No Products Yet</h2>
              <p className="text-gray-500 mb-4">
                You haven't added any products to your store yet.
              </p>
              <Button onClick={handleNewProduct}>
                <Plus className="mr-2 h-4 w-4" /> Add Your First Product
              </Button>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Inventory
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-200 overflow-hidden">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full bg-gray-300" />
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {product.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {product.category || "Uncategorized"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          ${Number(product.price).toFixed(2)} / {product.unit}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {product.quantity_available} {product.unit}s available
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {product.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditProduct(product.id)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDeleteProduct(product.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
};

export default Products;
