import { createContext,  useReducer } from "react";
import { LiveChat, liveChatService } from "../services/liveChatService";
import { ChatItemContext, chatItemReducer } from "./chatItem";

export const LiveChatContext = createContext<LiveChatContextProps>({
  state: liveChatService.createLiveChat(""),
  dispatch: () => {}
});

const initialState = liveChatService.createLiveChat("");

interface LiveChatContextProps {
  state: LiveChat;
  dispatch: (liveChat: LiveChat) => void;
}

function liveChatReducer(state: LiveChat, action: LiveChat) {
  return action;
}

export const LiveChatProvider: React.FC<{}> = ({ children }) => {
  const [state, dispatch] = useReducer(liveChatReducer, initialState);
  const [chatItems, chatItemDispatch] = useReducer(chatItemReducer, []);
  return(
    <LiveChatContext.Provider value={{ state: state, dispatch: dispatch }}>
      <ChatItemContext.Provider value = {{ state: chatItems, dispatch: chatItemDispatch}}>
        { children }
      </ChatItemContext.Provider>
    </LiveChatContext.Provider>
  );
}

