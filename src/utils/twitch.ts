
import EventEmitter from "events";
import { ChatUserstate, Client as TmiClient } from "tmi.js"
import TypedEmitter from "typed-emitter";
import { invoke } from "./tauriInvoke";
import { once as tauriOnce } from "@tauri-apps/api/event";
import { uuid } from "./uuid";

export interface TwitchChatOptions {
  token: string;
  clientId: string;
  name: string;
}

type EmoteUrlSize = "url_1x" | "url_2x" | "url_4x";
type EmoteType = "bitstier" | "follower" | "subscriptions"
  | "smilies" | "prime" | "twofactor";
type EmoteFormat = "animated" | "static";
type EmoteScale = "1.0" | "2.0" | "3.0";
type EmoteThemeMode = "light" | "dark";
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
  type?: "" | "admin" | "global_mod" | "staff" | "mod";
  color?: string;
  isSubscriber: boolean;
  isModerator: boolean;
  isTurbo: boolean;
  badges: TwitchBadge[];
}

/** チャットアイテム */
export interface TwitchChatItem {
  id: string;
  auther: TwitchUser;
  message: (TwitchEmote | string)[];
  timestamp: Date;
}

type TwitchChatEvents = {
  start: () => void;
  end: () => void;
  chat: (item: TwitchChatItem) => void;
  token: (token: string) => void;
  error: (err: Error | unknown) => void;
}

export class TwitchChat extends (EventEmitter as new () => TypedEmitter<TwitchChatEvents>) {
  #token: string;
  #clientId: string;
  #channel?: string;
  #name: string;
  #roomId?: string;
  #tmi: TmiClient;
  #badges: { [key: string]: TwitchRawBadge} = {};
  #globalBadges: { [key: string]: TwitchRawBadge} = {};
  #emotes: { [key: string]: TwitchEmote } = {};
  #emote_sets: string[] = [];
  #isStarted = false;
  constructor(options: TwitchChatOptions) {
    super();
    this.#token = options.token;
    this.#clientId = options.clientId;
    this.#name = options.name;
    this.#tmi = new TmiClient({
      options: {
        debug: true,
        skipUpdatingEmotesets: true
      },
      identity: {
        username: options.name,
        password: options.token,
      }
    });
    this.#tmi.on("roomstate", (channel, roomState) => {
      this.#roomId = roomState["room-id"];
      if (this.#roomId) {
        this.getChannelEmote(this.#roomId);
        this.getGlobalBadges();
        this.getChannelBadges(this.#roomId);
      }
    });
    this.#tmi.on("message", (channel, userState, message, self) => {
      const item = this.createChatItem(userState, message);
      this.emit("chat", item);
    });
    this.#tmi.on("emotesets", (sets, obj) => {
      this.getEmoteSets(sets.split(","));
    });
  }

  /** ログイン処理(tokenが有効なら何もしない) */
  async login(): Promise<string> {
    try {
      await this.validateToken();
    } catch(err) {
      const token = await this.getToken();
      this.#token = token;
      this.emit("token", token);
    }
    return this.#token;
  }

  /** 指定されたチャンネルに接続 */
  async start(channel: string) {
    if (this.#isStarted) {
      await this.stop();
    }
    await this.#tmi.connect();
    await this.#tmi.join(channel);
    this.#channel = channel;
    this.#isStarted = true;
    this.emit("start");
  }

  /** 切断する */
  async stop() {
    if (!this.#isStarted) return;
    await this.#tmi.disconnect();
    this.#isStarted = false;
    this.#channel = undefined;
    this.emit("end");
  }

  /** チャットアイテムの生成 */
  createChatItem(userState: ChatUserstate, rawMessage: string): TwitchChatItem {

    // メッセージの生成
    const message = this.convertMessage(rawMessage, userState.emotes);

    return {
      id: userState.id || uuid(),
      auther: this.createUser(userState),
      message: message,
      timestamp: new Date(userState["tmi-sent-ts"] || Date.now())
    }
  }

  /** ユーザーの生成 */
  createUser(userState: ChatUserstate): TwitchUser {
    // バッジの生成
    const rawBadges = userState.badges || {};
    const badgeInfo = userState["badge-info"] || {};
    const badges: TwitchBadge[] = [];
    for (const set_id in rawBadges) {
      const version_id = rawBadges[set_id];
      const info = badgeInfo[set_id];
      if (!version_id) continue;
      badges.push(this.createResponseBadge(set_id, version_id, info));
    }

    return {
      id: userState["user-id"],
      name: userState.username,
      displayName: userState["display-name"],
      type: userState["user-type"] || "",
      color: userState.color,
      isSubscriber: !!userState.subscriber,
      isModerator: !!userState.mod,
      isTurbo: !!userState.turbo,
      badges: badges,
    }
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
      {start: -1, end: -1},
      {start: rawMessage.length, end: rawMessage.length}
    ];
    for (const emoteId in emotes) {
      for (const part of emotes[emoteId]) {
        const p = part.split("-").map((n) => parseInt(n));
        parts.push({
          start: p[0],
          end: p[1],
          emoteId: emoteId,
          name: rawMessage.slice(p[0], p[1] + 1)
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
      let e = parts[i + 1].start;
      if (rawMessage.length > s + 1) {
        const text = rawMessage.slice(s + 1, e);
        if (text.length === 0) continue;
        textParts.push({
          start: s + 1,
          end: e,
          text
        });
      }
    }
    if (len === 0) {
      textParts.push({
        start: 0,
        end: rawMessage.length,
        text: rawMessage
      });
    }
    parts.push(...textParts);
    parts.sort((a, b) => a.start - b.start);
    return parts.map((part): TwitchEmote | string => {
      if (part.emoteId) {
        return this.#emotes[part.emoteId] || `:${part.name}:`;
      } else if (part.text) {
        return part.text;
      }
      return "";
    }).filter((item) => {
      // 空文字を削除
      return !(typeof item === "string" && item.length === 0)
    });
  }

  addBadges(jsonData: TwitchGetBadgeResponse, isGlobal: boolean = false) {
    for (const rawBadge of jsonData.data) {
      if (isGlobal) {
        this.#globalBadges[rawBadge.set_id] = rawBadge;
      } else {
        this.#badges[rawBadge.set_id] = rawBadge;
      }
    }
  }

  /** Badgeを扱いやすいようにする */
  createResponseBadge(set_id: string, version_id: string, info?: string): TwitchBadge {
    const rawBadge = this.#badges[set_id] || this.#globalBadges[set_id];
    if (!rawBadge) {
      return {
        set_id,
        version_id,
        versions: []
      }
    }
    const targetVersion = rawBadge.versions.filter(v => v.id === version_id)[0];
    if (!targetVersion) {
      return {
        set_id,
        version_id,
        versions: rawBadge.versions
      }
    }
    return {
      info: info,
      set_id,
      version_id,
      url: targetVersion.image_url_4x,
      versions: rawBadge.versions
    }
  }

  addEmote(rawEmote: TwitchRawEmote, template: string) {
    const url = template
      .replace("{{id}}", rawEmote.id)
      .replace("{{format}}", "static")
      .replace("{{theme_mode}}", rawEmote.theme_mode[0])
      .replace("{{scale}}", rawEmote.scale.slice(-1)[0]);
    const animated_url = rawEmote.format.indexOf("animated") < 0
      ? undefined
      : template
      .replace("{{id}}", rawEmote.id)
      .replace("{{format}}", "animated")
      .replace("{{theme_mode}}", rawEmote.theme_mode[0])
      .replace("{{scale}}", rawEmote.scale.slice(-1)[0]);
    this.#emotes[rawEmote.id] = {
      id: rawEmote.id,
      name: rawEmote.name,
      emote_type: rawEmote.emote_type,
      emote_set_id: rawEmote.emote_set_id,
      owner_id: rawEmote.owner_id,
      url: url,
      animated_url: animated_url
    };
  }

  async addEmotes(jsonData: TwitchGetEmoteResponse) {
    for (const rawEmote of jsonData.data) {
      this.addEmote(rawEmote, jsonData.template);
    }
  }

  /** グローバルエモートを取得して追加 */
  async getGlobalEmotes() {
    const req = new Request("https://api.twitch.tv/helix/chat/emotes/global");
    const res = await fetch(req, this.getReqInit());
    const json = await res.json();
    this.addEmotes(json as TwitchGetEmoteResponse);
  }

  /** エモートセットから取得して追加 */
  async getEmoteSets(ids: string[]) {
    // 取得済みははじく
    const _ids = ids.filter((id) => this.#emote_sets.indexOf(id) === -1);
    const query = _ids
      .map((id) => `emote_set_id=${id}`)
      .join("&");
    const req = new Request(`https://api.twitch.tv/helix/chat/emotes/set?${query}`);
    const res = await fetch(req, this.getReqInit());
    const json = await res.json();
    this.addEmotes(json as TwitchGetEmoteResponse);
    this.#emote_sets.push(..._ids);
  }

  /** チャンネルエモートを取得して追加 */
  async getChannelEmote(roomId: string) {
    const req = new Request(`https://api.twitch.tv/helix/chat/emotes?broadcaster_id=${roomId}`);
    const res = await fetch(req, this.getReqInit());
    const json = await res.json();
    this.addEmotes(json as TwitchGetEmoteResponse);
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
    const req = new Request(`https://api.twitch.tv/helix/chat/badges?broadcaster_id=${roomId}`);
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
      `scope=chat:read`
    ].join("&");
    return new Promise((resolve, reject) => {
      tauriOnce("twitch_token", async (event) => {
        const searchParams = new URLSearchParams(event.payload as string);
        if (searchParams.has("access_token")) {
          resolve(searchParams.get("access_token") as string);
        } else {
          reject("error");
        }
      });
      invoke("open_in_browser", { url: `https://id.twitch.tv/oauth2/authorize?${query}` });
    });
  }

  /** tokenが有効か確認 */
  async validateToken() {
    const headers = new Headers();
    headers.append("Authorization", `Bearer ${this.#token}`);
    const res = await fetch("https://id.twitch.tv/oauth2/validate", { headers });
    console.log(res.status);
    if (res.status === 200) {
      return res.json();
    } else {
      return Promise.reject("error");
    }
  }

  getReqInit(): RequestInit {
    const headers = new Headers();
    headers.append("Authorization", `Bearer ${this.#token}`);
    headers.append("Client-Id", this.#clientId);
    return {
      method: "GET",
      mode: "cors",
      cache: "no-cache",
      headers
    }
  }
}