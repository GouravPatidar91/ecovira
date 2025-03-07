
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Plus, UploadCloud } from "lucide-react";

interface ProductFormProps {
  onCancel: () => void;
  onSuccess: () => void;
  productId?: string;
}

const ProductForm = ({ onCancel, onSuccess, productId }: ProductFormProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState("kg");
  const [quantity, setQuantity] = useState("");
  const [category, setCategory] = useState("");
  const [isOrganic, setIsOrganic] = useState(false);
  const [certificationInfo, setCertificationInfo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      
      if (selectedFiles.length + previewUrls.length > 5) {
        toast({
          title: "Too many images",
          description: "You can only upload a maximum of 5 images per product",
          variant: "destructive",
        });
        return;
      }
      
      setImages(prev => [...prev, ...selectedFiles]);
      
      // Create preview URLs
      const newPreviewUrls = selectedFiles.map(file => URL.createObjectURL(file));
      setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    }
  };

  const removeImage = (index: number) => {
    // Create new arrays without the image at the specified index
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
    
    const newPreviewUrls = [...previewUrls];
    // Revoke the URL to prevent memory leaks
    URL.revokeObjectURL(newPreviewUrls[index]);
    newPreviewUrls.splice(index, 1);
    setPreviewUrls(newPreviewUrls);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      navigate("/auth");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Validate inputs
      if (!name || !price || !unit || !quantity) {
        toast({
          title: "Missing information",
          description: "Please fill out all required fields",
          variant: "destructive",
        });
        return;
      }
      
      // Upload images first if any
      let imageUrls: string[] = [];
      
      if (images.length > 0) {
        setUploadProgress(10);
        
        for (let i = 0; i < images.length; i++) {
          const file = images[i];
          const fileExt = file.name.split('.').pop();
          const filePath = `${Math.random()}.${fileExt}`;
          
          const { data, error } = await supabase
            .storage
            .from('product-images')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false
            });
            
          if (error) {
            console.error('Error uploading image:', error);
            toast({
              title: "Upload error",
              description: "There was a problem uploading one or more images",
              variant: "destructive",
            });
            return;
          }
          
          const { data: { publicUrl } } = supabase
            .storage
            .from('product-images')
            .getPublicUrl(filePath);
            
          imageUrls.push(publicUrl);
          setUploadProgress(10 + Math.floor((i + 1) / images.length * 40));
        }
      }
      
      setUploadProgress(50);
      
      // Save product data
      const productData = {
        seller_id: user.id,
        name,
        description,
        price: parseFloat(price),
        unit,
        quantity_available: parseInt(quantity),
        category: category || null,
        is_organic: isOrganic,
        certification_info: certificationInfo || null,
        images: imageUrls.length > 0 ? imageUrls : null,
        status: 'active'
      };
      
      const { data, error } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single();
        
      if (error) {
        console.error('Error saving product:', error);
        toast({
          title: "Error",
          description: "There was a problem saving your product",
          variant: "destructive",
        });
        return;
      }
      
      setUploadProgress(100);
      
      toast({
        title: "Success",
        description: "Product added successfully!",
      });
      
      onSuccess();
      
    } catch (error) {
      console.error('Error in product creation:', error);
      toast({
        title: "Error",
        description: "There was an unexpected problem creating your product",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-xl font-semibold mb-6">Add New Product</h2>
      
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="details">Product Details</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="inventory">Inventory & Pricing</TabsTrigger>
        </TabsList>
        
        <form onSubmit={handleSubmit}>
          <TabsContent value="details">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Product Name *</Label>
                <Input 
                  id="name" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Organic Tomatoes"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your product..."
                  className="min-h-[120px]"
                />
              </div>
              
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vegetables">Vegetables</SelectItem>
                    <SelectItem value="fruits">Fruits</SelectItem>
                    <SelectItem value="dairy">Dairy</SelectItem>
                    <SelectItem value="meat">Meat</SelectItem>
                    <SelectItem value="grains">Grains</SelectItem>
                    <SelectItem value="herbs">Herbs & Spices</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="organic" 
                  checked={isOrganic}
                  onCheckedChange={setIsOrganic}
                />
                <Label htmlFor="organic">This product is organically grown</Label>
              </div>
              
              {isOrganic && (
                <div>
                  <Label htmlFor="certification">Certification Information</Label>
                  <Input 
                    id="certification" 
                    value={certificationInfo}
                    onChange={(e) => setCertificationInfo(e.target.value)}
                    placeholder="e.g. USDA Organic, EU Organic, etc."
                  />
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="images">
            <div className="space-y-4">
              <Label>Product Images</Label>
              <p className="text-sm text-gray-500 mb-4">
                Add up to 5 images of your product. The first image will be used as the main product image.
              </p>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-4">
                {previewUrls.map((url, index) => (
                  <div key={index} className="relative aspect-square rounded-md overflow-hidden border border-gray-200">
                    <img 
                      src={url} 
                      alt={`Product preview ${index + 1}`} 
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-sm"
                    >
                      <X className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>
                ))}
                
                {previewUrls.length < 5 && (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-md aspect-square cursor-pointer hover:bg-gray-50">
                    <div className="flex flex-col items-center justify-center p-2 text-center">
                      <UploadCloud className="h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-xs text-gray-500">Upload Image</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </label>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="inventory">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="price">Price per Unit *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <Input 
                      id="price" 
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.00"
                      className="pl-8"
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>
                </div>
                
                <div className="w-full sm:w-1/3">
                  <Label htmlFor="unit">Unit *</Label>
                  <Select defaultValue="kg" value={unit} onValueChange={setUnit}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">Kilogram (kg)</SelectItem>
                      <SelectItem value="g">Gram (g)</SelectItem>
                      <SelectItem value="lb">Pound (lb)</SelectItem>
                      <SelectItem value="oz">Ounce (oz)</SelectItem>
                      <SelectItem value="l">Liter (L)</SelectItem>
                      <SelectItem value="ml">Milliliter (ml)</SelectItem>
                      <SelectItem value="piece">Piece</SelectItem>
                      <SelectItem value="bunch">Bunch</SelectItem>
                      <SelectItem value="dozen">Dozen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="quantity">Available Quantity *</Label>
                <Input 
                  id="quantity" 
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                  min="1"
                  required
                />
              </div>
            </div>
          </TabsContent>
          
          <div className="mt-6 flex justify-end space-x-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Product'}
            </Button>
          </div>
          
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-market-600 h-2.5 rounded-full" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 mt-1">Uploading: {uploadProgress}%</p>
            </div>
          )}
        </form>
      </Tabs>
    </div>
  );
};

export default ProductForm;
