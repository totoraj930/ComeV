import { ChatItem } from 'youtube-chat-tauri/dist/types/data';

export interface YTChatAuthor {
  name: string;
  icon?: string; // url
  channelId: string;
  isOwner: boolean;
  isMembership: boolean;
  isModerator: boolean;
  isVerified: boolean;
  badge?: {
    url: string;
    label: string;
  };
}

/**
 * ChatItemからYTChatAuthorを生成
 */
export function parseAuthor(item: ChatItem): YTChatAuthor {
  const badge = item.author.badge
    ? { url: item.author.badge.thumbnail.url, label: item.author.badge.label }
    : undefined;
  return {
    name: item.author.name,
    channelId: item.author.channelId,
    icon: item.author.thumbnail?.url,
    badge,
    isOwner: item.isOwner,
    isModerator: item.isModerator,
    isVerified: item.isVerified,
    isMembership: item.isMembership,
  };
}
