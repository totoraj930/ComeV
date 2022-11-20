import { BouyomiConfig } from '../context/config';
import { ChatItem, ytMessageToString } from '../services/liveChatService';

export function sendBouyomi(chatItem: ChatItem, config: BouyomiConfig) {
  if (!config.enable) return;
  let text = '';
  if (chatItem.type === 'YouTube') {
    const msg = ytMessageToString(chatItem.data.message, config.includeEmoji);
    text = config.youtube.normal
      .replace(/\$\(Name\)/g, chatItem.data.author.name)
      .replace(/\$\(Message\)/g, msg);
  }
  if (text.length <= 0) return;
  const params = new URLSearchParams();
  params.append('text', text);
  const url = `http://localhost:${config.port}/talk?` + params.toString();
  fetch(url).then((res) => {
    // console.log(res);
  });
}

export function sendBouyomiText(text: string, config: BouyomiConfig) {
  const url = `http://localhost:${config.port}/talk?text=${encodeURIComponent(
    text
  )}`;
  fetch(url).then((res) => {
    // console.log(res);
  });
}

type requestType = 'pause' | 'resume' | 'skip' | 'clear';
export function requestBouyomi(type: requestType, config: BouyomiConfig) {
  const url = `http://localhost:${config.port}/${type}`;
  fetch(url).then((res) => {
    // console.log(res);
  });
}
