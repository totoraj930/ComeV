import { ChatItem as YTChatItemData, EmojiItem, ImageItem, MessageItem, MetadataItem } from "youtube-chat-tauri/dist/types/data";
import { LiveChat as YTLiveChat } from "youtube-chat-tauri";
import { uuid } from "../utils/uuid";

export type ChatItem = YTChatItem | AppChatItem;

interface YTChatItem {
  type: "YouTube";
  id: string;
  isDummy?: boolean;
  data: YTChatItemData;
}

export interface AppChatItemData {
  type: "error" | "info" | "log";
  message: string;
  timestamp: Date;
}
interface AppChatItem {
  type: "App";
  id: string;
  data: AppChatItemData;
}

export interface LiveChat {
  url: string; // 入力
  metaData: MetadataItem; // 配信情報
  ytLiveChat: YTLiveChat; // api
  isStarted: boolean; // 取得を開始しているか
}

export const liveChatService = {
  parseYTLiveId: (url: string): { channelId: string } | {liveId: string} => {
    let watchId = url.match(/watch\?.*v=([A-z0-9_-]+)(&|$)/);
    let channelId =
      url.match(/channel\/([A-z0-9_-]+)(\?|$)/)
      || url.match(/c\/([A-z0-9_-]+)(\?|$)/);
    if (watchId) {
      return { liveId: watchId[1] };
    } else if (channelId) {
      return { channelId: channelId[1] };
    }
    return { liveId: url };
  },
  createLiveChat: (url: string): LiveChat => {
    const ytLiveChat = new YTLiveChat(liveChatService.parseYTLiveId(url));
    return {
      url,
      metaData: {
        title: "",
        description: ""
      },
      ytLiveChat,
      isStarted: false,
    };
  }
}

export function createAppChatItem(
  type: AppChatItemData["type"],
  message: string,
  timestamp?: Date
): AppChatItem {
  return {
    type: "App",
    id: uuid(),
    data: {
      type,
      message,
      timestamp: timestamp || new Date()
    }
  }
}

export const dummyParts: {
  icon: ImageItem;
  badge: {
    thumbnail: ImageItem
    label: string
  };
  emoji: EmojiItem;
} = {
  icon: {
    url: "https://yt3.ggpht.com/ytc/AKedOLQNlqerhwZouTMNNVyrx23mcIWXU7m7xZy3KOzJ-w=s176-c-k-c0x00ffffff-no-rj-mo",
    alt: "チャンネルアイコン",
  },
  badge: {
    thumbnail: {
      url: `${process.env.PUBLIC_URL}/yt-dummy-badge.png`,
      alt: "Member (1 months)",
    },
    label: "Member (1 months)",
  },
  emoji: {
    url: "https://www.youtube.com/s/gaming/emoji/0f0cae22/emoji_u1f642.svg",
    alt: ":slightly_smiling_face:",
    emojiText: ":slightly_smiling_face:",
    isCustomEmoji: false,
  },
}

function getDummyYTChatItemData(
  message?: string | MessageItem[] | null,
  name?: string | null,
): YTChatItemData {
  return {
    id: uuid(),
    author: {
      name: name || "ダミー太郎",
      thumbnail: { ...dummyParts.icon },
      channelId: "UCxqaEngWUWEOiIecETprfTQ",
    },
    message: typeof message === "string"
      ? [{ text: message }]
      : message || [],
    isMembership: false,
    isVerified: false,
    isOwner: false,
    isModerator: false,
    timestamp: new Date(),
  };
}


export function createDummyYTChatItem(
  message?: string | MessageItem[] | null,
  name?: string | null,
  isMembership?: boolean,
  isOwner?: boolean,
  isModerator?: boolean,
): YTChatItem {
  const res: YTChatItem = {
    type: "YouTube",
    id: uuid(),
    isDummy: true,
    data: {
      ...getDummyYTChatItemData(message, name),
      isMembership: !!isMembership,
      isVerified: false,
      isOwner: !!isOwner,
      isModerator: !!isModerator,
    },
  };
  if (isMembership) {
    res.data.author.badge = { ...dummyParts.badge };
  }
  if (!message) {
    res.data.message = [
      { text: "これはダミーコメントです。"},
      { ...dummyParts.emoji }
    ]
  } else if (typeof message === "string") {
    res.data.message = [{ text: message }]
  } else {
    res.data.message = message;
  }
  return res;
}

export function createDummyYTSuperChatItem(
  message?: string | MessageItem[] | null,
  name?: string | null,
  amout?: string
) {
  const res: YTChatItem = {
    type: "YouTube",
    id: uuid(),
    isDummy: true,
    data: {
      ...getDummyYTChatItemData(message, name),
      superchat: {
        amount: amout || "￥610",
        color: "#1DE9B6",
        colorList: {
          headerBackgroundColor: "rgba(0, 191, 165, 1)",
          headerTextColor: "rgba(0, 0, 0, 1)",
          bodyBackgroundColor: "rgba(29, 233, 182, 1)",
          bodyTextColor: "rgba(0, 0, 0, 1)",
          authorNameTextColor: "rgba(0, 0, 0, 0.5411764705882353)",
        }
      }
    }
  }
  return res;
}

export function createDummyYTStickerItem(name?: string | null, amout?: string) {
  const res: YTChatItem = {
    type: "YouTube",
    id: uuid(),
    isDummy: true,
    data: {
      ...getDummyYTChatItemData(null, name),
      superchat: {
        amount: amout || "￥200",
        color: "#00E5FF",
        sticker: {
          url: "https://lh3.googleusercontent.com/whWdCHvpK52qWkxadxxRiATHijar8KkJZCHtmwa3KeLyzf1hT3jqIGKE5FTJvvrmWWxneg1CGQ7VuQ624HKy=s148-rwa",
          alt: "none"
        },
        colorList: {
          authorNameTextColor: "rgba(0, 0, 0, 0.701961)",
          backgroundColor: "rgba(0, 229, 255, 1)",
        },
      },
    },
  }
  return res;
}

export function createDummyYTGiftItem(name?: string | null) {
  const res: YTChatItem = {
    type: "YouTube",
    id: uuid(),
    isDummy: true,
    data: {
      ...getDummyYTChatItemData(null, name),
      membershipGift: {
        message: [
          { text: "10" },
          { text: " 件の " },
          { text: "■■■■" },
          { text: " のメンバーシップ ギフトを贈りました" },
        ]
      }
    },
  }
  return res;
}

export function createDummyYTMembershipItem(name?: string | null, isFirst: boolean = true) {
  const res: YTChatItem = {
    type: "YouTube",
    id: uuid(),
    isDummy: true,
    data: {
      ...createDummyYTChatItem(null, name, true).data,
      message: isFirst ? [] : [{ text: "これはメンバー継続メッセージ" }],
      membership: isFirst
        ? {
          text: [
            { text: "■■■■" },
            { text: " へようこそ！" }
          ]
        }
        : {
          text: [
            { "text": "メンバー歴 " },
            { "text": "2" },
            { "text": " か月" }
          ]
        }
    },
  }
  return res;
}

export function ytMessageToString(ytMessage: MessageItem[], includeEmoji: boolean = false) {
  let res = "";
  for (const item of ytMessage) {
    const t = item as { text: string };
    const emoji = item as EmojiItem;
    if (t.text) {
      res +=  t.text;
    } else if (emoji.emojiText && includeEmoji) {
      res += emoji.emojiText;
    }
  }
  return res;
}