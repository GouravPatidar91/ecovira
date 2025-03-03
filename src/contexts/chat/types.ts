
// Chat related types
export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  message: string;
  created_at: string;
  is_read: boolean;
  sender_name?: string;
}

export interface Conversation {
  id: string;
  product_id: string | null;
  buyer_id: string;
  seller_id: string;
  created_at: string;
  updated_at?: string;
  last_message?: string;
  unread_count?: number;
  other_user_name?: string;
  product_name?: string;
}

export interface ChatState {
  conversations: Conversation[];
  currentConversation: string | null;
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
}

export type ChatAction =
  | { type: "SET_CONVERSATIONS"; payload: Conversation[] }
  | { type: "SET_CURRENT_CONVERSATION"; payload: string | null }
  | { type: "SET_MESSAGES"; payload: ChatMessage[] }
  | { type: "ADD_MESSAGE"; payload: ChatMessage }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "MARK_AS_READ"; payload: string };

export interface ChatContextProps {
  state: ChatState;
  startConversation: (sellerId: string, productId?: string) => Promise<string>;
  sendMessage: (message: string) => Promise<void>;
  loadConversations: () => Promise<void>;
  loadMessages: (conversationId: string) => Promise<void>;
  setCurrentConversation: (conversationId: string | null) => void;
}
