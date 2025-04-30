
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { useChat } from "@/contexts/chat";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

interface ChatButtonProps {
  sellerId: string;
  productId?: string;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

const ChatButton = ({ 
  sellerId, 
  productId, 
  className = "", 
  variant = "outline" 
}: ChatButtonProps) => {
  const { user } = useAuth();
  const { startConversation } = useChat();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const isMobile = useIsMobile();

  const handleChat = async () => {
    if (!user) {
      navigate("/auth");
      toast({
        title: "Authentication required",
        description: "Please log in to chat with sellers",
      });
      return;
    }
    
    try {
      setIsLoading(true);
      const conversationId = await startConversation(sellerId, productId);
      navigate(`/chats?conversation=${conversationId}`);
    } catch (error) {
      console.error("Error starting conversation:", error);
      toast({
        title: "Error",
        description: "Could not start the conversation. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleChat} 
      variant={variant} 
      className={`flex items-center ${className}`}
      disabled={isLoading}
      size={isMobile ? "sm" : "default"}
    >
      <MessageSquare className="mr-2 h-4 w-4" />
      {isLoading ? "Connecting..." : isMobile ? "Chat" : "Chat with Seller"}
    </Button>
  );
};

export default ChatButton;
