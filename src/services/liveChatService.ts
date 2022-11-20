import {
  ChatItem as YTChatItemData,
  EmojiItem,
  ImageItem,
  MessageItem,
} from 'youtube-chat-tauri/dist/types/data';
import { LiveChat as YTLiveChat } from 'youtube-chat-tauri';
import { uuid } from '../utils/uuid';
import { TwitchChat, TwitchChatItem } from '../utils/twitch';
import { TwitchConfig } from '../context/config';
import { LiveChatYouTube } from './liveChatYouTube';
import { LiveChatTwitch } from './liveChatTwitch';

export type ChatItem = YTChatItem | AppChatItem | TTVChatItem;

export interface YTChatItem {
  type: 'YouTube';
  id: string;
  isDummy?: boolean;
  data: YTChatItemData;
}

export interface TTVChatItem {
  type: 'Twitch';
  id: string;
  isDummy?: boolean;
  data: TwitchChatItem;
}

export interface AppChatItemData {
  type: 'error' | 'info' | 'log';
  message: string;
  timestamp: Date;
}
interface AppChatItem {
  type: 'App';
  id: string;
  data: AppChatItemData;
}

// export interface LiveChat {
//   url: string; // 入力
//   metaData: MetadataItem; // 配信情報
//   ytLiveChat: YTLiveChat; // api
//   isStarted: boolean; // 取得を開始しているか
// }

// LiveChatBaseを継承したやつ
export type LiveChat = LiveChatYouTube | LiveChatTwitch | LiveChatEmpty;

export interface LiveChatMetaData {
  title?: string;
  description?: string;
  viewership?: string;
}
export interface LiveChatBase {
  id: string;
  url: string;
  isStarted: boolean;
  isLoading: boolean;
  type: string;
  metaData: LiveChatMetaData;
}

export interface LiveChatEmpty extends LiveChatBase {
  type: 'Empty';
}

export function createLiveChatEmpty(id: string, url: string): LiveChatEmpty {
  return {
    id,
    url,
    isStarted: false,
    isLoading: false,
    type: 'Empty',
    metaData: {},
  };
}

export const liveChatService = {
  parseYTLiveId: (url: string): { channelId: string } | { liveId: string } => {
    const watchId = url.match(/watch\?.*v=([A-z0-9_-]+)(&|$)/);
    const channelId =
      url.match(/channel\/([A-z0-9_-]+)(\?|$)/) ||
      url.match(/c\/([A-z0-9_-]+)(\?|$)/);
    if (watchId) {
      return { liveId: watchId[1] };
    } else if (channelId) {
      return { channelId: channelId[1] };
    }
    return { liveId: url };
  },
  createLiveChatYouTube: (id: string, url: string): LiveChatYouTube => {
    const ytLiveChat = new YTLiveChat(liveChatService.parseYTLiveId(url));
    return {
      type: 'YouTube',
      id,
      url,
      metaData: {
        title: '',
        description: '',
      },
      api: ytLiveChat,
      isStarted: false,
      isLoading: false,
    };
  },
  createLiveChatTwitch: (
    id: string,
    url: string,
    config: TwitchConfig
  ): LiveChatTwitch => {
    return {
      type: 'Twitch',
      id,
      url,
      metaData: {
        title: '',
        description: '',
      },
      api: new TwitchChat({
        token: config.token,
        clientId: config.clientId,
        name: '',
      }),
      isStarted: false,
      isLoading: false,
    };
  },
};

export function createAppChatItem(
  type: AppChatItemData['type'],
  message: string,
  timestamp?: Date
): AppChatItem {
  return {
    type: 'App',
    id: uuid(),
    data: {
      type,
      message,
      timestamp: timestamp || new Date(),
    },
  };
}

export const dummyParts: {
  icon: ImageItem;
  badge: {
    thumbnail: ImageItem;
    label: string;
  };
  emoji: EmojiItem;
} = {
  icon: {
    url: 'https://yt3.ggpht.com/ytc/AKedOLQNlqerhwZouTMNNVyrx23mcIWXU7m7xZy3KOzJ-w=s176-c-k-c0x00ffffff-no-rj-mo',
    alt: 'チャンネルアイコン',
  },
  badge: {
    thumbnail: {
      // url: `${process.env.PUBLIC_URL}/yt-dummy-badge.png`,
      url: 'https://www.youtube.com/s/gaming/emoji/0f0cae22/emoji_u1f633.svg',
      alt: 'Member (1 months)',
    },
    label: 'Member (1 months)',
  },
  emoji: {
    url: 'https://www.youtube.com/s/gaming/emoji/0f0cae22/emoji_u1f642.svg',
    alt: ':slightly_smiling_face:',
    emojiText: ':slightly_smiling_face:',
    isCustomEmoji: false,
  },
};

function getDummyYTChatItemData(
  message?: string | MessageItem[] | null,
  name?: string | null
): YTChatItemData {
  return {
    id: uuid(),
    author: {
      name: name || 'ダミー太郎',
      thumbnail: { ...dummyParts.icon },
      channelId: 'UCxqaEngWUWEOiIecETprfTQ',
    },
    message: typeof message === 'string' ? [{ text: message }] : message || [],
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
  isModerator?: boolean
): YTChatItem {
  const res: YTChatItem = {
    type: 'YouTube',
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
      { text: 'これはダミーコメントです。' },
      { ...dummyParts.emoji },
    ];
  } else if (typeof message === 'string') {
    res.data.message = [{ text: message }];
  } else {
    res.data.message = message;
  }
  return res;
}

export function createDummyYTSuperChatItem(
  message?: string | MessageItem[] | null,
  name?: string | null,
  amount?: string
) {
  const res: YTChatItem = {
    type: 'YouTube',
    id: uuid(),
    isDummy: true,
    data: {
      ...getDummyYTChatItemData(message, name),
      superchat: {
        amount: amount || '￥610',
        color: '#1DE9B6',
        colorList: {
          headerBackgroundColor: 'rgba(0, 191, 165, 1)',
          headerTextColor: 'rgba(0, 0, 0, 1)',
          bodyBackgroundColor: 'rgba(29, 233, 182, 1)',
          bodyTextColor: 'rgba(0, 0, 0, 1)',
          authorNameTextColor: 'rgba(0, 0, 0, 0.5411764705882353)',
        },
      },
    },
  };
  return res;
}

export function createDummyYTStickerItem(
  name?: string | null,
  amount?: string
) {
  const res: YTChatItem = {
    type: 'YouTube',
    id: uuid(),
    isDummy: true,
    data: {
      ...getDummyYTChatItemData(null, name),
      superchat: {
        amount: amount || '￥200',
        color: '#00E5FF',
        sticker: {
          url: 'https://lh3.googleusercontent.com/whWdCHvpK52qWkxadxxRiATHijar8KkJZCHtmwa3KeLyzf1hT3jqIGKE5FTJvvrmWWxneg1CGQ7VuQ624HKy=s148-rwa',
          alt: 'none',
        },
        colorList: {
          authorNameTextColor: 'rgba(0, 0, 0, 0.701961)',
          backgroundColor: 'rgba(0, 229, 255, 1)',
        },
      },
    },
  };
  return res;
}

export function createDummyYTGiftItem(name?: string | null) {
  const res: YTChatItem = {
    type: 'YouTube',
    id: uuid(),
    isDummy: true,
    data: {
      ...getDummyYTChatItemData(null, name),
      membershipGift: {
        message: [
          { text: '10' },
          { text: ' 件の ' },
          { text: '■■■■' },
          { text: ' のメンバーシップ ギフトを贈りました' },
        ],
        image: {
          url: 'https://www.gstatic.com/youtube/img/sponsorships/sponsorships_gift_purchase_announcement_artwork.png',
          alt: '',
        },
      },
    },
  };
  return res;
}

export function createDummyYTMembershipItem(
  name?: string | null,
  isFirst = true
) {
  const res: YTChatItem = {
    type: 'YouTube',
    id: uuid(),
    isDummy: true,
    data: {
      ...createDummyYTChatItem(null, name, true).data,
      message: isFirst ? [] : [{ text: 'これはメンバー継続メッセージ' }],
      membership: isFirst
        ? {
            text: [{ text: '■■■■' }, { text: ' へようこそ！' }],
          }
        : {
            text: [{ text: 'メンバー歴 ' }, { text: '2' }, { text: ' か月' }],
          },
    },
  };
  return res;
}

export function ytMessageToString(
  ytMessage: MessageItem[],
  includeEmoji = false
) {
  let res = '';
  for (const item of ytMessage) {
    const t = item as { text: string };
    const emoji = item as EmojiItem;
    if (t.text) {
      res += t.text;
    } else if (emoji.emojiText && includeEmoji) {
      res += emoji.emojiText;
    }
  }
  return res;
}

const dummy = {
  id: '542ca8c6-7c91-4a5f-b3ab-cdedd66cb58e',
  auther: {
    id: '123456789',
    name: 'dummy_taro',
    displayName: 'ダミー太郎',
    type: '',
    color: null,
    isSubscriber: true,
    isModerator: false,
    isTurbo: false,
    badges: [
      {
        info: '14',
        set_id: 'subscriber',
        version_id: '12',
        url: 'https://static-cdn.jtvnw.net/emoticons/v2/46/default/light/2.0',
        versions: [],
      },
      {
        set_id: 'premium',
        version_id: '1',
        url: 'https://static-cdn.jtvnw.net/badges/v1/bbbe0db0-a598-423e-86d0-f9fb98ca1933/3',
        versions: [],
      },
    ],
  },
  message: [
    'ダミーメッセージです ',
    {
      name: 'BibleThump',
      id: '86',
      url: 'https://static-cdn.jtvnw.net/emoticons/v2/86/default/light/2.0',
    },
  ],
  timestamp: new Date(),
};
