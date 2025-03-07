
import { useState, useRef, useEffect } from "react";
import { useChat } from "@/contexts/chat";
import { format } from "date-fns";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const ChatInterface = () => {
  const { state, sendMessage } = useChat();
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || isSending) return;

    try {
      setIsSending(true);
      await sendMessage(messageText.trim());
      setMessageText("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  // Find active conversation data
  const activeConversation = state.conversations.find(
    (conv) => conv.id === state.currentConversation
  );

  return (
    <div className="flex flex-col h-[500px]">
      {/* Chat header */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h3 className="font-medium">{activeConversation?.other_user_name || "Chat"}</h3>
          {activeConversation?.product_name && (
            <p className="text-sm text-gray-600">
              About: {activeConversation.product_name}
            </p>
          )}
        </div>
      </div>

      {/* Messages container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {state.isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : state.messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>No messages yet</p>
            <p className="text-sm">Start the conversation!</p>
          </div>
        ) : (
          state.messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "max-w-[80%] rounded-lg p-3",
                message.sender_name === "You"
                  ? "bg-primary text-primary-foreground ml-auto"
                  : "bg-gray-100 mr-auto"
              )}
            >
              <div className="flex justify-between items-baseline mb-1">
                <span className="font-medium text-sm">{message.sender_name}</span>
                <span className="text-xs opacity-70 ml-2">
                  {format(new Date(message.created_at), "h:mm a")}
                </span>
              </div>
              <p>{message.message}</p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <Textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type your message..."
            className="min-h-[60px] flex-1 resize-none"
            disabled={isSending || state.isLoading}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
          />
          <Button 
            type="submit" 
            disabled={!messageText.trim() || isSending || state.isLoading}
            size="icon"
            className="h-[60px]"
          >
            {isSending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;
