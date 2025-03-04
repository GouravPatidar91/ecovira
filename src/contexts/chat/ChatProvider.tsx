
import React, { createContext, useContext, useReducer } from "react";
import { chatReducer, initialState } from './chatReducer';
import { ChatContextProps } from './types';
import { useAuthCheck } from './hooks/useAuthCheck';
import { useChatActions } from './hooks/useChatActions';
import { useChatSubscription } from './hooks/useChatSubscription';

const ChatContext = createContext<ChatContextProps | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  
  const { 
    loadConversations, 
    loadMessages, 
    startConversation, 
    sendMessage: sendMessageAction,
    setCurrentConversation 
  } = useChatActions(dispatch);

  // Handle auth state and initial data loading
  useAuthCheck(loadConversations, dispatch);
  
  // Set up real-time subscription for new messages
  useChatSubscription(state.currentConversation, dispatch);

  // Wrap the sendMessage function to provide the current conversation
  const sendMessage = async (message: string) => {
    return sendMessageAction(state.currentConversation, message);
  };

  const contextValue: ChatContextProps = {
    state,
    startConversation,
    sendMessage,
    loadConversations,
    loadMessages,
    setCurrentConversation,
  };

  return (
    <ChatContext.Provider value={contextValue}>
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
