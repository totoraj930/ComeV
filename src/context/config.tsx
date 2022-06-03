import { createContext, Dispatch } from "react";

export const defaultConfig: AppConfig = {
  maxChatItemNum: 300,
  intervalMs: 3000,
  themeName: "dark",
  prevUrl: "",
  enableAnonyView: false,
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


export interface AppConfig {
  maxChatItemNum: number;
  intervalMs: number;
  themeName: string;
  prevUrl: string;
  enableAnonyView: boolean;
  apiServer: ApiServerConfig;
  bouyomi: BouyomiConfig;
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

  if (!isFinite(res.intervalMs) || res.intervalMs < 1000) {
    res.intervalMs = def.intervalMs;
  }

  if (!isFinite(res.maxChatItemNum)) {
    res.maxChatItemNum = def.maxChatItemNum;
  }

  if (typeof res.themeName !== "string") {
    res.themeName = def.themeName;
  }

  if (typeof res.prevUrl !== "string") {
    res.prevUrl = def.prevUrl;
  }

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