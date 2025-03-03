
import { ChatState, ChatAction } from './types';

export const initialState: ChatState = {
  conversations: [],
  currentConversation: null,
  messages: [],
  isLoading: false,
  error: null,
};

export const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
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
