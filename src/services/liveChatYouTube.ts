import { MetadataItem, YouTubeLiveId } from "youtube-chat-tauri/dist/types/data";
import { ChatItem, createAppChatItem, LiveChatBase, LiveChatMetaData } from "./liveChatService";
import { LiveChat as YTLiveChat } from "youtube-chat-tauri";
import { AppConfig } from "../context/config";
import { ChatItemAction } from "../context/chatItem";
import React from "react";
import { LiveChatContextAction } from "../context/liveChat";
import { uuid } from "../utils/uuid";

export interface YouTubeMetaData extends LiveChatMetaData {
  like?: number;
  dateText?: string;
}
// YouTube用
export interface LiveChatYouTube extends LiveChatBase {
  type: "YouTube";
  api: YTLiveChat;
  metaData: YouTubeMetaData;
}

export function createLiveChatYouTube(
  id: string, urlStr: string, config: AppConfig
): LiveChatYouTube | null {
  const urlData = parseYouTubeUrl(urlStr);
  if (!urlData) return null;
  const api = new YTLiveChat(urlData, config.intervalMs);
  return {
    id,
    api,
    url: urlStr,
    type: "YouTube",
    isStarted: false,
    metaData: {}
  }
}

export function isYouTubeUrl(urlStr: string) {
  const url = new window.URL(urlStr);
  if (url.hostname.match(/^([0-9A-z]+\.|)(youtube\.com|youtu\.be)/)) {
    return true;
  }
  return false;
}

export function parseYouTubeUrl(urlStr: string): YouTubeLiveId | null {
  if (!isYouTubeUrl(urlStr)) return null;
  const url = new window.URL(urlStr);
  if (url.pathname === "/watch") {
    // 視聴ページURL
    const v = url.searchParams.get("v");
    if (!v) return null;
    return { liveId: v }
  }
  else if (url.hostname === "youtu.be") {
    // 共有用URL
    const v = url.pathname.replace("/", "");
    return { liveId: v }
  }
  else {
    // チャンネルURL
    const parts = url.pathname.split("/");
    if (parts[1] === "c" && parts[2]) {
      return { customChannelId: parts[2] }
    }
    else if (parts[1] === "channel" && parts[2]) {
      return { channelId: parts[2] }
    }
  }
  return null;
}

export function initYouTubeListener(
  liveChat: LiveChatYouTube,
  settings: AppConfig,
  dispatch: React.Dispatch<LiveChatContextAction>,
  dispatchChatItem: React.Dispatch<ChatItemAction>,
  isFirst: boolean
) {
  liveChat.api.removeAllListeners();
  let _isFirst = isFirst;

  liveChat.api.on("chatlist", (data) => {
    // まとめてdispatch
    const items: ChatItem[] = data.map((item) => {
      return {
        type: "YouTube",
        id: uuid(),
        data: item
      }
    });

    dispatchChatItem({
      config: settings,
      type: "ADD",
      unique: _isFirst,
      useBouyomi: settings.bouyomi.enable && !_isFirst,
      actionId: uuid(),
      chatItem: items
    });

    _isFirst = false;
  });
  liveChat.api.on("metadata", (item) => {
    
    const metaData: YouTubeMetaData = {};
    if (item.title) metaData.title = item.title;
    if (item.description) metaData.description = item.description;
    if (item.viewership) metaData.viewership = item.viewership + "";
    if (item.like) metaData.like = item.like;
    if (item.dateText) metaData.dateText = item.dateText;
    liveChat.metaData = {...liveChat.metaData, ...metaData};

    dispatch({
      type: "UPDATE",
      targetId: liveChat.id,
      liveChat: {...liveChat}
    });
  });
  liveChat.api.on("error", (data) => {
    console.error(data);
    dispatchChatItem({
      config: settings,
      type: "ADD",
      actionId: uuid(),
      chatItem: [createAppChatItem("error", data as string + "")]
    });
  });
  liveChat.api.on("start", (liveId) => {
    liveChat.isStarted = true;
    dispatchChatItem({
      config: settings,
      type: "ADD",
      actionId: uuid(),
      chatItem: [createAppChatItem("info", `接続しました(${liveId})`)]
    });
    dispatch({
      type: "UPDATE",
      targetId: liveChat.id,
      liveChat: {...liveChat}
    });
    _isFirst = true;
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
    _isFirst = true;
  });
}