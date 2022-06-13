import { ChatItemAction } from "../context/chatItem";
import { AppConfig } from "../context/config";
import { LiveChatContextAction } from "../context/liveChat";
import { TwitchChat } from "../utils/twitch";
import { uuid } from "../utils/uuid";
import { createAppChatItem, LiveChatBase, LiveChatMetaData } from "./liveChatService";

export interface TwitchMetaData extends LiveChatMetaData {

}

// Twitch用
export interface LiveChatTwitch extends LiveChatBase {
  type: "Twitch";
  api: TwitchChat;
  metaData: TwitchMetaData; // TODO: 実装して
}

export function createLiveChatTwitch(
  id: string, urlStr: string, config: AppConfig
): LiveChatTwitch | null {
  const channelId = parseTwitchUrl(urlStr);
  if (!channelId) return null;
  const api = new TwitchChat({
    token: config.twitch.token,
    clientId: config.twitch.clientId,
    name: "ComeV"
  });
  return {
    id,
    api,
    url: urlStr,
    type: "Twitch",
    isStarted: false,
    metaData: {}
  };
}

export function isTwitchUrl(urlStr: string) {
  const url = new window.URL(urlStr);
  if (url.hostname.match(/^([0-9A-z]+\.|)(twitch\.tv)/)) {
    return true;
  }
  return false;
}

export function parseTwitchUrl(urlStr: string) {
  if (!isTwitchUrl(urlStr)) return null;
  const url = new window.URL(urlStr);
  const parts = url.pathname.split("/");
  return parts[1] || null;
}

export function initTwitchListener(
  liveChat: LiveChatTwitch,
  settings: AppConfig,
  dispatch: React.Dispatch<LiveChatContextAction>,
  dispatchChatItem: React.Dispatch<ChatItemAction>,
  isFirst: boolean
) {
  liveChat.api.removeAllListeners();

  liveChat.api.on("start", (channel) => {
    liveChat.isStarted = true;
    dispatchChatItem({
      config: settings,
      type: "ADD",
      actionId: uuid(),
      chatItem: [createAppChatItem("info", `接続しました(${channel})`)]
    });
    dispatch({
      type: "UPDATE",
      targetId: liveChat.id,
      liveChat: {...liveChat}
    });
  });

  liveChat.api.on("end", () => {
    liveChat.isStarted = false;
    dispatchChatItem({
      config: settings,
      type: "ADD",
      actionId: uuid(),
      chatItem: [createAppChatItem("info", "切断しました")]
    });
    dispatch({
      type: "UPDATE",
      targetId: liveChat.id,
      liveChat: {...liveChat}
    });
  });

  liveChat.api.on("chat", (item) => {
    // console.log(item);
    dispatchChatItem({
      config: settings,
      type: "ADD",
      unique: false,
      useBouyomi: settings.bouyomi.enable,
      actionId: uuid(),
      chatItem: [{
        type: "Twitch",
        id: item.id,
        data: item
      }]
    });
  });

  liveChat.api.on("metadata", (item) => {
    const metaData: TwitchMetaData = {
      title: item.title,
      viewership: item.viewer_count + "",
    };
    liveChat.metaData = {...liveChat.metaData, ...metaData};

    dispatch({
      type: "UPDATE",
      targetId: liveChat.id,
      liveChat: {...liveChat}
    });
  });
}