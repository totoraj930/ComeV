import { invoke as invokeOrigin } from '@tauri-apps/api';
type EventName =
  | 'youtube'
  | 'youtube-list'
  | 'twitch'
  | 'app'
  | 'clear'
  | 'reload';
export function sendChatApi(eventName: EventName, data: any) {
  invokeOrigin('send_chat', {
    data: 'event: ' + eventName + '\ndata: ' + JSON.stringify(data),
  });
}
