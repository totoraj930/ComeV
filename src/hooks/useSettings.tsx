import { useCallback, useContext } from "react";
import { AppConfig, AppConfigContext, copyConfig, parseJson } from "../context/config";
import { fs, invoke } from "@tauri-apps/api";
import { ChatItemContext } from "../context/chatItem";
import { uuid } from "../utils/uuid";
import { createAppChatItem } from "../services/liveChatService";

export type SettingsManagerAction =
  | LoadSettingsAction
  | SaveSettingsAction
  | ChangeSettingsAction
  | ChangeAndSaveSettingsAction;

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

const FILE_PATH = "settings.json";
const BASE_DIR = fs.BaseDirectory.Resource;

export function saveConfig(config: AppConfig) {
  return fs.writeFile({
    path: FILE_PATH,
    contents: JSON.stringify(config, null, "    ")
  }, { dir: BASE_DIR });
}

export function useSettings() {
  const { state, dispatch } = useContext(AppConfigContext);
  const { dispatch: dispatchChatItem } = useContext(ChatItemContext);

  const updater = useCallback((action: SettingsManagerAction) => {
    switch (action.type) {
      case "LOAD": {
        fs.readDir(".", { dir: BASE_DIR })
        .then(async (files) => {
          for (const file of files) {
            if (file.name === FILE_PATH) {
              const rawText = await fs.readTextFile(FILE_PATH, { dir: BASE_DIR });
              try {
                console.log("LOAD: saveConfig");
                const rawJson = JSON.parse(rawText);
                const res = parseJson(rawJson, state);
                saveConfig(res);
                return Promise.resolve(res);
              } catch (err) {
                return Promise.reject(err);
              }
            }
          }
          return state;
        })
        .then((res) => {
          dispatchChatItem({
            config: state,
            type: "ADD",
            actionId: uuid(),
            chatItem: createAppChatItem("log", "設定ファイルを読み込みました")
          });
          dispatch({
            type: "CHANGE",
            data: res
          });
          if (res.apiServer.enable) {
            invoke("start_chat_server", { port: res.apiServer.port });
          } else {
            invoke("stop_chat_server");
          }
        })
        .catch((err) => {
          console.error(err);
          dispatchChatItem({
            config: state,
            type: "ADD",
            actionId: uuid(),
            chatItem: createAppChatItem("error", "設定ファイルの読み込みに失敗しました")
          });
        });
        break;
      }
      case "SAVE": {
        saveConfig(state);
        break;
      }
      case "CHANGE": {
        dispatch({
          type: "CHANGE",
          data: copyConfig(action.data)
        });
        break;
      }
      case "CHANGE_SAVE": {
        const res = {...copyConfig(state), ...copyConfig(action.data)};
        dispatch({
          type: "CHANGE",
          data: res
        });
        saveConfig(res);
        break;
      }
      default: {
        break;
      }
    }
  }, [state, dispatch, dispatchChatItem]);

  return {
    settings: state,
    settingsUpdater: updater
  }
}
