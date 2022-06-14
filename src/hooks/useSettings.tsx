import { useCallback, useContext } from "react";
import { AppConfig, AppConfigContext, copyConfig, parseObj } from "../context/config";
import { fs, invoke as invokeOrigin, path } from "@tauri-apps/api";
import { invoke } from "../utils/tauriInvoke"
import { ChatItemContext } from "../context/chatItem";
import { uuid } from "../utils/uuid";
import { createAppChatItem } from "../services/liveChatService";

export type SettingsManagerAction =
  | LoadSettingsAction
  | SaveSettingsAction
  | ChangeSettingsAction
  | ChangeAndSaveSettingsAction
  | UpdateTwitchTokenAction;

interface BaseAction {
  type: string;
}

export interface LoadSettingsAction extends BaseAction {
  type: "LOAD";
}
export interface SaveSettingsAction extends BaseAction {
  type: "SAVE";
}
export interface ChangeSettingsAction extends BaseAction {
  type: "CHANGE";
  data: AppConfig;
}
export interface ChangeAndSaveSettingsAction extends BaseAction {
  type: "CHANGE_SAVE";
  data: AppConfig;
}
export interface UpdateTwitchTokenAction extends BaseAction {
  type: "UPDATE_TWITCH_TOKEN";
  token: string;
}

const FILE_PATH = "settings.json";
const BASE_DIR = fs.BaseDirectory.App;

export async function saveConfig(config: AppConfig) {
  return fs.writeFile({
    path: FILE_PATH,
    contents: JSON.stringify(config, null, "    ")
  }, { dir: BASE_DIR });
}

export async function initConfigDir() {
  try {
    await fs.readDir("./", { dir: BASE_DIR });
  } catch {
    return await fs.createDir(await path.appDir());
  }
}

export function useSettings() {
  const { state, dispatch } = useContext(AppConfigContext);
  const { dispatch: dispatchChatItem } = useContext(ChatItemContext);

  const updater = async (action: SettingsManagerAction): Promise<AppConfig> => {
    switch (action.type) {
      case "LOAD": {
        try {
          await initConfigDir();
          const files = await fs.readDir("./", { dir: BASE_DIR });
          let rawText = "{}";
          for (const file of files) {
            if (file.name !== FILE_PATH) continue;
            rawText = await fs.readTextFile(FILE_PATH, { dir: BASE_DIR });
            break;
          }
          const rawJson = JSON.parse(rawText);
          const res = parseObj(rawJson, state);
          saveConfig(res).catch(() => {
            dispatchChatItem({
              config: state,
              type: "ADD",
              actionId: uuid(),
              chatItem: [createAppChatItem("error", "設定ファイルの保存に失敗しました")]
            });
          });
          dispatchChatItem({
            config: state,
            type: "ADD",
            actionId: uuid(),
            chatItem: [createAppChatItem("log", "設定ファイルを読み込みました")]
          });
          if (res.apiServer.enable) {
            invoke("start_chat_server", { port: res.apiServer.port });
          } else {
            invoke("stop_chat_server");
          }
          dispatch({ type: "CHANGE", data: res });
          return res;
        } catch (err) {
          console.error(err);
          dispatchChatItem({
            config: state,
            type: "ADD",
            actionId: uuid(),
            chatItem: [createAppChatItem("error", "設定ファイルの読み込みに失敗しました")]
          });
          return state;
        }
      }
      case "SAVE": {
        saveConfig(state);
        return state;
      }
      case "CHANGE": {
        dispatch({
          type: "CHANGE",
          data: copyConfig(action.data)
        });
        return action.data;
      }
      case "CHANGE_SAVE": {
        const res = {...copyConfig(state), ...copyConfig(action.data)};
        dispatch({
          type: "CHANGE",
          data: res
        });
        saveConfig(res);
        return res;
      }
      case "UPDATE_TWITCH_TOKEN": {
        const res: AppConfig = {
          ...copyConfig(state),
          twitch: {
            ...state.twitch,
            token: action.token
          }
        };
        dispatch({
          type: "CHANGE",
          data: res
        });
        saveConfig(res);
        return res;
      }
      default: {
        return state;
      }
    }
  };

  return {
    settings: state,
    settingsUpdater: updater
  }
}
