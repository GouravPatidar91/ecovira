
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
}

type ChatAction =
  | { type: "SET_CONVERSATIONS"; payload: Conversation[] }
  | { type: "SET_CURRENT_CONVERSATION"; payload: string | null }
  | { type: "SET_MESSAGES"; payload: ChatMessage[] }
  | { type: "ADD_MESSAGE"; payload: ChatMessage }
  | { type: "SET_LOADING"; payload: boolean }
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
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        loadConversations();
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
        (payload) => {
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [state.currentConversation]);

  const loadConversations = async () => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });

      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;

      const userId = session.session.user.id;

      // Get conversations where the user is either the buyer or seller
      const { data, error } = await supabase
        .from("chat_conversations")
        .select(
          `
          id,
          product_id,
          buyer_id,
          seller_id,
          created_at,
          products:product_id (name),
          buyer:buyer_id (full_name),
          seller:seller_id (business_name, full_name)
        `
        )
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);

      if (error) throw error;

      // Transform the data to include the name of the other user
      const conversations = data.map((conv: any) => {
        const isBuyer = conv.buyer_id === userId;
        let otherUserName = isBuyer
          ? conv.seller.business_name || conv.seller.full_name
          : conv.buyer.full_name;

        return {
          id: conv.id,
          product_id: conv.product_id,
          buyer_id: conv.buyer_id,
          seller_id: conv.seller_id,
          created_at: conv.created_at,
          other_user_name: otherUserName,
          product_name: conv.products?.name,
        };
      });

      dispatch({ type: "SET_CONVERSATIONS", payload: conversations });
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_CURRENT_CONVERSATION", payload: conversationId });

      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;

      const { data, error } = await supabase
        .from("chat_messages")
        .select(
          `
          id,
          conversation_id,
          sender_id,
          message,
          created_at,
          is_read,
          sender:sender_id (full_name, business_name)
        `
        )
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Transform the messages to include sender name
      const messages = data.map((msg: any) => ({
        ...msg,
        sender_name: msg.sender.business_name || msg.sender.full_name,
      }));

      dispatch({ type: "SET_MESSAGES", payload: messages });

      // Mark unread messages as read if user is the recipient
      const userId = session.session.user.id;
      const unreadMessages = messages.filter(
        (msg) => !msg.is_read && msg.sender_id !== userId
      );

      if (unreadMessages.length > 0) {
        await Promise.all(
          unreadMessages.map(async (msg) => {
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
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const startConversation = async (
    sellerId: string,
    productId?: string
  ): Promise<string> => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error("Not authenticated");

      const buyerId = session.session.user.id;

      // Check if a conversation already exists between these users for this product
      let { data: existingConv } = await supabase
        .from("chat_conversations")
        .select("id")
        .eq("buyer_id", buyerId)
        .eq("seller_id", sellerId);

      if (productId) {
        existingConv = existingConv?.filter(
          (conv) => conv.product_id === productId
        );
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

      if (error) throw error;

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

      if (error) throw error;

      // No need to add the message here, it will be added via the subscription
    } catch (error) {
      console.error("Error sending message:", error);
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
