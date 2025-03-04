
import { useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { ChatMessage } from '../types';

export const useChatSubscription = (
  conversationId: string | null,
  dispatch: React.Dispatch<any>
) => {
  useEffect(() => {
    if (!conversationId) return;

    // Subscribe to new messages for the current conversation
    const channel = supabase
      .channel("chat_updates")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload: any) => {
          // Only add messages from other users (not our own, which we add manually)
          const { data: session } = await supabase.auth.getSession();
          if (session?.session && payload.new.sender_id !== session.session.user.id) {
            const newMessage = {
              ...payload.new,
              sender_name: 'User ' + payload.new.sender_id.substring(0, 4)
            } as ChatMessage;
            
            dispatch({ type: "ADD_MESSAGE", payload: newMessage });
            
            // Mark the message as read
            await supabase
              .from("chat_messages")
              .update({ is_read: true })
              .eq("id", newMessage.id);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload: any) => {
          // Update message read status
          dispatch({ 
            type: "UPDATE_MESSAGE", 
            payload: { 
              id: payload.new.id, 
              is_read: payload.new.is_read 
            } 
          });
        }
      )
      .subscribe((status) => {
        console.info("Subscription status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, dispatch]);
};
