
import React, { createContext, useContext, useReducer, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { chatReducer, initialState } from './chatReducer';
import { chatService } from './chatService';
import { ChatContextProps, ChatMessage } from './types';

const ChatContext = createContext<ChatContextProps | undefined>(undefined);

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
      const conversations = await chatService.loadConversations(userId);
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

      const userId = session.session.user.id;
      
      // Fetch messages
      const messages = await chatService.loadMessages(conversationId, userId);
      dispatch({ type: "SET_MESSAGES", payload: messages });

      // Mark unread messages as read
      await chatService.markMessagesAsRead(messages, userId);
      messages.forEach(msg => {
        if (!msg.is_read && msg.sender_id !== userId) {
          dispatch({ type: "MARK_AS_READ", payload: msg.id });
        }
      });
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
      
      // Start or get existing conversation
      const conversationId = await chatService.startConversation(buyerId, sellerId, productId);
      
      // Set current conversation and load messages
      dispatch({ type: "SET_CURRENT_CONVERSATION", payload: conversationId });
      await loadMessages(conversationId);
      
      return conversationId;
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

      const newMessage = await chatService.sendMessage(
        state.currentConversation,
        session.session.user.id,
        message
      );

      // Add the message to the state immediately for better UX
      dispatch({ type: "ADD_MESSAGE", payload: newMessage });
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  };

  const setCurrentConversation = useCallback((conversationId: string | null) => {
    dispatch({ type: "SET_CURRENT_CONVERSATION", payload: conversationId });
    if (conversationId) {
      loadMessages(conversationId);
    }
  }, []);

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
