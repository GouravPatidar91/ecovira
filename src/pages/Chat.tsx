
import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { useChat } from "@/contexts/chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Send, Loader2, AlertCircle, RefreshCw, Check } from "lucide-react";
import { format } from "date-fns";
import { CartProvider } from "@/contexts/CartContext";
import { useIsMobile } from "@/hooks/use-mobile";

const Chat = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { state, sendMessage, loadMessages } = useChat();
  const [newMessage, setNewMessage] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [isLocalLoading, setIsLocalLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  
  const conversationId = new URLSearchParams(location.search).get("conversation");
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        toast({
          title: "Authentication Required",
          description: "Please log in to access chat",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }
      setUserId(data.session.user.id);
    };

    checkAuth();

    if (conversationId) {
      loadConversationMessages();
    }
  }, [conversationId]);

  const loadConversationMessages = () => {
    if (!conversationId) return;
    
    setLoadError(null);
    
    loadMessages(conversationId).catch(error => {
      console.error("Error in Chat component when loading messages:", error);
      setLoadError("Failed to load messages. Please try again later.");
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [state.messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isLocalLoading) return;
    
    try {
      setIsLocalLoading(true);
      await sendMessage(newMessage);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Failed to send message",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLocalLoading(false);
    }
  };

  const conversation = state.conversations.find(conv => conv.id === conversationId);
  
  return (
    <CartProvider>
      <div className="page-container">
        <Navigation />
        
        <div className="container-layout section-padding">
          <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-market-500 text-white p-4 flex items-center">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white mr-2"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h2 className="font-semibold">
                  {conversation?.other_user_name || "Chat"}
                </h2>
                {conversation?.product_name && (
                  <p className="text-xs text-white/80">
                    Product: {conversation.product_name}
                  </p>
                )}
              </div>
            </div>
            
            <div className={`${isMobile ? 'h-[calc(100vh-280px)]' : 'h-[calc(100vh-320px)]'} overflow-y-auto p-4 bg-gray-50`}>
              {state.isLoading ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-market-500" />
                </div>
              ) : loadError ? (
                <div className="flex flex-col justify-center items-center h-full text-red-500">
                  <AlertCircle className="h-8 w-8 mb-2" />
                  <p>{loadError}</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={loadConversationMessages}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              ) : state.messages.length === 0 ? (
                <div className="text-center text-gray-500 my-8">
                  <p>No messages yet</p>
                  <p className="text-sm">Start the conversation by sending a message</p>
                </div>
              ) : (
                state.messages.map((message) => {
                  const isCurrentUser = message.sender_id === userId;
                  return (
                    <div
                      key={message.id}
                      className={`flex mb-4 ${
                        isCurrentUser ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          isCurrentUser
                            ? "bg-market-500 text-white"
                            : "bg-gray-200 text-gray-800"
                        }`}
                      >
                        <p className="text-sm">{message.message}</p>
                        <div className="flex justify-between items-center mt-1">
                          <p className="text-xs opacity-70">
                            {format(new Date(message.created_at), "h:mm a")}
                          </p>
                          {isCurrentUser && (
                            <span className="flex items-center text-xs">
                              {message.is_read ? (
                                <span className="flex items-center">
                                  <Check className="h-3 w-3 mr-1" />
                                  <span>Seen</span>
                                </span>
                              ) : (
                                <span className="opacity-70">Sent</span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <form onSubmit={handleSendMessage} className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1"
                  autoComplete="off"
                  disabled={state.isLoading || isLocalLoading || !!loadError}
                />
                <Button 
                  type="submit" 
                  disabled={!newMessage.trim() || state.isLoading || isLocalLoading || !!loadError}
                >
                  {isLocalLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </CartProvider>
  );
};

export default Chat;
