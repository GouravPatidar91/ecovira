
import { Conversation } from "@/contexts/chat/types";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface ChatListProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
}

const ChatList = ({ 
  conversations, 
  activeConversationId, 
  onSelectConversation 
}: ChatListProps) => {
  if (conversations.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>No conversations yet</p>
      </div>
    );
  }
  
  return (
    <div className="overflow-y-auto max-h-[500px]">
      {conversations.map((conversation) => (
        <div
          key={conversation.id}
          className={cn(
            "p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors",
            activeConversationId === conversation.id && "bg-gray-100"
          )}
          onClick={() => onSelectConversation(conversation.id)}
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium">{conversation.other_user_name}</h3>
              <p className="text-sm text-gray-600 truncate">
                {conversation.product_name || "Conversation"}
              </p>
            </div>
            {conversation.updated_at && (
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(conversation.updated_at), { addSuffix: true })}
              </span>
            )}
          </div>
          {conversation.last_message && (
            <p className="text-sm text-gray-500 mt-1 truncate">
              {conversation.last_message}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

export default ChatList;
