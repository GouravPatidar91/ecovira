
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import ProductDetails from "@/components/dashboard/product/ProductDetails";
import ImageUpload from "@/components/dashboard/product/ImageUpload";

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  unit: string;
  quantity_available: number;
  is_organic: boolean;
  images: string[];
}

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    description: "",
    price: 0,
    unit: "",
    quantity_available: 0,
    is_organic: false,
    images: [],
  });

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setFormData(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load product",
        variant: "destructive",
      });
      navigate('/dashboard/products');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const productData = {
        ...formData,
        seller_id: session.user.id,
        status: 'active',
      };

      const { error } = id
        ? await supabase
            .from('products')
            .update(productData)
            .eq('id', id)
        : await supabase
            .from('products')
            .insert([productData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Product ${id ? "updated" : "created"} successfully`,
      });
      navigate('/dashboard/products');
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${id ? "update" : "create"} product`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold">
            {id ? "Edit Product" : "New Product"}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
          <ProductDetails
            formData={formData}
            onChange={handleChange}
            onOrganicChange={(checked) =>
              setFormData(prev => ({ ...prev, is_organic: checked }))
            }
          />

          <div className="md:col-span-2">
            <ImageUpload
              images={formData.images}
              onImagesChange={(images) =>
                setFormData(prev => ({ ...prev, images }))
              }
            />
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/dashboard/products')}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="bg-market-500 hover:bg-market-600"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {id ? "Updating..." : "Creating..."}
                </>
              ) : (
                id ? "Update Product" : "Create Product"
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default ProductForm;
