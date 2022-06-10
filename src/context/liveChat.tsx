import { createContext,  useReducer } from "react";
import { LiveChat } from "../services/liveChatService";
import { ChatItemContext, chatItemReducer } from "./chatItem";

export const LiveChatContext = createContext<LiveChatContextProps>({
  state: {},
  dispatch: (action: LiveChatContextAction) => {}
});

const initialState = {};

type LiveChatContextState = {[key: string]: LiveChat}
interface LiveChatContextProps {
  state: LiveChatContextState;
  dispatch: (action: LiveChatContextAction) => void;
}

export type LiveChatContextAction =
  | UpdateAction
  | DeleteAction;

interface BaseAction {
  type: string;
}

interface UpdateAction extends BaseAction {
  type: "UPDATE";
  targetId: string;
  liveChat: LiveChat;
}
interface DeleteAction extends BaseAction {
  type: "DELETE";
  targetId: string;
}

function liveChatReducer(state: LiveChatContextState, action: LiveChatContextAction) {
  switch (action.type) {
    case "UPDATE": {
      if (action.targetId in state) {
        state[action.targetId] = action.liveChat;
      }
      break;
    }
    case "DELETE": {
      if (action.targetId in state) {
        const target = state[action.targetId];
        delete state[action.targetId];
        if (target.type === "YouTube") {
          target.api.stop();
        } else if (target.type === "Twitch") {
          target.api.stop();
        }
      }
    }
  }
  return {...state};
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

