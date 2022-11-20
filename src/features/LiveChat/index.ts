import { uuid } from '@/utils/uuid';
import { EventEmitter } from 'events';
import TypedEmitter from 'typed-emitter';
import { TwitchChat } from './Twitch/TwitchChat';
import { YouTubeChat } from './YouTube/YouTubeChat';

/**
 * ベースとなるChatItem
 */
export interface ChatItemBase {
  id: string;
  // 配信のソース(YouTube, Twitch, App)
  source: string;
  // チャットのタイプ
  type: string;
}

/**
 * チャットクラスのイベントのベース
 */
export interface LiveChatBaseEvents {
  start: (...args: any) => void;
  stop: (...args: any) => void;
  chat: (chatItem: ChatItemBase, ...args: any) => void;
  chatlist: (chatItemList: ChatItemBase[], ...args: any) => void;
  error: (err: Error | unknown, ...args: any) => void;
}

/**
 * チャットの接続管理のベースとなるクラス
 */
export class LiveChatBase<T> extends (EventEmitter as {
  new <T>(): TypedEmitter<T>;
})<T> {
  readonly source: string = 'Base';
  readonly id: string = uuid();
  status: 'START' | 'STOP' = 'STOP';

  start() {}

  stop() {}
}

/**
 * まとめるやつ
 */
export type LiveChat = YouTubeChat | TwitchChat;
