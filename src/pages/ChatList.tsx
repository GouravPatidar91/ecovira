import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { useChat } from "@/contexts/chat";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { MessageCircle, Loader2 } from "lucide-react";
import { CartProvider } from "@/contexts/CartContext";
import { motion, AnimatePresence } from "framer-motion";

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
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-market-800 to-zinc-800 transition-colors duration-500">
        <Navigation />
        
        <div className="container mx-auto pt-24 pb-16 px-4">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-market-100">Conversations</h1>
            
            {state.isLoading ? (
              <div className="flex justify-center items-center h-64">
                <motion.div
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.42 }}
                >
                  <Loader2 className="h-8 w-8 animate-spin text-market-400" />
                </motion.div>
              </div>
            ) : state.conversations.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.42 }}
                className="bg-gradient-to-tr from-market-900/70 via-zinc-800/90 to-market-800/80 rounded-xl shadow-xl p-8 text-center"
              >
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-market-300" />
                <h2 className="text-xl font-semibold mb-2 text-market-200">No conversations yet</h2>
                <p className="text-market-400">
                  Your conversations with sellers will appear here
                </p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {state.conversations.map((conversation, idx) => (
                    <motion.div
                      key={conversation.id}
                      initial={{ opacity: 0, y: 20, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: 0.03 * idx, duration: 0.36, type: "spring", stiffness: 210 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="bg-gradient-to-br from-market-700/80 to-zinc-900/90 border border-market-500/25 rounded-lg shadow-xl p-4 hover:scale-105 hover:shadow-2xl transition-all cursor-pointer"
                      onClick={() => handleOpenChat(conversation.id)}
                      style={{
                        boxShadow: "0 2px 16px 0 #a3e63522, 0 4px 32px 0 #1e293b33"
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-market-100 tracking-wide">{conversation.other_user_name}</h3>
                          {conversation.product_name && (
                            <p className="text-sm text-market-200">
                              Product: {conversation.product_name}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-market-400 font-mono">
                          {format(new Date(conversation.created_at), "MMM d, yyyy")}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* Urban blurred gradient background */}
        <div className="pointer-events-none fixed top-0 left-0 w-full h-full z-0">
          <motion.div
            initial={{ opacity: 0.7, scale: 0.92 }}
            animate={{ opacity: 0.18, scale: 1.09 }}
            transition={{ duration: 2.25, repeat: Infinity, repeatType: "reverse" }}
            className="absolute -top-24 -right-24 bg-gradient-to-br from-market-500/10 via-market-600/40 to-market-900/0 w-[380px] h-[380px] rounded-full blur-[140px]"
          />
        </div>
      </div>
    </CartProvider>
  );
};

export default ChatList;
