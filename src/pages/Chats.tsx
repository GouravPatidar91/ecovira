
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/contexts/chat";
import ChatInterface from "@/components/ChatInterface";
import ChatList from "@/components/ChatList";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const Chats = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const conversationId = searchParams.get("conversation");
  const { state, loadConversations, setCurrentConversation } = useChat();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const initializeChat = async () => {
      try {
        setIsLoading(true);
        setError(null);
        await loadConversations();
        
        if (conversationId) {
          setCurrentConversation(conversationId);
        }
      } catch (error) {
        console.error("Error initializing chat:", error);
        setError("Could not load your conversations. Please try again later.");
        toast({
          title: "Error",
          description: "Failed to load conversations",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    initializeChat();
  }, [user, navigate, conversationId, loadConversations, setCurrentConversation, toast]);

  if (isLoading) {
    return (
      <div className="page-container">
        <Navigation />
        <div className="container-layout section-padding flex justify-center items-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-gray-500">Loading your conversations...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <Navigation />
        <div className="container-layout section-padding">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error Loading Conversations</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Navigation />
      <div className="container-layout section-padding">
        <h1 className="text-2xl font-bold mb-6">Messages</h1>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-4 min-h-[500px] lg:min-h-[600px]">
            <div className="col-span-1 border-r border-gray-200">
              {state.conversations.length > 0 ? (
                <ChatList 
                  conversations={state.conversations} 
                  activeConversationId={state.currentConversation}
                  onSelectConversation={setCurrentConversation}
                />
              ) : (
                <div className="p-6 text-center text-gray-500">
                  <p>No conversations yet</p>
                  <p className="text-sm mt-2">Visit a product page to chat with a seller</p>
                </div>
              )}
            </div>
            <div className="col-span-1 md:col-span-3">
              {state.currentConversation ? (
                <ChatInterface />
              ) : (
                <div className="h-full flex items-center justify-center p-6 text-center text-gray-500">
                  <div>
                    <p className="text-lg mb-2">Select a conversation to start chatting</p>
                    <p className="text-sm">Or visit a product page to chat with a seller</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chats;
