
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

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
  const [uploadingImages, setUploadingImages] = useState(false);
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    const newImages: string[] = [...formData.images];

    try {
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        newImages.push(publicUrl);
      }

      setFormData(prev => ({
        ...prev,
        images: newImages,
      }));

      toast({
        title: "Success",
        description: "Images uploaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload images",
        variant: "destructive",
      });
    } finally {
      setUploadingImages(false);
    }
  };

  const handleRemoveImage = async (imageUrl: string) => {
    try {
      const imagePath = imageUrl.split('/').pop();
      if (!imagePath) return;

      const { error } = await supabase.storage
        .from('product-images')
        .remove([imagePath]);

      if (error) throw error;

      setFormData(prev => ({
        ...prev,
        images: prev.images.filter(img => img !== imageUrl),
      }));

      toast({
        title: "Success",
        description: "Image removed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove image",
        variant: "destructive",
      });
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                placeholder="e.g., kg, lb, piece"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity_available">Available Quantity</Label>
              <Input
                id="quantity_available"
                name="quantity_available"
                type="number"
                value={formData.quantity_available}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_organic"
                checked={formData.is_organic}
                onCheckedChange={(checked) =>
                  setFormData(prev => ({ ...prev, is_organic: checked }))
                }
              />
              <Label htmlFor="is_organic">Organic Product</Label>
            </div>

            <div className="md:col-span-2 space-y-4">
              <div className="space-y-2">
                <Label>Product Images</Label>
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('image-upload')?.click()}
                    disabled={uploadingImages}
                  >
                    {uploadingImages ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Images
                      </>
                    )}
                  </Button>
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploadingImages}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Product ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveImage(image)}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
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
