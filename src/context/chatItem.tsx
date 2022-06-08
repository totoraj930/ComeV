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
  switch (action.type) {
    case "ADD": {
      if (Array.isArray(action.chatItem)) {
        return state.concat(action.chatItem).slice(-action.config.maxChatItemNum);
      } else {
        return [...state, action.chatItem].slice(-action.config.maxChatItemNum);
      }
    }
    case "UPDATE": {
      return state;
    }
    case "CLEAR": {
      return [];
    }
    default: {
      return state;
    }
  }
}