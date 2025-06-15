import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { useChat } from "@/contexts/chat";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { MessageCircle, Loader2 } from "lucide-react";
import { CartProvider } from "@/contexts/CartContext";

const ChatList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { state, loadConversations } = useChat();

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        toast({
          title: "Authentication Required",
          description: "Please log in to access your conversations",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }
      
      loadConversations();
    };

    checkAuth();
  }, [navigate, toast]);

  const handleOpenChat = (conversationId: string) => {
    navigate(`/chat?conversation=${conversationId}`);
  };

  return (
    <CartProvider>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        
        <div className="container mx-auto pt-24 pb-16 px-4">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Conversations</h1>
            
            {state.isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-market-500" />
              </div>
            ) : state.conversations.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h2 className="text-xl font-semibold mb-2">No conversations yet</h2>
                <p className="text-gray-500">
                  Your conversations with sellers will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {state.conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleOpenChat(conversation.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{conversation.other_user_name}</h3>
                        {conversation.product_name && (
                          <p className="text-sm text-gray-500">
                            Product: {conversation.product_name}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        {format(new Date(conversation.created_at), "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </CartProvider>
  );
};

export default ChatList;
