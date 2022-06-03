
import React, { useCallback, useContext, useEffect } from "react";
import { LiveChatContext } from "../context/liveChat";
import { ChatItem, LiveChat, liveChatService } from "../services/liveChatService";
import { LiveChat as YTLiveChat } from "youtube-chat-tauri";
import { uuid } from "../utils/uuid"
import { ChatItemAction, ChatItemContext } from "../context/chatItem";
import { invoke } from "@tauri-apps/api";
import { saveConfig, useSettings } from "./useSettings";
import { sendBouyomi } from "../utils/bouyomi";
import { AppConfig } from "../context/config";

export type LiveChatAction = 
  | StartYTChatAction
  | StopYTChatAction
  | ChangeUrlAction
  | ClearYTChatAction;

export interface ChangeUrlAction {
  type: "CHANGE_URL";
  url: string;
}
export interface StartYTChatAction {
  type: "START_YT_CHAT";
}
export interface StopYTChatAction {
  type: "STOP_YT_CHAT";
}
export interface ClearYTChatAction {
  type: "CLEAR";
}

function initListener(
  liveChat: LiveChat,
  settings: AppConfig,
  dispatch: (liveChat: LiveChat) => void,
  dispatchChatItem: React.Dispatch<ChatItemAction>,
  isFirst: boolean
) {
  liveChat.ytLiveChat.removeAllListeners();
  let _isFirst = isFirst;

  liveChat.ytLiveChat.on("chatlist", (data) => {
    // まとめてdispatch
    const items: ChatItem[] = data.map((item) => {
      return {
        type: "YouTube",
        id: uuid(),
        data: item
      }
    });

    for (const item of items) {
      invoke("send_chat", {data: JSON.stringify(item) });
      if (settings.bouyomi.enable && !_isFirst) {
        sendBouyomi(item, settings.bouyomi);
      }
    }

    invoke("send_chat", { data: JSON.stringify({ type: "YouTube-List", data: items }) });
    dispatchChatItem({
      config: settings,
      type: "ADD",
      actionId: uuid(),
      chatItem: items
    });

    _isFirst = false;
  });
  liveChat.ytLiveChat.on("metadata", (item) => {
    liveChat.metaData = {...liveChat.metaData, ...item};
    dispatch({...liveChat});
  });
  liveChat.ytLiveChat.on("error", (data) => {
    console.error(data);
    dispatchChatItem({
      config: settings,
      type: "ADD",
      actionId: uuid(),
      chatItem: {
        type: "App",
        id: uuid(),
        data: {
          type: "error",
          message: data as string + "",
          timestamp: new Date(),
        }
      }
    });
  });
  liveChat.ytLiveChat.on("start", (liveId) => {
    liveChat.isStarted = true;
    dispatchChatItem({
      config: settings,
      type: "ADD",
      actionId: uuid(),
      chatItem: {
        type: "App",
        id: uuid(),
        data: {
          type: "info",
          message: `接続しました(${liveId})`,
          timestamp: new Date(),
        }
      }
    });
    dispatch({...liveChat});
  });
  liveChat.ytLiveChat.on("end", () => {
    liveChat.isStarted = false;
    dispatchChatItem({
      config: settings,
      type: "ADD",
      actionId: uuid(),
      chatItem: {
        type: "App",
        id: uuid(),
        data: {
          type: "info",
          message: "切断しました",
          timestamp: new Date(),
        }
      }
    });
    dispatch({...liveChat});
  });
}




export function useLiveChat() {
  const { state: liveChat, dispatch } = useContext(LiveChatContext);
  const { state: chatItems, dispatch: dispatchChatItem } = useContext(ChatItemContext);
  const { settings, settingsUpdater } = useSettings();

  useEffect(() => {
    initListener(liveChat, settings, dispatch, dispatchChatItem, !liveChat.isStarted);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const liveChatUpdater = (action: LiveChatAction) => {
    if (!liveChat) return;
    switch (action.type) {
      case "CLEAR": {
        dispatchChatItem({
          config: settings,
          type: "CLEAR",
          actionId: uuid(),
        })
        break;
      }
      case "START_YT_CHAT": {
        liveChat.ytLiveChat.start();
        break;
      }
      case "STOP_YT_CHAT": {
        liveChat.ytLiveChat.stop();
        liveChat.isStarted = false;
        break;
      }
      case "CHANGE_URL": {
        if (liveChat.ytLiveChat.liveId && liveChat.isStarted) {
          liveChat.ytLiveChat.stop();
          liveChat.ytLiveChat.removeAllListeners();
        }
        liveChat.isStarted = false;
        const liveIdOrChId = liveChatService.parseYTLiveId(action.url);
        liveChat.ytLiveChat = new YTLiveChat(liveIdOrChId, settings.intervalMs, 5000);

        initListener(liveChat, settings, dispatch, dispatchChatItem, true);

        settingsUpdater({
          type: "CHANGE_SAVE",
          data: {...settings, prevUrl: action.url}
        });

        liveChat.metaData.title = "";
        liveChat.metaData.viewership = undefined;
        
        break;
      }
    }
    dispatch({...liveChat});
  };

  return {
    liveChat,
    chatItems,
    liveChatUpdater
  };
}