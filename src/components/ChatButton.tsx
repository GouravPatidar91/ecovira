import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChat } from "@/contexts/chat";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ChatButtonProps {
  sellerId: string;
  productId: string;
  className?: string;
}

const ChatButton = ({ sellerId, productId, className }: ChatButtonProps) => {
  const { startConversation } = useChat();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleChatClick = async () => {
    try {
      setIsLoading(true);
      
      // Check if user is authenticated
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        toast({
          title: "Authentication Required",
          description: "Please log in to chat with the seller",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }
      
      // Don't allow sellers to chat with themselves
      if (session.session.user.id === sellerId) {
        toast({
          title: "Cannot Chat",
          description: "You cannot chat with yourself",
        });
        return;
      }

      // Start or open existing conversation
      const conversationId = await startConversation(sellerId, productId);
      
      // Navigate to chat page with the conversation ID
      navigate(`/chat?conversation=${conversationId}`);
    } catch (error) {
      console.error("Error starting chat:", error);
      toast({
        title: "Error",
        description: "Failed to start chat. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      className={className}
      onClick={handleChatClick}
      disabled={isLoading}
    >
      {isLoading ? (
        <span>Loading...</span>
      ) : (
        <>
          <MessageCircle className="h-4 w-4 mr-1" />
          Chat with Seller
        </>
      )}
    </Button>
  );
};

export default ChatButton;
