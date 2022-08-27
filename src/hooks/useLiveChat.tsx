import { useContext, useEffect } from 'react';
import { LiveChatContext } from '../context/liveChat';
import { createAppChatItem, LiveChat } from '../services/liveChatService';
import { uuid } from '../utils/uuid';
import { ChatItemContext } from '../context/chatItem';
import { useSettings } from './useSettings';
import {
  createLiveChatYouTube,
  initYouTubeListener,
  isYouTubeUrl,
} from '../services/liveChatYouTube';
import {
  createLiveChatTwitch,
  initTwitchListener,
  isTwitchUrl,
  parseTwitchUrl,
} from '../services/liveChatTwitch';

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

export function useLiveChat() {
  const { state: liveChatMap, dispatch } = useContext(LiveChatContext);
  const { dispatch: dispatchChatItem } = useContext(ChatItemContext);
  const { settings, settingsUpdater } = useSettings();

  // イベントリスナー更新
  useEffect(() => {
    const liveChatList = Object.keys(liveChatMap).map((id) => liveChatMap[id]);
    for (const liveChat of liveChatList) {
      if (liveChat.type === 'YouTube') {
        initYouTubeListener(
          liveChat,
          settings,
          dispatch,
          dispatchChatItem,
          false
        );
      } else if (liveChat.type === 'Twitch') {
        initTwitchListener(
          liveChat,
          settings,
          dispatch,
          dispatchChatItem,
          false
        );
      }
    }
  }, [settings]);

  const update = (liveChat: LiveChat) => {
    dispatch({
      type: 'UPDATE',
      targetId: liveChat.id,
      liveChat: liveChat,
    });
  };

  /** LiveChatの操作 */
  const liveChatUpdater = async (action: LiveChatAction) => {
    if (!liveChatMap) return;
    if (action.type === 'CLEAR') {
      dispatchChatItem({
        config: settings,
        type: 'CLEAR',
        actionId: uuid(),
      });
      return;
    }
    let liveChat = { ...liveChatMap[action.targetId] };
    if (!liveChat) return;

    // YouTube ------------------------------------------------------
    if (liveChat.type === 'YouTube') {
      switch (action.type) {
        case 'CHANGE_URL': {
          if (liveChat.isStarted) {
            liveChat.api.stop();
          }
          liveChat.api.removeAllListeners();
          break;
        }
        case 'STOP_CHAT': {
          liveChat.api.stop();
          liveChat.isStarted = false;
          break;
        }
        case 'DELETE': {
          if (liveChat.isStarted) {
            liveChat.api.stop();
          }
          break;
        }
      }
    }
    // Twitch ------------------------------------------------------
    else if (liveChat.type === 'Twitch') {
      switch (action.type) {
        case 'CHANGE_URL': {
          if (liveChat.isStarted) {
            liveChat.api.stop();
          }
          liveChat.api.removeAllListeners();
          break;
        }
        case 'STOP_CHAT': {
          await liveChat.api.stop();
          liveChat.isStarted = false;
          break;
        }
        case 'DELETE': {
          if (liveChat.isStarted) {
            liveChat.api.stop();
          }
          break;
        }
      }
    }

    // 両方 ------------------------------------------------------
    switch (action.type) {
      case 'DELETE': {
        dispatch({
          type: 'DELETE',
          targetId: action.targetId,
        });

        const prevUrl: string[] = [];
        for (const id in liveChatMap) {
          if (id === action.targetId) continue;
          prevUrl.push(liveChatMap[id].url);
        }

        settingsUpdater({
          type: 'CHANGE_SAVE',
          data: { ...settings, prevUrl },
        });
        return;
      }
      case 'CHANGE_URL': {
        liveChat.isStarted = false;
        liveChat.url = action.url;

        const prevUrl: string[] = [];
        for (const id in liveChatMap) {
          if (id === action.targetId) {
            prevUrl.push(action.url);
            continue;
          }
          prevUrl.push(liveChatMap[id].url);
        }

        settingsUpdater({
          type: 'CHANGE_SAVE',
          data: { ...settings, prevUrl },
        });

        break;
      }
      case 'START_CHAT': {
        try {
          new window.URL(liveChat.url);
        } catch {
          dispatchChatItem({
            type: 'ADD',
            actionId: uuid(),
            config: settings,
            chatItem: [createAppChatItem('error', '対応していないURLです。')],
          });
          return;
        }
        // API接続時にURLを判定
        if (isYouTubeUrl(liveChat.url)) {
          // YouTubeに接続する処理 --------------------------------------
          const liveChatYouTube = createLiveChatYouTube(
            liveChat.id,
            liveChat.url,
            settings
          );

          if (!liveChatYouTube) {
            dispatchChatItem({
              type: 'ADD',
              actionId: uuid(),
              config: settings,
              chatItem: [
                createAppChatItem('error', '対応していないYouTubeのURLです。'),
              ],
            });
            return;
          }
          liveChat = liveChatYouTube;
          initYouTubeListener(
            liveChat,
            settings,
            dispatch,
            dispatchChatItem,
            true
          );
          liveChat.isLoading = true;
          update(liveChat);
          await liveChat.api.start();
          liveChat.isLoading = false;
          update(liveChat);
        } else if (isTwitchUrl(liveChat.url)) {
          // Twitchに接続する処理 --------------------------------------
          const liveChatTwitch = createLiveChatTwitch(
            liveChat.id,
            liveChat.url,
            settings
          );

          if (!liveChatTwitch) {
            dispatchChatItem({
              type: 'ADD',
              actionId: uuid(),
              config: settings,
              chatItem: [
                createAppChatItem('error', '対応していないTwitchのURLです。'),
              ],
            });
            return;
          }
          liveChat = liveChatTwitch;
          liveChat.isLoading = true;
          update(liveChat);
          initTwitchListener(
            liveChat,
            settings,
            dispatch,
            dispatchChatItem,
            true
          );
          try {
            // ログイン処理
            const token = await liveChat.api.login();
            settingsUpdater({ type: 'UPDATE_TWITCH_TOKEN', token });
          } catch (err) {
            console.error(err);
            dispatchChatItem({
              type: 'ADD',
              actionId: uuid(),
              config: settings,
              chatItem: [
                createAppChatItem(
                  'error',
                  err === 'cancel'
                    ? 'Twitchとの連携がキャンセルされました。'
                    : 'Twitchとの連携に失敗しました。'
                ),
              ],
            });
            liveChat.isLoading = false;
            update(liveChat);
            return;
          }

          try {
            // 接続
            const channelId = parseTwitchUrl(liveChat.url);
            await liveChat.api.start(channelId || '');
            liveChat.isLoading = false;
            update(liveChat);
          } catch (err) {
            console.error(err);
            dispatchChatItem({
              type: 'ADD',
              actionId: uuid(),
              config: settings,
              chatItem: [
                createAppChatItem(
                  'error',
                  'Twitchへの接続に失敗しました。チャンネルが存在しません。'
                ),
              ],
            });
            await liveChat.api.stop();
            liveChat.isLoading = false;
            update(liveChat);
            return;
          }
        } else {
          dispatchChatItem({
            type: 'ADD',
            actionId: uuid(),
            config: settings,
            chatItem: [createAppChatItem('error', '対応していないURLです。')],
          });
          return;
        }
        break;
      }
    }
    update(liveChat);
  };

  return {
    liveChatMap,
    liveChatUpdater,
  };
}
