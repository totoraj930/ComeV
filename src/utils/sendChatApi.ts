
import { invoke as invokeOrigin } from "@tauri-apps/api";
import { invoke } from "../utils/tauriInvoke"
type EventName = "youtube" | "youtube-list" | "app" | "clear";
export function sendChatApi(eventName: EventName, data: any) {
  invoke("send_chat", {
    data: "event: " + eventName + "\ndata: " + JSON.stringify(data)
  });
}