
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/contexts/chat";
import ChatInterface from "@/components/ChatInterface";
import ChatList from "@/components/ChatList";
import { Loader2 } from "lucide-react";

const Chats = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const conversationId = searchParams.get("conversation");
  const { state, loadConversations, setCurrentConversation } = useChat();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const initializeChat = async () => {
      try {
        await loadConversations();
        if (conversationId) {
          setCurrentConversation(conversationId);
        }
      } catch (error) {
        console.error("Error initializing chat:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeChat();
  }, [user, navigate, conversationId, loadConversations, setCurrentConversation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto p-4 mt-8 flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto p-4 mt-8">
        <h1 className="text-2xl font-bold mb-6">Messages</h1>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-4 min-h-[500px]">
            <div className="col-span-1 border-r border-gray-200">
              <ChatList 
                conversations={state.conversations} 
                activeConversationId={state.currentConversation}
                onSelectConversation={setCurrentConversation}
              />
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
