
import { useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { chatService } from '../chatService';

export const useChatActions = (dispatch: React.Dispatch<any>) => {
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
      throw error; // Propagate the error for better handling in UI
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

  const sendMessage = async (conversationId: string | null, message: string) => {
    try {
      if (!conversationId) {
        throw new Error("No active conversation");
      }

      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error("Not authenticated");
      }

      const newMessage = await chatService.sendMessage(
        conversationId,
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

  return {
    loadConversations,
    loadMessages,
    startConversation,
    sendMessage,
    setCurrentConversation
  };
};
