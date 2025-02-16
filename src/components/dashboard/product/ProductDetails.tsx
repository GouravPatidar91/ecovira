
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

interface ProductDetailsProps {
  formData: {
    name: string;
    description: string;
    price: number;
    unit: string;
    quantity_available: number;
    is_organic: boolean;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onOrganicChange: (checked: boolean) => void;
}

const ProductDetails = ({ formData, onChange, onOrganicChange }: ProductDetailsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <Label htmlFor="name">Product Name</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={onChange}
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
          onChange={onChange}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="unit">Unit</Label>
        <Input
          id="unit"
          name="unit"
          value={formData.unit}
          onChange={onChange}
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
          onChange={onChange}
          required
        />
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={onChange}
          rows={4}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_organic"
          checked={formData.is_organic}
          onCheckedChange={onOrganicChange}
        />
        <Label htmlFor="is_organic">Organic Product</Label>
      </div>
    </div>
  );
};

export default ProductDetails;
