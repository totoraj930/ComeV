import { createContext, Dispatch, ReactElement } from 'react';
import { ChatItem } from '../services/liveChatService';
import { AppConfig } from './config';
import { ChatItemView } from '../components/ChatItem';

export type ChatItemAction =
  | AddChatItemAction
  | UpdateChatItemAction
  | ClearChatItemAction;

interface ChatItemActionBase {
  type: string;
  actionId: string;
  config: AppConfig;
}

export type ChatItemContextState = {
  items: ChatItem[];
  views: ReactElement<any, any>[];
};

interface AddChatItemAction extends ChatItemActionBase {
  type: 'ADD';
  unique?: boolean;
  useBouyomi?: boolean;
  chatItem: ChatItem[];
}
interface UpdateChatItemAction extends ChatItemActionBase {
  type: 'UPDATE';
  chatItem: ChatItem[];
}
interface ClearChatItemAction extends ChatItemActionBase {
  type: 'CLEAR';
}

export const ChatItemContext = createContext<{
  state: ChatItemContextState;
  dispatch: Dispatch<ChatItemAction>;
}>({
  state: { items: [], views: [] },
  dispatch: () => {},
});

export function chatItemReducer(
  state: ChatItemContextState,
  action: ChatItemAction
): ChatItemContextState {
  const stateItems = state.items;
  let resItems: ChatItem[] = [];
  let resViews: ReactElement<any, any>[] = state.views;
  switch (action.type) {
    case 'ADD': {
      if (action.unique) {
        const uniqueItemList = action.chatItem.filter((item) => {
          return !stateItems.find((targetItem) => {
            return (
              targetItem.type === 'YouTube' &&
              item.type === 'YouTube' &&
              targetItem.data.id === item.data.id
            );
          });
        });

        for (const item of uniqueItemList) {
          resViews.push(<ChatItemView chatItem={item} key={item.id} />);
        }
        resItems = stateItems
          .concat(uniqueItemList)
          .slice(-action.config.maxChatItemNum);
        resViews = resViews.slice(-action.config.maxChatItemNum);
        break;
      } else {
        for (const item of action.chatItem) {
          resViews.push(<ChatItemView chatItem={item} key={item.id} />);
        }
        resItems = stateItems
          .concat(action.chatItem)
          .slice(-action.config.maxChatItemNum);
        resViews = resViews.slice(-action.config.maxChatItemNum);
        break;
      }
    }
    case 'UPDATE': {
      resItems = stateItems;
      break;
    }
    case 'CLEAR': {
      resItems = [];
      resViews = [];
      break;
    }
    default: {
      resItems = stateItems;
      break;
    }
  }
  return {
    items: resItems,
    views: resViews,
  };
}
