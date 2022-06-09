import { createContext, Dispatch } from "react";
import { ChatItem } from "../services/liveChatService";
import { sendBouyomi } from "../utils/bouyomi";
import { sendChatApi } from "../utils/sendChatApi";
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
  unique?: boolean;
  useBouyomi?: boolean;
  chatItem: ChatItem[];
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
      if (action.unique) {
        const uniqueItemList = action.chatItem
          .filter((item) => {
            return !state.find((targetItem) => {
              return targetItem.type === "YouTube"
                && item.type === "YouTube"
                && targetItem.data.id === item.data.id
            });
          });
        
        for (const item of uniqueItemList) {
          sendChatApi("youtube", item);
          if (action.useBouyomi) {
            sendBouyomi(item, action.config.bouyomi);
          }
        }
        sendChatApi("youtube-list", uniqueItemList);
        return state.concat(uniqueItemList).slice(-action.config.maxChatItemNum);
      } else {
        for (const item of action.chatItem) {
          sendChatApi("youtube", item);
          if (action.useBouyomi) {
            sendBouyomi(item, action.config.bouyomi);
          }
        }
        sendChatApi("youtube-list", action.chatItem);
        return state.concat(action.chatItem).slice(-action.config.maxChatItemNum);
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