import { useContext, useEffect } from 'react';
import { uuid } from '@/utils/uuid';
import { useSettings } from '@/hooks/useSettings';
import { LiveChatContext } from './LiveChatContext';
import { LiveChat } from '.';

export type LiveChatAction =
  | DeleteAction
  | StartChatAction
  | StopChatAction
  | ChangeUrlAction
  | ClearChatAction;

interface BaseAction {
  type: string;
}
export interface ChangeUrlAction extends BaseAction {
  type: 'CHANGE_URL';
  url: string;
  targetId: string;
}
export interface StartChatAction extends BaseAction {
  type: 'START_CHAT';
  targetId: string;
}
export interface StopChatAction extends BaseAction {
  type: 'STOP_CHAT';
  targetId: string;
}
export interface ClearChatAction extends BaseAction {
  type: 'CLEAR';
}
export interface DeleteAction extends BaseAction {
  type: 'DELETE';
  targetId: string;
}

export function useLiveChat(id: string) {
  const { state: liveChatMap, dispatch } = useContext(LiveChatContext);
  const liveChat = liveChatMap[id].liveChat;
  const { settings, settingsUpdater } = useSettings();

  /** LiveChatの操作 */
  const liveChatUpdater = async (action: LiveChatAction) => {
    if (!liveChatMap) return;
    if (action.type === 'CLEAR') {
      return;
    }
    if (!liveChat) return;

    // YouTube ------------------------------------------------------
    if (liveChat.source === 'YouTube') {
      switch (action.type) {
        case 'CHANGE_URL': {
          break;
        }
        case 'STOP_CHAT': {
          break;
        }
        case 'DELETE': {
          break;
        }
      }
    }
    // Twitch ------------------------------------------------------
    else if (liveChat.source === 'Twitch') {
      switch (action.type) {
        case 'CHANGE_URL': {
          break;
        }
        case 'STOP_CHAT': {
          break;
        }
        case 'DELETE': {
          break;
        }
      }
    }

    // 両方 ------------------------------------------------------
    switch (action.type) {
      case 'DELETE': {
        return;
      }
      case 'CHANGE_URL': {
        break;
      }
      case 'START_CHAT': {
        break;
      }
    }
  };

  return {
    liveChatMap,
    liveChatUpdater,
  };
}
