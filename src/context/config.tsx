import { createContext, Dispatch } from "react";

export const defaultConfig: AppConfig = {
  maxChatItemNum: 300,
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
    format: "$(Name) $(Message)",
    includeEmoji: false,
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
  format: string;
  includeEmoji: boolean;
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

// settings.jsonの.twitchのパース
export function parseTwitchConfig(raw: any, def: TwitchConfig) {
  if (typeof raw !== "object") return { ...def };
  const res = { ...def, ...raw } as TwitchConfig;

  if (typeof res.clientId !== "string") {
    res.clientId = def.clientId;
  }

  if (typeof res.token !== "string") {
    res.token = def.token;
  }
  return res;
}

// settings.jsonの.apiServerのパース
export function parseApiServerConfig(raw: any, def: ApiServerConfig) {
  if (typeof raw !== "object") return { ...def };
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
  if (typeof raw !== "object") return { ...def };
  const res = { ...def, ...raw } as BouyomiConfig;

  res.enable = !!res.enable;
  res.includeEmoji = !!res.includeEmoji;

  res.port = res.port - 0;
  if (!isFinite(res.port)) {
    res.port = def.port;
  }

  if (typeof res.format !== "string") {
    res.format = def.format;
  }

  return res;
}

// settings.jsonのパース
export function parseJson(rawJson: any, def: AppConfig) {
  if (typeof rawJson !== "object") return { ...def };
  const res = { ...def, ...rawJson } as AppConfig;

  res.useSmoothScroll = !!res.useSmoothScroll;

  if (!isFinite(res.intervalMs) || res.intervalMs < 1000) {
    res.intervalMs = def.intervalMs;
  }

  if (!isFinite(res.maxChatItemNum)) {
    res.maxChatItemNum = def.maxChatItemNum;
  }

  if (typeof res.themeName !== "string") {
    res.themeName = def.themeName;
  }

  if (!Array.isArray(res.prevUrl)) {
    res.prevUrl = def.prevUrl;
  } else {
    const urlList = [];
    for (const url of res.prevUrl) {
      if (typeof url === "string") {
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
      res = {...action.data}
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