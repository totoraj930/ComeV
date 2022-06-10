import { ChatItemAction } from "../context/chatItem";
import { AppConfig } from "../context/config";
import { LiveChatContextAction } from "../context/liveChat";
import { TwitchChat } from "../utils/twitch";
import { LiveChatBase } from "./liveChatService";


// Twitch用
export interface LiveChatTwitch extends LiveChatBase {
  type: "Twitch";
  api: TwitchChat;
  metaData?: unknown; // TODO: 実装して
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

  liveChat.api.on("chat", (item) => {

  });
}