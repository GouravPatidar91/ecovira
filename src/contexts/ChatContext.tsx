
import React, { createContext, useContext, useReducer, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// Define the Chat types
export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  message: string;
  created_at: string;
  is_read: boolean;
  sender_name?: string;
}

interface Conversation {
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

interface ChatState {
  conversations: Conversation[];
  currentConversation: string | null;
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
}

type ChatAction =
  | { type: "SET_CONVERSATIONS"; payload: Conversation[] }
  | { type: "SET_CURRENT_CONVERSATION"; payload: string | null }
  | { type: "SET_MESSAGES"; payload: ChatMessage[] }
  | { type: "ADD_MESSAGE"; payload: ChatMessage }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "MARK_AS_READ"; payload: string };

interface ChatContextProps {
  state: ChatState;
  startConversation: (sellerId: string, productId?: string) => Promise<string>;
  sendMessage: (message: string) => Promise<void>;
  loadConversations: () => Promise<void>;
  loadMessages: (conversationId: string) => Promise<void>;
  setCurrentConversation: (conversationId: string | null) => void;
}

const ChatContext = createContext<ChatContextProps | undefined>(undefined);

const initialState: ChatState = {
  conversations: [],
  currentConversation: null,
  messages: [],
  isLoading: false,
  error: null,
};

const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case "SET_CONVERSATIONS":
      return { ...state, conversations: action.payload };
    case "SET_CURRENT_CONVERSATION":
      return { ...state, currentConversation: action.payload };
    case "SET_MESSAGES":
      return { ...state, messages: action.payload };
    case "ADD_MESSAGE":
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "MARK_AS_READ":
      return {
        ...state,
        messages: state.messages.map((msg) =>
          msg.id === action.payload ? { ...msg, is_read: true } : msg
        ),
      };
    default:
      return state;
  }
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  // Load conversations when the user logs in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          loadConversations();
        }
      } catch (error) {
        console.error("Auth check error:", error);
        dispatch({ type: "SET_ERROR", payload: "Authentication error" });
      }
    };

    checkAuth();

    // Subscribe to new messages
    const channel = supabase
      .channel("chat_updates")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
        },
        (payload: any) => {
          // Only add the message if it's for the current conversation
          if (
            payload.new &&
            payload.new.conversation_id === state.currentConversation
          ) {
            const newMessage = payload.new as ChatMessage;
            dispatch({ type: "ADD_MESSAGE", payload: newMessage });
          }
        }
      )
      .subscribe((status) => {
        console.log("Subscription status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [state.currentConversation]);

  const loadConversations = async () => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });

      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        dispatch({ type: "SET_ERROR", payload: "No active session" });
        return;
      }

      const userId = session.session.user.id;

      // Get conversations where the user is either the buyer or seller
      const { data, error } = await supabase
        .from('chat_conversations')
        .select(`
          id,
          product_id,
          buyer_id,
          seller_id,
          created_at,
          updated_at,
          products(name),
          chat_messages(message, created_at)
        `)
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error("Error loading conversations:", error);
        dispatch({ type: "SET_ERROR", payload: error.message });
        return;
      }

      // Transform the data to include conversation details
      const conversations: Conversation[] = data?.map((conv: any) => {
        const isUserBuyer = conv.buyer_id === userId;
        const otherUserId = isUserBuyer ? conv.seller_id : conv.buyer_id;
        
        return {
          id: conv.id,
          product_id: conv.product_id,
          buyer_id: conv.buyer_id,
          seller_id: conv.seller_id,
          created_at: conv.created_at,
          updated_at: conv.updated_at,
          product_name: conv.products?.name || "Unknown Product",
          other_user_name: "User " + otherUserId.substring(0, 4), // Placeholder
          last_message: conv.chat_messages && conv.chat_messages.length > 0 
            ? conv.chat_messages[0].message 
            : "",
        };
      }) || [];

      dispatch({ type: "SET_CONVERSATIONS", payload: conversations });
    } catch (error) {
      console.error("Error loading conversations:", error);
      dispatch({ type: "SET_ERROR", payload: "Failed to load conversations" });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });
      dispatch({ type: "SET_CURRENT_CONVERSATION", payload: conversationId });

      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        dispatch({ type: "SET_ERROR", payload: "No active session" });
        return;
      }

      // Fetch messages directly from the chat_messages table
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*, profiles!sender_id(full_name, business_name)')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error("Error loading messages:", error);
        dispatch({ type: "SET_ERROR", payload: error.message });
        return;
      }

      // Transform the data to include sender name
      const messages: ChatMessage[] = data?.map((msg: any) => ({
        id: msg.id,
        conversation_id: msg.conversation_id,
        sender_id: msg.sender_id,
        message: msg.message,
        created_at: msg.created_at,
        is_read: msg.is_read,
        sender_name: msg.profiles?.business_name || msg.profiles?.full_name || 'Unknown',
      })) || [];

      dispatch({ type: "SET_MESSAGES", payload: messages });

      // Mark unread messages as read if user is the recipient
      const userId = session.session.user.id;
      const unreadMessages = messages.filter(
        (msg: ChatMessage) => !msg.is_read && msg.sender_id !== userId
      );

      if (unreadMessages.length > 0) {
        await Promise.all(
          unreadMessages.map(async (msg: ChatMessage) => {
            await supabase
              .from("chat_messages")
              .update({ is_read: true })
              .eq("id", msg.id);
            dispatch({ type: "MARK_AS_READ", payload: msg.id });
          })
        );
      }
    } catch (error) {
      console.error("Error loading messages:", error);
      dispatch({ type: "SET_ERROR", payload: "Failed to load messages" });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const startConversation = async (
    sellerId: string,
    productId?: string
  ): Promise<string> => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });

      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error("Not authenticated");

      const buyerId = session.session.user.id;

      // Check if a conversation already exists between these users for this product
      let query = supabase
        .from("chat_conversations")
        .select("id")
        .eq("buyer_id", buyerId)
        .eq("seller_id", sellerId);

      if (productId) {
        query = query.eq("product_id", productId);
      }

      const { data: existingConv, error: queryError } = await query;

      if (queryError) {
        console.error("Error checking existing conversations:", queryError);
        dispatch({ type: "SET_ERROR", payload: queryError.message });
        throw queryError;
      }

      if (existingConv && existingConv.length > 0) {
        // Conversation exists, return its ID
        const conversationId = existingConv[0].id;
        dispatch({
          type: "SET_CURRENT_CONVERSATION",
          payload: conversationId,
        });
        await loadMessages(conversationId);
        return conversationId;
      }

      // Create a new conversation
      const { data, error } = await supabase
        .from("chat_conversations")
        .insert({
          buyer_id: buyerId,
          seller_id: sellerId,
          product_id: productId || null,
        })
        .select()
        .single();

      if (error) {
        dispatch({ type: "SET_ERROR", payload: error.message });
        throw error;
      }

      const newConversation = {
        id: data.id,
        product_id: data.product_id,
        buyer_id: data.buyer_id,
        seller_id: data.seller_id,
        created_at: data.created_at,
      };

      dispatch({
        type: "SET_CONVERSATIONS",
        payload: [...state.conversations, newConversation],
      });
      dispatch({ type: "SET_CURRENT_CONVERSATION", payload: data.id });

      return data.id;
    } catch (error) {
      console.error("Error starting conversation:", error);
      throw error;
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const sendMessage = async (message: string) => {
    try {
      if (!state.currentConversation) {
        throw new Error("No active conversation");
      }

      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase
        .from("chat_messages")
        .insert({
          conversation_id: state.currentConversation,
          sender_id: session.session.user.id,
          message,
          is_read: false,
        })
        .select()
        .single();

      if (error) {
        console.error("Error sending message:", error);
        throw error;
      }

      // Add the message to the state immediately for better UX
      // It will also be added via the subscription
      dispatch({ 
        type: "ADD_MESSAGE", 
        payload: {
          id: data.id,
          conversation_id: data.conversation_id,
          sender_id: data.sender_id,
          message: data.message,
          created_at: data.created_at,
          is_read: data.is_read
        } 
      });
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  };

  const setCurrentConversation = (conversationId: string | null) => {
    dispatch({ type: "SET_CURRENT_CONVERSATION", payload: conversationId });
    if (conversationId) {
      loadMessages(conversationId);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        state,
        startConversation,
        sendMessage,
        loadConversations,
        loadMessages,
        setCurrentConversation,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
