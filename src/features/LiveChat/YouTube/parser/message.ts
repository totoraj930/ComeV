import { ChatItem, EmojiItem } from 'youtube-chat-tauri/dist/types/data';

export type YTMessageItem = string | EmojiItem;

/**
 * ChatItemからYTMessageItem[]を生成
 */
export function parseMessage(rawItem: ChatItem): YTMessageItem[] {
  return rawItem.message.map((item) => {
    const text = item as { text: string };
    const emoji = item as EmojiItem;
    if (text.text) {
      return text.text;
    } else if (emoji.emojiText) {
      return emoji;
    }
    return '';
  });
}
