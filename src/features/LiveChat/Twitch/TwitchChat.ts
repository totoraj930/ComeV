import { LiveChatBase, LiveChatBaseEvents } from '..';
import { TwitchChat as TwitchChatApi } from '@/utils/twitch';
import { parseTwitchUrl } from './parser/url';
import { parseChatItem } from './parser/chatItem';

export interface TwitchChatEvents extends LiveChatBaseEvents {
  token: (token: string) => void;
}

export interface TwitchChatOptions {
  url: string;
  token?: string;
  clientId: string;
}

export class TwitchChat extends LiveChatBase<TwitchChatEvents> {
  source = 'Twitch';

  #api?: TwitchChatApi;
  #channel: string | null;

  constructor(options: TwitchChatOptions) {
    super();

    this.#api = new TwitchChatApi({
      token: options.token || '',
      clientId: options.clientId,
      name: 'ComeV',
    });

    this.#channel = parseTwitchUrl(options.url);

    this.#api.on('token', (token) => this.emit('token', token));

    this.#api.on('chat', (item) => {
      const parsedItem = parseChatItem(item, this.#channel || '');
      this.emit('chat', parsedItem);
      this.emit('chatlist', [parsedItem]);
    });

    this.#api.on('start', (channel) => {
      this.status = 'START';
    });

    this.#api.on('end', () => {
      this.status = 'STOP';
    });
  }

  async start() {
    super.start();
    if (!this.#api || !this.#channel) return false;

    // 一応ストップ
    await this.#api.stop();

    try {
      // ログイン処理
      await this.#api.login();
    } catch {
      // ログイン出来なかったら終了
      return false;
    }

    // 開始
    this.#api.start(this.#channel);
  }

  async stop() {
    super.stop();
    if (!this.#api) return false;
    await this.#api.stop();
    return true;
  }
}
