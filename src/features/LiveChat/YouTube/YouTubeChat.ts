import { LiveChatBase, LiveChatBaseEvents } from '..';
import { LiveChat as YTLiveChatApi } from 'youtube-chat-tauri';
import { parseUrl } from './parser/url';
import { parseChatItem } from './parser/chatItem';

export interface YouTubeMetaData {
  title: string;
  description: string;
  viewership: string;
  like: number;
  dateText: string;
}

export interface YouTubeChatEvents extends LiveChatBaseEvents {
  start: (liveId: string) => void;
  metaData: (data: YouTubeMetaData) => void;
}

export interface YouTubeChatOptions {
  url: string;
  interval?: number;
  metaInterval?: number;
  language?: 'ja' | 'en';
  location?: 'JP' | 'US';
}

export class YouTubeChat extends LiveChatBase<YouTubeChatEvents> {
  source = 'YouTube';

  #api?: YTLiveChatApi;
  watchId?: string;

  constructor(options: YouTubeChatOptions) {
    super();

    const liveId = parseUrl(options.url);

    if (!liveId) return;

    // クライアントを作成
    this.#api = new YTLiveChatApi(
      liveId,
      options.interval ?? 1000 * 3,
      options.metaInterval ?? 1000 * 10,
      options.language || 'ja',
      options.location || 'JP'
    );

    this.#api.on('chatlist', (data) => {
      this.emit(
        'chatlist',
        data.map((item) => parseChatItem(item, this.watchId || ''))
      );
    });

    this.#api.on('start', (liveId) => {
      this.status = 'START';
    });

    this.#api.on('end', (reason) => {
      this.status = 'STOP';
    });
  }

  async start() {
    super.start();
    if (!this.#api) return false;
    const res = await this.#api.start();

    this.watchId = this.#api.liveId;

    return res;
  }

  stop() {
    super.stop();
    if (!this.#api) return false;
    this.#api.stop();
    return true;
  }
}
