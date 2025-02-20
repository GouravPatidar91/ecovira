
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { CartProvider } from "@/contexts/CartContext";

const SellerVerification = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    businessName: "",
    location: "",
    bio: "",
    document: null as File | null,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, document: e.target.files![0] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      let documentUrl = null;

      // Upload verification document if provided
      if (formData.document) {
        try {
          // Generate a unique filename to avoid conflicts
          const fileExt = formData.document.name.split('.').pop();
          const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2)}`;
          const fileName = `verification/${session.user.id}/${uniqueId}.${fileExt}`;

          // First, try to upload the file
          const { error: uploadError, data } = await supabase.storage
            .from('documents')
            .upload(fileName, formData.document, {
              cacheControl: '3600',
              upsert: false // Set to false to prevent overwriting existing files
            });

          if (uploadError) {
            console.error('Upload error details:', uploadError);
            throw new Error(`Failed to upload document: ${uploadError.message}`);
          }

          // If upload successful, get the public URL
          const { data: { publicUrl } } = supabase.storage
            .from('documents')
            .getPublicUrl(fileName);

          documentUrl = publicUrl;
        } catch (uploadError) {
          console.error('Document upload error:', uploadError);
          throw new Error('Failed to upload verification document. Please try again.');
        }
      }

      // Update profile with business details
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          business_name: formData.businessName,
          location: formData.location,
          bio: formData.bio,
          verification_status: 'pending',
          role: 'farmer',
          verification_document: documentUrl
        })
        .eq('id', session.user.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
        throw new Error(`Failed to update profile: ${profileError.message}`);
      }

      toast({
        title: "Verification Submitted",
        description: "Your seller verification request has been submitted for review.",
      });

      navigate('/farmers');
    } catch (error) {
      console.error('Error during verification:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit verification request",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <CartProvider>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        
        <div className="pt-24 pb-12">
          <div className="container mx-auto max-w-2xl px-4">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h1 className="text-2xl font-semibold mb-6">Seller Verification</h1>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    value={formData.businessName}
                    onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Business Description</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="document">Verification Document</Label>
                  <Input
                    id="document"
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                    required
                  />
                  <p className="text-sm text-gray-500">
                    Please upload a business license or any other relevant documentation (PDF, JPG, or PNG)
                  </p>
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Submitting..." : "Submit for Verification"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </CartProvider>
  );
};

export default SellerVerification;
