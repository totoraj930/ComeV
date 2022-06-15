import { createContext, Dispatch } from "react";

export const defaultConfig: AppConfig = {
  maxChatItemNum: 500,
  useSmoothScroll: true,
  intervalMs: 3000,
  themeName: "dark",
  prevUrl: [""],
  enableAnonyView: false,
  twitch: {
    clientId: "u7y21ic3v3nsrl9jmxsij78eciy3fl",
    token: "",
  },
  apiServer: {
    enable: true,
    port: 50930,
  },
  bouyomi: {
    enable: false,
    port: 50080,
    includeEmoji: false,
    youtube: {
      normal: "$(Message)",
      superchat: "$(Name)さんが$(Amount)スーパーチャットしました $(Message)",
      membership: "$(Name)さんがメンバーになりました",
      membershipGift: "$(Name)さんがメンバーシップギフトを送りました",
    },
    twitch: {
      normal: "$(Message)",
      cheer: "$(Name)さんが$(Amount)ビッツ送りました $(Message)",
      sub: "$(Name)さんがサブスクしました",
      subPrime: "$(Name)さんがプライムでサブスクしました",
      subGift: "$(Name)さんがサブスクギフトを$(GiftNum)個送りました",
    }
  },
}

export function copyConfig(settings: AppConfig): AppConfig {
  return {
    ...settings,
    apiServer: { ...settings.apiServer },
    bouyomi: { ...settings.bouyomi }
  };
}

export type ApiServerConfig = {
  enable: boolean;
  port: number;
}

export type BouyomiConfig = {
  enable: boolean;
  port: number;
  includeEmoji: boolean;
  youtube: BouyomiYouTubeConfig;
  twitch: BouyomiTwitchConfig;
}

export type BouyomiYouTubeConfig = {
  normal: string;
  superchat: string;
  membership: string;
  membershipGift: string;
}

export type BouyomiTwitchConfig = {
  normal: string;
  cheer: string;
  sub: string;
  subPrime: string;
  subGift: string;
}

export type TwitchConfig = {
  clientId: string;
  token: string;
}


export interface AppConfig {
  maxChatItemNum: number;
  useSmoothScroll: boolean;
  intervalMs: number;
  themeName: string;
  prevUrl: string[];
  enableAnonyView: boolean;
  twitch: TwitchConfig;
  apiServer: ApiServerConfig;
  bouyomi: BouyomiConfig;
}

function isString(data: unknown) {
  return typeof data === "string";
}
function isObject(data: unknown) {
  return typeof data === "object";
}
function isNumber(data: unknown) {
  return (
    typeof data === "number"
    && !isNaN(data)
  );
}
function isSameType(a: unknown, b: unknown) {
  return typeof a === typeof b;
}

// settings.jsonの.twitchのパース
export function parseTwitchConfig(raw: any, def: TwitchConfig) {
  if (!isObject(raw)) return { ...def };
  const res = { ...def, ...raw } as TwitchConfig;

  if (!isString(res.clientId)) {
    res.clientId = def.clientId;
  }

  if (!isString(res.token)) {
    res.token = def.token;
  }
  return res;
}

// settings.jsonの.apiServerのパース
export function parseApiServerConfig(raw: any, def: ApiServerConfig) {
  if (!isObject(raw)) return { ...def };
  const res = { ...def, ...raw } as ApiServerConfig;

  res.enable = !!res.enable;
  
  res.port = res.port - 0;
  if (!isFinite(res.port)) {
    res.port = def.port;
  }
  
  return res;
}

// settings.jsonの.bouyomiのパース
export function parseBouyomiConfig(raw: any, def: BouyomiConfig) {
  if (!isObject(raw)) return { ...def };
  const res = { ...def, ...raw } as BouyomiConfig;

  res.enable = !!res.enable;
  res.includeEmoji = !!res.includeEmoji;

  res.port = res.port - 0;
  if (!isNumber(res.port)) {
    res.port = def.port;
  }

  res.youtube = parseBouyomiYouTubeConfig(res.youtube, def.youtube);
  res.twitch = parseBouyomiTwitchConfig(res.twitch, def.twitch);

  return res;
}

export function parseBouyomiYouTubeConfig(raw: any, def: BouyomiYouTubeConfig) {
  if (!isObject(raw)) return { ...def };
  const res = { ...def, ...raw } as BouyomiYouTubeConfig;

  const keys = Object.keys(def) as (keyof BouyomiYouTubeConfig)[];
  for (const key of keys) {
    if (typeof res[key] !== typeof def[key]) {
      res[key] = def[key];
    }
  }
  return res;
}

export function parseBouyomiTwitchConfig(raw: any, def: BouyomiTwitchConfig) {
  if (!isObject(raw)) return { ...def };
  const res = { ...def, ...raw } as BouyomiTwitchConfig;

  const keys = Object.keys(def) as (keyof BouyomiTwitchConfig)[];
  for (const key of keys) {
    if (typeof res[key] !== typeof def[key]) {
      res[key] = def[key];
    }
  }
  return res;
}

// settings.jsonのパース
export function parseObj(rawJson: any, def: AppConfig) {
  if (!isObject(rawJson)) return { ...def };
  const res = { ...def, ...rawJson } as AppConfig;

  res.useSmoothScroll = !!res.useSmoothScroll;

  if (!isSameType(res.intervalMs, def.intervalMs) || res.intervalMs < 1000) {
    res.intervalMs = def.intervalMs;
  }

  if (!isNumber(res.maxChatItemNum) || res.maxChatItemNum < 1) {
    res.maxChatItemNum = def.maxChatItemNum;
  }

  if (!isString(res.themeName)) {
    res.themeName = def.themeName;
  }

  if (!Array.isArray(res.prevUrl)) {
    res.prevUrl = def.prevUrl;
  } else {
    const urlList = [];
    for (const url of res.prevUrl) {
      if (isString(url)) {
        urlList.push(url);
      }
    }
    res.prevUrl = urlList.length ? urlList : [""];
  }

  res.twitch = parseTwitchConfig(res.twitch, def.twitch);
  res.apiServer = parseApiServerConfig(res.apiServer, def.apiServer);
  res.bouyomi = parseBouyomiConfig(res.bouyomi, def.bouyomi);


  return res;
}

export type AppConfigAction =
  ChangeConfigAction;

interface BaseAction {
  type: string;
}

interface ChangeConfigAction extends BaseAction {
  type: "CHANGE";
  data: AppConfig;
}


export function appConfigReducer(state: AppConfig, action: AppConfigAction): AppConfig {
  let res = state;
  switch (action.type) {
    case "CHANGE": {
      res = parseObj(action.data, copyConfig(defaultConfig));
      break;
    }
  }
  return res;
}

export const AppConfigContext = createContext<{
  state: AppConfig,
  dispatch: Dispatch<AppConfigAction>
}>({
  state: {...defaultConfig},
  dispatch: () => {}
});