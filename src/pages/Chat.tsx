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
import UrbanChatBubble from "@/components/UrbanChatBubble";
import { motion, AnimatePresence } from "framer-motion";

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
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-market-800 to-zinc-800 relative transition-colors duration-500">
        <Navigation />
        
        <div className="container mx-auto pt-24 pb-16 px-4 z-10 relative">
          <div className="max-w-3xl mx-auto glassmorphic border border-market-700/30 rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
            <motion.div
              initial={{ opacity: 0, y: -32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.48, type: "spring", damping: 18 }}
              className="bg-gradient-to-r from-market-600 to-market-500 text-white p-4 flex items-center"
            >
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white mr-2 hover:scale-110 transition-transform"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h2 className="font-semibold text-lg tracking-wide">
                  {conversation?.other_user_name || "Chat"}
                </h2>
                {conversation?.product_name && (
                  <p className="text-xs text-white/80">
                    Product: {conversation.product_name}
                  </p>
                )}
              </div>
            </motion.div>

            {/* MESSAGES LIST */}
            <div className="h-[calc(100vh-320px)] overflow-y-auto px-2 sm:px-4 py-6 bg-gradient-to-b from-zinc-900/90 via-market-800/80 to-zinc-900/95">
              {state.isLoading ? (
                <div className="flex justify-center items-center h-full">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.36, delay: 0.1 }}
                  >
                    <Loader2 className="h-7 w-7 animate-spin text-market-400" />
                  </motion.div>
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
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.48 }}
                  className="text-center text-market-200 my-12"
                >
                  <p>No messages yet</p>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.24 }}
                    className="text-sm text-market-300"
                  >
                    Start the conversation by sending a message
                  </motion.p>
                </motion.div>
              ) : (
                <AnimatePresence initial={false}>
                  {state.messages.map((message) => {
                    const isCurrentUser = message.sender_id === userId;
                    return (
                      <UrbanChatBubble
                        key={message.id}
                        message={message.message}
                        isCurrentUser={isCurrentUser}
                        timestamp={format(new Date(message.created_at), "h:mm a")}
                        isRead={message.is_read}
                        statusSlot={
                          isCurrentUser && (
                            <motion.span
                              initial={{ opacity: 0.5, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="flex items-center text-xs gap-1"
                            >
                              {message.is_read ? (
                                <>
                                  <Check className="h-3 w-3 text-market-200" />
                                  <span className="text-market-200">Seen</span>
                                </>
                              ) : (
                                <span className="opacity-80 text-market-400">Sent</span>
                              )}
                            </motion.span>
                          )
                        }
                      />
                    );
                  })}
                </AnimatePresence>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* INPUT BAR */}
            <motion.form
              onSubmit={handleSendMessage}
              className="p-4 border-t bg-gradient-to-r from-market-800/90 to-zinc-900/80 flex gap-2"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: 0.12 }}
            >
              <Input
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 bg-zinc-900/80 border-market-700/50 text-white placeholder:text-market-300 focus-visible:ring-market-400"
                autoComplete="off"
                disabled={state.isLoading || isLocalLoading || !!loadError}
              />
              <Button 
                type="submit" 
                disabled={!newMessage.trim() || state.isLoading || isLocalLoading || !!loadError}
                className="shadow-md bg-market-500 hover:bg-market-400 text-white px-5"
              >
                {isLocalLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </motion.form>
          </div>
        </div>
      </div>

      {/* Urban animated blur background effect */}
      <div className="pointer-events-none fixed top-0 left-0 w-full h-full z-0">
        <motion.div
          initial={{ opacity: 0.6, scale: 0.9 }}
          animate={{ opacity: 0.24, scale: 1.16 }}
          transition={{ duration: 2.2, repeat: Infinity, repeatType: "reverse" }}
          className="absolute -top-32 -right-24 bg-gradient-to-bl from-market-400/10 via-market-600/40 to-market-900/0 w-[480px] h-[480px] rounded-full blur-[160px]"
        />
      </div>
    </CartProvider>
  );
};

export default Chat;
