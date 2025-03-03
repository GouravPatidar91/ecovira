
import { supabase } from "@/integrations/supabase/client";
import { Conversation, ChatMessage } from './types';

export const chatService = {
  async loadConversations(userId: string): Promise<Conversation[]> {
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
      throw error;
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

    return conversations;
  },

  async loadMessages(conversationId: string, userId: string): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*, profiles!sender_id(full_name, business_name)')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error("Error loading messages:", error);
      throw error;
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

    return messages;
  },

  async markMessagesAsRead(messages: ChatMessage[], userId: string): Promise<void> {
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
        })
      );
    }
  },

  async startConversation(buyerId: string, sellerId: string, productId?: string): Promise<string> {
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
      throw queryError;
    }

    if (existingConv && existingConv.length > 0) {
      // Conversation exists, return its ID
      return existingConv[0].id;
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
      throw error;
    }

    return data.id;
  },

  async sendMessage(conversationId: string, senderId: string, message: string): Promise<ChatMessage> {
    const { data, error } = await supabase
      .from("chat_messages")
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        message,
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Error sending message:", error);
      throw error;
    }

    return {
      id: data.id,
      conversation_id: data.conversation_id,
      sender_id: data.sender_id,
      message: data.message,
      created_at: data.created_at,
      is_read: data.is_read
    };
  }
};
