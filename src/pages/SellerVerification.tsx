
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileUpload } from "lucide-react";

const SellerVerification = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentPreview, setDocumentPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    businessName: "",
    location: "",
    bio: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setDocumentFile(file);

      // Create preview for PDF or image
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setDocumentPreview(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else if (file.type === 'application/pdf') {
        // For PDFs we can't show a preview easily, so just show the filename
        setDocumentPreview('PDF Document: ' + file.name);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload an image or PDF document",
          variant: "destructive"
        });
        setDocumentFile(null);
        setDocumentPreview(null);
      }
    }
  };

  const uploadDocument = async (): Promise<string | null> => {
    if (!documentFile || !user) return null;
    
    setIsUploading(true);
    try {
      const fileExt = documentFile.name.split('.').pop();
      const filePath = `${user.id}-verification-doc.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('verification-documents')
        .upload(filePath, documentFile, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data } = supabase.storage
        .from('verification-documents')
        .getPublicUrl(filePath);
      
      return data.publicUrl;
    } catch (error) {
      console.error("Error uploading document:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your verification document",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to continue",
        variant: "destructive"
      });
      navigate("/auth");
      return;
    }

    if (!documentFile) {
      toast({
        title: "Document required",
        description: "Please upload a verification document",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // First upload the document
      const documentUrl = await uploadDocument();
      
      if (!documentUrl) {
        throw new Error("Failed to upload document");
      }
      
      // Then update the profile
      const { error } = await supabase
        .from('profiles')
        .update({
          business_name: formData.businessName,
          location: formData.location,
          bio: formData.bio,
          role: 'farmer',
          verification_status: 'pending',
          verification_document: documentUrl
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      toast({
        title: "Verification submitted",
        description: "Your seller verification request has been submitted and is pending review."
      });
      
      navigate("/farmers");
    } catch (error) {
      console.error("Error submitting verification:", error);
      toast({
        title: "Submission failed",
        description: "There was an error submitting your verification. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto p-4 mt-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Seller Verification</CardTitle>
            <CardDescription>
              Provide your business information and submit a government ID to become a verified seller
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  name="businessName"
                  placeholder="Your farm or business name"
                  value={formData.businessName}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  placeholder="Your business location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio">About Your Business</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  placeholder="Tell us about your farm and products"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="document">Verification Document</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <Input
                    id="document"
                    type="file"
                    className="hidden"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                  />
                  <Label htmlFor="document" className="cursor-pointer block">
                    {documentPreview ? (
                      documentPreview.startsWith('PDF') ? (
                        <div className="text-market-600">{documentPreview}</div>
                      ) : (
                        <img 
                          src={documentPreview} 
                          alt="Document preview" 
                          className="mx-auto max-h-48 object-contain"
                        />
                      )
                    ) : (
                      <div className="space-y-2">
                        <FileUpload className="mx-auto h-10 w-10 text-gray-400" />
                        <p className="text-sm text-gray-500">
                          Upload a government-issued ID or business license
                        </p>
                        <p className="text-xs text-gray-400">
                          Accepted formats: JPG, PNG, PDF (max 5MB)
                        </p>
                      </div>
                    )}
                  </Label>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSubmitting || isUploading} className="w-full">
                {isSubmitting ? "Submitting..." : "Submit for Verification"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default SellerVerification;
