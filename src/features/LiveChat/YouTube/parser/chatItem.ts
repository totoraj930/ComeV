import { ChatItem } from 'youtube-chat-tauri/dist/types/data';
import { ChatItemBase } from '../..';
import { uuid } from '@/utils/uuid';
import { YTChatAuthor, parseAuthor } from './author';
import { parseMessage, YTMessageItem } from './message';

export interface YTChatColorList {
  headerBackgroundColor?: string;
  headerTextColor?: string;
  bodyBackgroundColor?: string;
  bodyTextColor?: string;
  moneyChipBackgroundColor?: string;
  moneyChipTextColor?: string;
  backgroundColor?: string;
  authorNameTextColor?: string;
}

interface YTChatItemBase extends ChatItemBase {
  source: 'YouTube';
  watchId: string;
  chatId: string;
  author: YTChatAuthor;
  timestamp: number; // UNIX
}

export interface NormalItem extends YTChatItemBase {
  type: 'Normal';
  message: YTMessageItem[];
}

export interface SuperChatItem extends YTChatItemBase {
  type: 'SuperChat';
  message: YTMessageItem[];
  color: string;
  colorList: YTChatColorList;
}

export interface SuperSticker extends YTChatItemBase {
  type: 'SuperSticker';
  color: string;
  colorList: YTChatColorList;
}

export interface MembershipItem extends YTChatItemBase {
  type: 'Membership';
}

export interface MembershipGift extends YTChatItemBase {
  type: 'MembershipGift';
}

export type YTChatItem =
  | NormalItem
  | SuperChatItem
  | SuperSticker
  | MembershipItem
  | MembershipGift;

/**
 * APIのChatItemをパースする
 */
export function parseChatItem(item: ChatItem, watchId: string): YTChatItem {
  const id = uuid();
  const chatId = item.id;
  const timestamp = item.timestamp.getTime();
  const author = parseAuthor(item);
  const message = parseMessage(item);
  if (item.superchat) {
    if (item.superchat.sticker) {
      // ステッカー
      return {
        id,
        chatId,
        author,
        timestamp,
        watchId,
        type: 'SuperSticker',
        source: 'YouTube',
        color: item.superchat.color,
        colorList: item.superchat.colorList,
      };
    } else {
      // 通常スパチャ
      return {
        id,
        chatId,
        watchId,
        author,
        timestamp,
        message,
        type: 'SuperChat',
        source: 'YouTube',
        color: item.superchat.color,
        colorList: item.superchat.colorList,
      };
    }
  } else if (item.membership) {
    // メンバーシップ
    return {
      id,
      chatId,
      watchId,
      author,
      timestamp,
      type: 'Membership',
      source: 'YouTube',
    };
  } else if (item.membershipGift) {
    // メンバーシップギフト
    return {
      id,
      chatId,
      watchId,
      author,
      timestamp,
      type: 'MembershipGift',
      source: 'YouTube',
    };
  } else {
    // 通常チャット
    return {
      id,
      chatId,
      watchId,
      author,
      timestamp,
      message,
      type: 'Normal',
      source: 'YouTube',
    };
  }
}
