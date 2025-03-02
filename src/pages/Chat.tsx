
import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { useChat } from "@/contexts/ChatContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { CartProvider } from "@/contexts/CartContext";

const Chat = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { state, sendMessage, loadMessages } = useChat();
  const [newMessage, setNewMessage] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Get the conversation ID from the URL query params
  const conversationId = new URLSearchParams(location.search).get("conversation");
  
  // Scroll to bottom of messages
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
      loadMessages(conversationId);
    }
  }, [conversationId, navigate, toast, loadMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [state.messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    await sendMessage(newMessage);
    setNewMessage("");
  };

  const conversation = state.conversations.find(conv => conv.id === conversationId);
  
  return (
    <CartProvider>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        
        <div className="container mx-auto pt-24 pb-16 px-4">
          <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
            {/* Chat header */}
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
            
            {/* Messages */}
            <div className="h-[calc(100vh-320px)] overflow-y-auto p-4 bg-gray-50">
              {state.isLoading ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-market-500" />
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
                        <p className="text-xs opacity-70 mt-1">
                          {format(new Date(message.created_at), "h:mm a")}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Message input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1"
                  autoComplete="off"
                />
                <Button type="submit" disabled={!newMessage.trim() || state.isLoading}>
                  <Send className="h-4 w-4" />
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
