import { TwitchChatItem as RawChatItem } from '@/utils/twitch';
import { ChatItemBase } from '../..';

interface TWChatItemBase extends ChatItemBase {
  source: 'Twitch';
  channel: string;
  timestamp: number;
}

export type TWChatItem = Omit<RawChatItem, 'timestamp'> & TWChatItemBase;

/**
 * ChatItemからTWChatItemを生成
 */
export function parseChatItem(item: RawChatItem, channel: string): TWChatItem {
  return {
    ...item,
    source: 'Twitch',
    channel,
    timestamp: item.timestamp.getTime(),
  };
}
