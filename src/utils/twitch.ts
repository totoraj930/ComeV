import EventEmitter from 'events';
import {
  ChatUserstate,
  Client as TmiClient,
  CommonUserstate,
  SubMethods,
} from 'tmi.js';
import TypedEmitter from 'typed-emitter';
import { invoke as invokeOrigin } from '@tauri-apps/api';
import { once as tauriOnce } from '@tauri-apps/api/event';
import { uuid } from './uuid';

export interface TwitchChatOptions {
  token: string;
  clientId: string;
  name: string;
}

// https://api.twitch.tv/helix/streams?user_id={id}
// https://dev.twitch.tv/docs/api/reference#get-streams
interface TwitchStreamResponse {
  game_id: string;
  game_name: string;
  id: string; // stream id
  is_mature: boolean; // false
  language: string; // "ja"
  started_at: string; // "2022-06-10T16:46:41Z"
  tag_ids: string[];
  thumbnail_url: string; // "https://static-cdn.jtvnw.net/previews-ttv/live_user_hogehoge-{width}x{height}.jpg"
  title: string;
  type: 'live' | '';
  user_id: string;
  user_login: string;
  user_name: string;
  viewer_count: number;
}
interface TwitchGetStreamsResponse {
  data: TwitchStreamResponse[];
}

type EmoteUrlSize = 'url_1x' | 'url_2x' | 'url_4x';
type EmoteType =
  | 'bitstier'
  | 'follower'
  | 'subscriptions'
  | 'smilies'
  | 'prime'
  | 'twofactor';
type EmoteFormat = 'animated' | 'static';
type EmoteScale = '1.0' | '2.0' | '3.0';
type EmoteThemeMode = 'light' | 'dark';
interface TwitchRawEmote {
  id: string;
  name: string;
  images: { [key in EmoteUrlSize]: string };
  emote_type?: EmoteType;
  emote_set_id?: string;
  owner_id?: string;
  format: EmoteFormat[];
  scale: EmoteScale[];
  theme_mode: EmoteThemeMode[];
}
interface TwitchGetEmoteResponse {
  data: TwitchRawEmote[];
  template: string;
}

/** Twitchのエモート
 * https://dev.twitch.tv/docs/api/reference#get-emote-sets */
export interface TwitchEmote {
  id: string;
  name: string;
  url: string;
  animated_url?: string;
  emote_type?: EmoteType;
  emote_set_id?: string;
  owner_id?: string;
}

type TwitchRawCheermoteImage = {
  animated: {
    '1': string;
    '1.5': string;
    '2': string;
    '3': string;
    '4': string;
  };
  static: {
    '1': string;
    '1.5': string;
    '2': string;
    '3': string;
    '4': string;
  };
};

interface TwitchRawCheermote {
  min_bits: number;
  id: string;
  color: string;
  images: {
    dark: TwitchRawCheermoteImage;
    light: TwitchRawCheermoteImage;
  };
  can_cheer: boolean;
  show_in_bits_card: boolean;
}

// https://dev.twitch.tv/docs/api/reference#get-cheermotes
interface TwitchGetCheermotesResponse {
  data: {
    prefix: string;
    tiers: TwitchRawCheermote[];
    type:
      | 'global_first_party'
      | 'global_third_party'
      | 'channel_custom'
      | 'display_only'
      | 'sponsored';
    order: number;
    last_updated: string;
    is_charitable: boolean;
  }[];
}

/** Twitchのチアエモート
 * https://dev.twitch.tv/docs/api/reference#get-cheermotes */
export interface TwitchCheermote {
  id: string;
  min_bits: number; // このエモートになる最低ビッツ
  color: string; // hex (#000fff)
  url: {
    dark: string;
    light: string;
  };
  animated_url: {
    dark: string;
    light: string;
  };
}

export type TwitchMessageItem = TwitchCheermoteMessage | TwitchEmote | string;

export interface TwitchCheermoteMessage {
  cheermote: TwitchCheermote;
  bits: number;
}

interface TwitchGetBadgeResponse {
  data: TwitchRawBadge[];
}

interface TwitchRawBadge {
  set_id: string;
  versions: TwitchBadgeVersion[];
}

interface TwitchBadgeVersion {
  id: string;
  image_url_1x: string;
  image_url_2x: string;
  image_url_4x: string;
}

/** バッジ情報 */
export interface TwitchBadge {
  info?: string; // サブスクnヵ月目とか
  set_id: string;
  version_id: string;
  url?: string;
  versions: TwitchBadgeVersion[];
}

/** ユーザー情報 */
export interface TwitchUser {
  id?: string;
  name?: string;
  displayName?: string;
  type?: '' | 'admin' | 'global_mod' | 'staff' | 'mod';
  color?: string;
  isSubscriber: boolean;
  isModerator: boolean;
  isTurbo: boolean;
  badges: TwitchBadge[];
}

export interface TwitchItemBase {
  id: string;
  type: string;
  author: TwitchUser;
  timestamp: Date;
}

/** チャットアイテム */
export interface TwitchNormalChatItem extends TwitchItemBase {
  type: 'Normal';
  message: (TwitchEmote | string)[];
  isHighlight?: boolean;
}

/** サブスク */
export interface TwitchSubItem extends TwitchItemBase {
  type: 'Sub';
  message: string;
  methods: SubMethods;
}

/** サブスクギフト */
export interface TwitchSubGiftItem extends TwitchItemBase {
  type: 'SubGift';
  methods: SubMethods;
  streakMonths: number; // 継続月？
  recipient: TwitchUser; // 受け取り相手
}

/** サブスクギフト(誰かに) */
export interface TwitchSubMysteryGiftItem extends TwitchItemBase {
  type: 'SubMysteryGift';
  methods: SubMethods;
  num: number; // サブスク個数
}

/** チア(ビッツ) */
export interface TwitchCheerItem extends TwitchItemBase {
  type: 'Cheer';
  message: (TwitchCheermoteMessage | string)[];
  bits: number;
}

export type TwitchChatItem =
  | TwitchNormalChatItem
  | TwitchSubItem
  | TwitchCheerItem
  | TwitchSubGiftItem
  | TwitchSubMysteryGiftItem;

type TwitchChatEvents = {
  start: (channel: string) => void;
  end: () => void;
  chat: (item: TwitchChatItem) => void;
  metadata: (metadata: TwitchStreamResponse) => void;
  token: (token: string) => void;
  error: (err: Error | unknown) => void;
};

export class TwitchChat extends (EventEmitter as new () => TypedEmitter<TwitchChatEvents>) {
  #token: string;
  #clientId: string;
  #channel?: string;
  #name: string;
  #roomId?: string;
  #tmi: TmiClient;
  #badges: { [key: string]: TwitchRawBadge } = {};
  #globalBadges: { [key: string]: TwitchRawBadge } = {};
  #emotes: { [key: string]: TwitchEmote } = {};
  #emote_sets: string[] = [];
  #cheermotes: { [key: string]: TwitchCheermote[] } = {}; // チャンネルのチアエモート
  #isStarted = false;

  #metaTimer: NodeJS.Timeout | null = null;
  constructor(options: TwitchChatOptions) {
    super();
    this.#token = options.token;
    this.#clientId = options.clientId;
    this.#name = options.name;
    this.#tmi = new TmiClient({
      options: {
        debug: false,
        skipUpdatingEmotesets: true,
      },
      identity: {
        username: options.name,
        password: options.token,
      },
    });
    this.#tmi.on('roomstate', async (channel, roomState) => {
      this.#roomId = roomState['room-id'];
      if (this.#roomId) {
        this.getChannelEmote(this.#roomId);
        this.getGlobalBadges();
        this.getChannelBadges(this.#roomId);
        await this.getChannelCheermotes(this.#roomId);
        console.log(this.#cheermotes);
        if (this.#metaTimer) {
          clearTimeout(this.#metaTimer);
        }
        this.#executeMetaUpdate();
      }
    });
    this.#tmi.on('message', (channel, userState, message, self) => {
      const item = this.createChatItem(userState, message);
      this.emit('chat', item);
    });

    // ビッツ
    this.#tmi.on('cheer', (channel, userState, message) => {
      const bits = parseInt(userState.bits || '1');
      const item: TwitchCheerItem = {
        type: 'Cheer',
        id: userState.id || uuid(),
        author: this.createUser(userState),
        message: this.convertCheerMessage(bits, message),
        bits,
        timestamp: this.getTimestamp(userState['tmi-sent-ts']),
      };
      console.log(item);
      this.emit('chat', item);
    });

    // サブスク
    this.#tmi.on(
      'subscription',
      (channel, userName, methods, message, userState) => {
        const item: TwitchSubItem = {
          type: 'Sub',
          id: userState.id || uuid(),
          author: this.createUser(userState),
          methods,
          message,
          timestamp: this.getTimestamp(userState['tmi-sent-ts']),
        };
        console.log(item);
        this.emit('chat', item);
      }
    );

    // サブスクギフト
    this.#tmi.on(
      'subgift',
      (channel, username, streakMonths, recipient, methods, userState) => {
        const item: TwitchSubGiftItem = {
          type: 'SubGift',
          id: userState.id || uuid(),
          author: this.createUser(userState),
          methods: methods,
          streakMonths: streakMonths,
          timestamp: this.getTimestamp(userState['tmi-sent-ts']),
          recipient: {
            id: userState['msg-param-recipient-id'],
            name: userState['msg-param-recipient-user-name'] || recipient,
            displayName:
              userState['msg-param-recipient-display-name'] || recipient,
            isSubscriber: false,
            isModerator: false,
            isTurbo: false,
            badges: [],
          },
        };
        console.log(item);
        this.emit('chat', item);
      }
    );

    // サブスクミステリーギフト
    this.#tmi.on(
      'submysterygift',
      (channel, username, num, methods, userState) => {
        const item: TwitchSubMysteryGiftItem = {
          type: 'SubMysteryGift',
          id: userState.id || uuid(),
          author: this.createUser(userState),
          methods: methods,
          num: num,
          timestamp: this.getTimestamp(userState['tmi-sent-ts']),
        };
        console.log(item);
        this.emit('chat', item);
      }
    );

    this.#tmi.on('emotesets', (sets, obj) => {
      this.getEmoteSets(sets.split(','));
    });
  }

  /** ログイン処理(tokenが有効なら何もしない) */
  async login(): Promise<string> {
    try {
      await this.validateToken();
    } catch (err) {
      const token = await this.getToken();
      console.log(token);
      this.#token = token;
      this.emit('token', token);
      // tokenに合わせてクライアントも更新
      this.#tmi = new TmiClient({
        options: {
          debug: true,
          skipUpdatingEmotesets: true,
        },
        identity: {
          username: this.#name,
          password: this.#token,
        },
      });
      return token;
    }
    return this.#token;
  }

  /** 指定されたチャンネルに接続 */
  async start(channel: string) {
    if (this.#metaTimer) {
      clearTimeout(this.#metaTimer);
      this.#metaTimer = null;
    }
    if (this.#isStarted) {
      await this.stop();
    }
    await this.#tmi.connect();
    this.#isStarted = true;
    await this.#tmi.join(channel);
    this.#channel = channel;
    this.emit('start', channel);
  }

  /** 切断する */
  async stop() {
    if (this.#metaTimer) {
      clearTimeout(this.#metaTimer);
      this.#metaTimer = null;
    }
    if (!this.#isStarted) return;
    await this.#tmi.disconnect();
    this.#isStarted = false;
    this.#channel = undefined;
    this.emit('end');
  }

  getTimestamp(time?: string) {
    return new Date(parseInt(time || Date.now() + ''));
  }

  convertCheerMessage(totalBits: number, message: string) {
    const prefixReList: string[] = [];
    for (const prefix in this.#cheermotes) {
      prefixReList.push(`${prefix}[0-9]+`);
    }
    const re = new RegExp(prefixReList.join('|'), 'gi');
    const cheerStrList = message.match(re);
    const splittedMsg = message.split(re);
    const result: (TwitchCheermoteMessage | string)[] = [];

    for (let i = 0; i < splittedMsg.length; i++) {
      result.push(splittedMsg[i]);
      const targetCheerStr = cheerStrList?.[i];
      if (!targetCheerStr) continue;
      const bits = parseInt(targetCheerStr.match(/[0-9]+/)?.[0] || '1');
      const prefix = (
        targetCheerStr.match(/[A-z]+/)?.[0] || 'Cheer'
      ).toLowerCase();
      let resCheermote: TwitchCheermote = this.#cheermotes[prefix][0];
      let min_bits = 0;
      for (const cheermote of this.#cheermotes[prefix]) {
        if (min_bits < cheermote.min_bits && bits >= cheermote.min_bits) {
          resCheermote = cheermote;
          min_bits = cheermote.min_bits;
        }
      }
      result.push({
        bits,
        cheermote: resCheermote,
      });
    }

    return result;
  }

  /** チャットアイテムの生成 */
  createChatItem(
    userState: ChatUserstate,
    rawMessage: string
  ): TwitchNormalChatItem {
    // メッセージの生成
    const message = this.convertMessage(rawMessage, userState.emotes);
    return {
      type: 'Normal',
      id: userState.id || uuid(),
      author: this.createUser(userState),
      message: message,
      isHighlight: userState['msg-id'] === 'highlighted-message',
      timestamp: new Date(
        parseInt(userState['tmi-sent-ts'] || Date.now() + '')
      ),
    };
  }

  /** ユーザーの生成 */
  createUser(userState: CommonUserstate): TwitchUser {
    // バッジの生成
    const rawBadges = userState.badges || {};
    const badgeInfo = userState['badge-info'] || {};
    const badges: TwitchBadge[] = [];
    for (const set_id in rawBadges) {
      const version_id = rawBadges[set_id];
      const info = badgeInfo[set_id];
      if (!version_id) continue;
      badges.push(this.createResponseBadge(set_id, version_id, info));
    }

    return {
      id: userState['user-id'],
      name: userState.username,
      displayName: userState['display-name'],
      type: userState['user-type'] || '',
      color: userState.color,
      isSubscriber: !!userState.subscriber,
      isModerator: !!userState.mod,
      isTurbo: !!userState.turbo,
      badges: badges,
    };
  }

  /** エモートの情報を含んだMessageにする */
  convertMessage(rawMessage: string, emotes?: { [emoteid: string]: string[] }) {
    if (!emotes) return [rawMessage];
    const parts: {
      start: number;
      end: number;
      emoteId?: string;
      text?: string;
      name?: string;
    }[] = [
      { start: -1, end: -1 },
      { start: rawMessage.length, end: rawMessage.length },
    ];
    for (const emoteId in emotes) {
      for (const part of emotes[emoteId]) {
        const p = part.split('-').map((n) => parseInt(n));
        parts.push({
          start: p[0],
          end: p[1],
          emoteId: emoteId,
          name: rawMessage.slice(p[0], p[1] + 1),
        });
      }
    }
    parts.sort((a, b) => a.start - b.start);
    const len = parts.length;
    const textParts: {
      start: number;
      end: number;
      emoteId?: string;
      text?: string;
    }[] = [];
    for (let i = 0; i < len - 1; i++) {
      const s = parts[i].end;
      const e = parts[i + 1].start;
      if (rawMessage.length > s + 1) {
        const text = rawMessage.slice(s + 1, e);
        if (text.length === 0) continue;
        textParts.push({
          start: s + 1,
          end: e,
          text,
        });
      }
    }
    if (len === 0) {
      textParts.push({
        start: 0,
        end: rawMessage.length,
        text: rawMessage,
      });
    }
    parts.push(...textParts);
    parts.sort((a, b) => a.start - b.start);
    return parts
      .map((part): TwitchEmote | string => {
        if (part.emoteId) {
          let emote: TwitchEmote = this.#emotes[part.emoteId];
          if (!emote) {
            emote = {
              id: part.emoteId,
              name: part.name || part.emoteId,
              url: `https://static-cdn.jtvnw.net/emoticons/v2/${part.emoteId}/default/light/2.0`,
            };
          }
          return emote;
        } else if (part.text) {
          return part.text;
        }
        return '';
      })
      .filter((item) => {
        // 空文字を削除
        return !(typeof item === 'string' && item.length === 0);
      });
  }

  addBadges(jsonData: TwitchGetBadgeResponse, isGlobal = false) {
    for (const rawBadge of jsonData.data) {
      if (isGlobal) {
        this.#globalBadges[rawBadge.set_id] = rawBadge;
      } else {
        this.#badges[rawBadge.set_id] = rawBadge;
      }
    }
  }

  /** Badgeを扱いやすいようにする */
  createResponseBadge(
    set_id: string,
    version_id: string,
    info?: string
  ): TwitchBadge {
    const rawBadge = this.#badges[set_id] || this.#globalBadges[set_id];
    if (!rawBadge) {
      return {
        set_id,
        version_id,
        versions: [],
      };
    }
    const targetVersion = rawBadge.versions.filter(
      (v) => v.id === version_id
    )[0];
    if (!targetVersion) {
      return {
        set_id,
        version_id,
        // versions: rawBadge.versions
        versions: [],
      };
    }
    return {
      info: info,
      set_id,
      version_id,
      url: targetVersion.image_url_4x,
      // versions: rawBadge.versions
      versions: [],
    };
  }

  addEmote(rawEmote: TwitchRawEmote, template: string) {
    const url = template
      .replace('{{id}}', rawEmote.id)
      .replace('{{format}}', 'static')
      .replace('{{theme_mode}}', rawEmote.theme_mode[0])
      .replace('{{scale}}', rawEmote.scale.slice(-1)[0]);
    const animated_url =
      rawEmote.format.indexOf('animated') < 0
        ? undefined
        : template
            .replace('{{id}}', rawEmote.id)
            .replace('{{format}}', 'animated')
            .replace('{{theme_mode}}', rawEmote.theme_mode[0])
            .replace('{{scale}}', rawEmote.scale.slice(-1)[0]);
    this.#emotes[rawEmote.id] = {
      id: rawEmote.id,
      name: rawEmote.name,
      emote_type: rawEmote.emote_type,
      emote_set_id: rawEmote.emote_set_id,
      owner_id: rawEmote.owner_id,
      url: url,
      animated_url: animated_url,
    };
  }

  addEmotes(jsonData: TwitchGetEmoteResponse) {
    for (const rawEmote of jsonData.data) {
      this.addEmote(rawEmote, jsonData.template);
    }
  }

  addCheermote(prefix: string, rawCheermote: TwitchRawCheermote) {
    const cheermote: TwitchCheermote = {
      id: rawCheermote.id,
      min_bits: rawCheermote.min_bits,
      color: rawCheermote.color,
      url: {
        dark: rawCheermote.images.dark.static[4],
        light: rawCheermote.images.light.static[4],
      },
      animated_url: {
        dark: rawCheermote.images.dark.animated[4],
        light: rawCheermote.images.light.animated[4],
      },
    };
    this.#cheermotes[prefix].push(cheermote);
  }

  addCheermotes(jsonData: TwitchGetCheermotesResponse) {
    for (const rawCheermoteSet of jsonData.data) {
      const prefix = rawCheermoteSet.prefix.toLowerCase();
      this.#cheermotes[prefix] = [];
      for (const rawCheermote of rawCheermoteSet.tiers)
        this.addCheermote(prefix, rawCheermote);
    }
  }

  /** グローバルエモートを取得して追加 */
  async getGlobalEmotes() {
    const req = new Request('https://api.twitch.tv/helix/chat/emotes/global');
    const res = await fetch(req, this.getReqInit());
    const json = await res.json();
    this.addEmotes(json as TwitchGetEmoteResponse);
  }

  /** エモートセットから取得して追加 */
  async getEmoteSets(ids: string[]) {
    // 取得済みははじく
    const _ids = ids.filter((id) => this.#emote_sets.indexOf(id) === -1);
    const query = _ids.map((id) => `emote_set_id=${id}`).join('&');
    const req = new Request(
      `https://api.twitch.tv/helix/chat/emotes/set?${query}`
    );
    const res = await fetch(req, this.getReqInit());
    const json = await res.json();
    this.addEmotes(json as TwitchGetEmoteResponse);
    this.#emote_sets.push(..._ids);
  }

  /** チャンネルエモートを取得して追加 */
  async getChannelEmote(roomId: string) {
    const req = new Request(
      `https://api.twitch.tv/helix/chat/emotes?broadcaster_id=${roomId}`
    );
    const res = await fetch(req, this.getReqInit());
    const json = await res.json();
    this.addEmotes(json as TwitchGetEmoteResponse);
  }

  /** チャンネルチアエモートを取得して追加 */
  async getChannelCheermotes(roomId: string) {
    const req = new Request(
      `https://api.twitch.tv/helix/bits/cheermotes?broadcaster_id=${roomId}`
    );
    const res = await fetch(req, this.getReqInit());
    const json = await res.json();
    this.addCheermotes(json as TwitchGetCheermotesResponse);
  }

  /** バッジを取得して追加 */
  async getGlobalBadges() {
    const req = new Request(`https://api.twitch.tv/helix/chat/badges/global`);
    const res = await fetch(req, this.getReqInit());
    const json = await res.json();
    this.addBadges(json as TwitchGetBadgeResponse, true);
  }

  /** チャンネルバッジを取得して追加 */
  async getChannelBadges(roomId: string) {
    const req = new Request(
      `https://api.twitch.tv/helix/chat/badges?broadcaster_id=${roomId}`
    );
    const res = await fetch(req, this.getReqInit());
    const json = await res.json();
    this.addBadges(json as TwitchGetBadgeResponse);
  }

  /** tokenの発行 */
  async getToken(): Promise<string> {
    const query = [
      `client_id=${this.#clientId}`,
      `response_type=token`,
      `redirect_uri=http://localhost:50930/twitch_redirect`,
      `scope=chat:read`,
    ].join('&');
    return new Promise((resolve, reject) => {
      tauriOnce('twitch_token', async (event) => {
        const searchParams = new URLSearchParams(event.payload as string);
        if (searchParams.has('access_token')) {
          resolve(searchParams.get('access_token') as string);
        } else {
          reject('cancel');
        }
      });
      invokeOrigin('open_in_browser', {
        url: `https://id.twitch.tv/oauth2/authorize?${query}`,
      });
    });
  }

  /** tokenが有効か確認 */
  async validateToken() {
    const headers = new Headers();
    headers.append('Authorization', `Bearer ${this.#token}`);
    const res = await fetch('https://id.twitch.tv/oauth2/validate', {
      headers,
    });
    if (res.status === 200) {
      return res.json();
    } else {
      return Promise.reject('error');
    }
  }

  async #executeMetaUpdate() {
    try {
      const res = await this.getStreams(this.#roomId || '1');
      if (res.data[0]) {
        this.emit('metadata', res.data[0]);
      }
    } catch (err) {
      console.error(err);
    }
    this.#metaTimer = setTimeout(this.#executeMetaUpdate.bind(this), 1000 * 30);
  }

  async getStreams(id: string) {
    const req = new Request(
      `https://api.twitch.tv/helix/streams?user_id=${id}`
    );
    const res = await fetch(req, this.getReqInit());
    const json = (await res.json()) as TwitchGetStreamsResponse;
    return json;
  }

  getReqInit(): RequestInit {
    const headers = new Headers();
    headers.append('Authorization', `Bearer ${this.#token}`);
    headers.append('Client-Id', this.#clientId);
    return {
      method: 'GET',
      mode: 'cors',
      // mode: "cors",
      // cache: "no-cache",
      headers,
    };
  }
}
