import {
  TwitchChatItem as RawChatItem,
  TwitchEmote,
  TwitchUser,
} from '@/utils/twitch';
import { uuid } from '@/utils/uuid';
import { ChatItemBase } from '../..';

interface TWChatItemBase extends ChatItemBase {
  source: 'Twitch';
  channel: string;
  author: TwitchUser;
  chatId: string; // チャット自体のID(idはapp側でつける)
  timestamp: number; // UNIX
}

export type TWChatItem = Omit<RawChatItem, 'timestamp'> & TWChatItemBase;

/**
 * ChatItemからTWChatItemを生成
 */
export function parseChatItem(item: RawChatItem, channel: string): TWChatItem {
  return {
    ...item,
    id: uuid(),
    chatId: item.id,
    source: 'Twitch',
    channel,
    timestamp: item.timestamp.getTime(),
  };
}
