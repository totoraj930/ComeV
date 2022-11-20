import { YouTubeLiveId } from 'youtube-chat-tauri/dist/types/data';
import {
  createAppChatItem,
  LiveChatBase,
  LiveChatMetaData,
  YTChatItem,
  ytMessageToString,
} from './liveChatService';
import { LiveChat as YTLiveChat } from 'youtube-chat-tauri';
import { AppConfig, BouyomiConfig } from '../context/config';
import { ChatItemAction } from '../context/chatItem';
import React from 'react';
import { LiveChatContextAction } from '../context/liveChat';
import { uuid } from '../utils/uuid';
import { sendBouyomiText } from '../utils/bouyomi';
import { sendChatApi } from '../utils/sendChatApi';

export interface YouTubeMetaData extends LiveChatMetaData {
  like?: number;
  dateText?: string;
}
// YouTube用
export interface LiveChatYouTube extends LiveChatBase {
  type: 'YouTube';
  api: YTLiveChat;
  metaData: YouTubeMetaData;
}

export function createLiveChatYouTube(
  id: string,
  urlStr: string,
  config: AppConfig
): LiveChatYouTube | null {
  const urlData = parseYouTubeUrl(urlStr);
  if (!urlData) return null;
  const api = new YTLiveChat(urlData, config.intervalMs);
  return {
    id,
    api,
    url: urlStr,
    type: 'YouTube',
    isStarted: false,
    isLoading: false,
    metaData: {},
  };
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
  if (url.pathname === '/watch') {
    // 視聴ページURL
    const v = url.searchParams.get('v');
    if (!v) return null;
    return { liveId: v };
  } else if (url.hostname === 'youtu.be') {
    // 共有用URL
    const v = url.pathname.replace('/', '');
    return { liveId: v };
  } else {
    // チャンネルURL
    const parts = url.pathname.split('/');
    if (parts[1] === 'c' && parts[2]) {
      return { customChannelId: parts[2] };
    } else if (parts[1] === 'channel' && parts[2]) {
      return { channelId: parts[2] };
    }
  }
  return null;
}

export function generateBouyomiText(item: YTChatItem, config: BouyomiConfig) {
  let res = config.youtube.normal;
  if (item.data.superchat) {
    res = config.youtube.superchat.replace(
      /\$\(Amount\)/g,
      item.data.superchat.amount
    );
  } else if (item.data.membership && item.data.message.length === 0) {
    res = config.youtube.membership;
  } else if (item.data.membershipGift) {
    res = config.youtube.membershipGift;
  }
  const message = ytMessageToString(item.data.message, config.includeEmoji);
  res = res
    .replace(/\$\(Message\)/g, message)
    .replace(/\$\(Name\)/g, item.data.author.name);
  return res;
}

export function sendBouyomiYT(item: YTChatItem, config: BouyomiConfig) {
  const text = generateBouyomiText(item, config);
  if (text.length <= 0) return;
  sendBouyomiText(text, config);
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

  liveChat.api.on('chatlist', (data) => {
    // まとめてdispatch
    const items: YTChatItem[] = data.flatMap((item) => {
      const message = item.message
        .map((s) => {
          if ('text' in s) {
            return s.text;
          } else {
            return s.emojiText;
          }
        })
        .join('');

      // 禁止ワードが含まれていないか確認
      const containBlockedWord = settings.blockedWords.find((word) => {
        if (word.length === 0) return false;
        if (word.startsWith('/') && word.endsWith('/')) {
          try {
            const re = new RegExp(word.replace(/^\/|\/$/g, ''));
            return message.match(re);
          } catch {}
        }
        return message.includes(word);
      });

      // 禁止ワードが含まれていたらログを出力
      if (containBlockedWord) {
        dispatchChatItem({
          config: settings,
          type: 'ADD',
          actionId: uuid(),
          chatItem: [
            createAppChatItem(
              'log',
              `禁止ワード: ${item.author.name}「${message}」`,
              new Date()
            ),
          ],
        });
        return [];
      }

      const res: YTChatItem = {
        type: 'YouTube',
        id: uuid(),
        data: item,
      };
      if (!_isFirst) sendChatApi('youtube', res);
      return [res];
    });
    if (!_isFirst) sendChatApi('youtube-list', items);

    // 読み上げ
    if (settings.bouyomi.enable && !_isFirst) {
      for (const item of items) {
        sendBouyomiYT(item, settings.bouyomi);
      }
    }

    dispatchChatItem({
      config: settings,
      type: 'ADD',
      unique: true,
      actionId: uuid(),
      chatItem: items,
    });

    _isFirst = false;
  });
  liveChat.api.on('metadata', (item) => {
    const metaData: YouTubeMetaData = {};
    if (item.title) metaData.title = item.title;
    if (item.description) metaData.description = item.description;
    if (item.viewership) metaData.viewership = item.viewership + '';
    if (item.like) metaData.like = item.like;
    if (item.dateText) metaData.dateText = item.dateText;
    liveChat.metaData = { ...liveChat.metaData, ...metaData };

    dispatch({
      type: 'UPDATE',
      targetId: liveChat.id,
      liveChat: liveChat,
    });
  });
  liveChat.api.on('error', (data) => {
    console.error(data);
    dispatchChatItem({
      config: settings,
      type: 'ADD',
      actionId: uuid(),
      chatItem: [createAppChatItem('error', (data as string) + '')],
    });
  });
  liveChat.api.on('start', (liveId) => {
    liveChat.isStarted = true;
    liveChat.isLoading = false;
    dispatchChatItem({
      config: settings,
      type: 'ADD',
      actionId: uuid(),
      chatItem: [createAppChatItem('info', `接続しました(${liveId})`)],
    });
    dispatch({
      type: 'UPDATE',
      targetId: liveChat.id,
      liveChat: liveChat,
    });
    _isFirst = true;
  });
  liveChat.api.on('end', () => {
    liveChat.isStarted = false;
    liveChat.isLoading = false;
    dispatchChatItem({
      config: settings,
      type: 'ADD',
      actionId: uuid(),
      chatItem: [createAppChatItem('info', '切断しました')],
    });
    dispatch({
      type: 'UPDATE',
      targetId: liveChat.id,
      liveChat: liveChat,
    });
    _isFirst = true;
  });
}
