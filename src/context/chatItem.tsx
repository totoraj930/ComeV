import { createContext, Dispatch } from "react";
import { ChatItem } from "../services/liveChatService";
import { AppConfig} from "./config";

export type ChatItemAction =
| AddChatItemAction
| UpdateChatItemAction
| ClearChatItemAction;

interface ChatItemActionBase {
  type: string;
  actionId: string;
  config: AppConfig;
}

interface AddChatItemAction extends ChatItemActionBase {
  type: "ADD";
  chatItem: ChatItem | ChatItem[];
}
interface UpdateChatItemAction extends ChatItemActionBase {
  type: "UPDATE";
  chatItem: ChatItem[];
}
interface ClearChatItemAction extends ChatItemActionBase {
  type: "CLEAR";
}

export const ChatItemContext = createContext<{
  state: ChatItem[],
  dispatch: Dispatch<ChatItemAction>
}>({
  state: [],
  dispatch: () => {}
});

export function chatItemReducer(state: ChatItem[], action: ChatItemAction): ChatItem[] {
  let res = state.slice();
  switch (action.type) {
    case "ADD": {
      if (Array.isArray(action.chatItem)) {
        res = res.concat(action.chatItem);
      } else {
        res.push(action.chatItem);
      }
      
      if (res.length === action.config.maxChatItemNum + 1) {
        res.shift();
      } else if (res.length > action.config.maxChatItemNum){
        res = res.slice(-action.config.maxChatItemNum);
      }
      break;
    }
    case "UPDATE": {
      res = state;
      break;
    }
    case "CLEAR": {
      res = [];
      break;
    }
    default: {
      res = state;
      break;
    }
  }
  return res;
}