
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Upload } from 'lucide-react';

interface AvatarUploadProps {
  userId: string;
  avatarUrl: string | null;
  businessName: string | null;
  onUploadSuccess: (newAvatarUrl: string) => void;
}

const AvatarUpload = ({ userId, avatarUrl, businessName, onUploadSuccess }: AvatarUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({ title: "Please select a file first.", variant: "destructive" });
      return;
    }
    if (!userId) {
      toast({ title: "User not found.", variant: "destructive" });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
        
      // Add a timestamp to bust cache
      const newAvatarUrl = `${publicUrl}?t=${new Date().getTime()}`;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: newAvatarUrl })
        .eq('id', userId);

      if (updateError) {
        throw updateError;
      }

      toast({ title: "Avatar updated successfully!" });
      onUploadSuccess(newAvatarUrl);
      setFile(null);
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Error uploading avatar",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'AV';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <Avatar className="h-24 w-24">
        <AvatarImage src={avatarUrl || undefined} alt="User Avatar" />
        <AvatarFallback className="text-3xl">{getInitials(businessName)}</AvatarFallback>
      </Avatar>
      <div className="space-y-2 text-center">
        <Input type="file" id="avatar-upload" accept="image/png, image/jpeg" onChange={handleFileChange} className="max-w-xs text-sm" />
        <Button onClick={handleUpload} disabled={uploading || !file} size="sm">
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload Photo
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default AvatarUpload;
