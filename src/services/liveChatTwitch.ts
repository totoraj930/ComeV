import { ChatItemAction } from "../context/chatItem";
import { AppConfig, BouyomiConfig } from "../context/config";
import { LiveChatContextAction } from "../context/liveChat";
import { sendBouyomiText } from "../utils/bouyomi";
import { TwitchBadge, TwitchChat, TwitchChatItem, TwitchItemBase, TwitchMessageItem, TwitchUser } from "../utils/twitch";
import { uuid } from "../utils/uuid";
import { createAppChatItem, LiveChatBase, LiveChatMetaData, TTVChatItem } from "./liveChatService";

export interface TwitchMetaData extends LiveChatMetaData {

}

// Twitch用
export interface LiveChatTwitch extends LiveChatBase {
  type: "Twitch";
  api: TwitchChat;
  metaData: TwitchMetaData; // TODO: 実装して
}

export function createLiveChatTwitch(
  id: string, urlStr: string, config: AppConfig
): LiveChatTwitch | null {
  const channelId = parseTwitchUrl(urlStr);
  if (!channelId) return null;
  const api = new TwitchChat({
    token: config.twitch.token,
    clientId: config.twitch.clientId,
    name: "ComeV"
  });
  return {
    id,
    api,
    url: urlStr,
    type: "Twitch",
    isStarted: false,
    metaData: {}
  };
}

export function isTwitchUrl(urlStr: string) {
  const url = new window.URL(urlStr);
  if (url.hostname.match(/^([0-9A-z]+\.|)(twitch\.tv)/)) {
    return true;
  }
  return false;
}

export function parseTwitchUrl(urlStr: string) {
  if (!isTwitchUrl(urlStr)) return null;
  const url = new window.URL(urlStr);
  const parts = url.pathname.split("/");
  return parts[1] || null;
}

export function ttvMessageToString(
  items: TwitchMessageItem[],
  includeEmote: boolean = false
) {
  let text = "";
  for (const item of items) {
    if (typeof item === "string") {
      text += item;
    }
    else if ("bits" in item) {

    }
    else {
      text += includeEmote
        ? `:${item.name}:`
        : "";
    }
  }
  return text;
}

export function generateBouyomiText(
  item: TwitchChatItem,
  config: BouyomiConfig,
) {
  let res = config.twitch.normal;
  let message = "";
  switch (item.type) {
    case "Normal": {
      message = ttvMessageToString(item.message, config.includeEmoji);
      break;
    }
    case "Cheer": {
      res = config.twitch.cheer
        .replace(/\$\(Amount\)/g, item.bits + "");
      message = ttvMessageToString(item.message, false);
      break;
    }
    case "Sub": {
      res = item.methods.prime
        ? config.twitch.subPrime
        : config.twitch.sub;
      break;
    }
    case "SubMysteryGift": {
      res = config.twitch.subGift
        .replace(/\$\(GiftNum\)/g, item.num + "");
      break;
    }
  }
  const name = item.author.displayName || item.author.name || "";
  res = res
    .replace(/\$\(Message\)/g, message)
    .replace(/\$\(Name\)/g, name);
  return res;
}

export function sendBouyomiTTV(item: TwitchChatItem, config: BouyomiConfig) {
  const text = generateBouyomiText(item, config);
  if (text.length <= 0) return;
  sendBouyomiText(text, config);
}

export function initTwitchListener(
  liveChat: LiveChatTwitch,
  settings: AppConfig,
  dispatch: React.Dispatch<LiveChatContextAction>,
  dispatchChatItem: React.Dispatch<ChatItemAction>,
  isFirst: boolean
) {
  liveChat.api.removeAllListeners();

  liveChat.api.on("start", (channel) => {
    liveChat.isStarted = true;
    dispatchChatItem({
      config: settings,
      type: "ADD",
      actionId: uuid(),
      chatItem: [createAppChatItem("info", `接続しました(${channel})`)]
    });
    dispatch({
      type: "UPDATE",
      targetId: liveChat.id,
      liveChat: {...liveChat}
    });
  });

  liveChat.api.on("end", () => {
    liveChat.isStarted = false;
    dispatchChatItem({
      config: settings,
      type: "ADD",
      actionId: uuid(),
      chatItem: [createAppChatItem("info", "切断しました")]
    });
    dispatch({
      type: "UPDATE",
      targetId: liveChat.id,
      liveChat: {...liveChat}
    });
  });

  liveChat.api.on("chat", (item) => {
    // console.log(item);
    if (settings.bouyomi.enable) {
      sendBouyomiTTV(item, settings.bouyomi);
    }
    dispatchChatItem({
      config: settings,
      type: "ADD",
      unique: false,
      useBouyomi: settings.bouyomi.enable,
      actionId: uuid(),
      chatItem: [{
        type: "Twitch",
        id: item.id,
        data: item
      }]
    });
  });

  liveChat.api.on("metadata", (item) => {
    const metaData: TwitchMetaData = {
      title: item.title,
      viewership: item.viewer_count + "",
    };
    liveChat.metaData = {...liveChat.metaData, ...metaData};

    dispatch({
      type: "UPDATE",
      targetId: liveChat.id,
      liveChat: {...liveChat}
    });
  });
}

const dummyBadges = [
  {
    "set_id": "premium",
    "version_id": "1",
    "url": "https://static-cdn.jtvnw.net/badges/v1/bbbe0db0-a598-423e-86d0-f9fb98ca1933/3",
    "versions": []
  },
  {
    "set_id": "bits",
    "version_id": "100",
    "url": "https://static-cdn.jtvnw.net/badges/v1/09d93036-e7ce-431c-9a9e-7044297133f2/3",
    "versions": []
  }
];

const dummyEmotes = [
  {
    id: "425618",
    name: "LUL",
    url: "https://static-cdn.jtvnw.net/emoticons/v2/425618/default/light/2.0"
  }
]

const dummyCheermotes = [
  {
    "bits": 100,
    "cheermote": {
      "id": "100",
      "min_bits": 100,
      "color": "#9c3ee8",
      "url": {
        "dark": "https://d3aqoihi2n8ty8.cloudfront.net/actions/cheer/dark/static/100/4.png",
        "light": "https://d3aqoihi2n8ty8.cloudfront.net/actions/cheer/light/static/100/4.png"
      },
      "animated_url": {
        "dark": "https://d3aqoihi2n8ty8.cloudfront.net/actions/cheer/dark/animated/100/4.gif",
        "light": "https://d3aqoihi2n8ty8.cloudfront.net/actions/cheer/light/animated/100/4.gif"
      }
    }
  }
];

function generateDummyAuthor(): TwitchUser {
  const badges: TwitchBadge[] = [];
  const r = (t?: number) => Math.random() < (t || 0.5);
  for (let i = 0; i < 2; i++) {
    if (r(0.3)) {
      badges.push({...dummyBadges[i]});
    }
  }
  return {
    id: uuid(),
    name: "dummy_taro",
    displayName: "ダミー太郎",
    badges,
    isSubscriber: r(0.3),
    isModerator: r(0.2),
    isTurbo: false,
  };
}

export function generateDummy(
  type: TwitchChatItem["type"]
): TwitchChatItem {
  const base: TwitchItemBase = {
    id: uuid(),
    type: "",
    author: generateDummyAuthor(),
    timestamp: new Date()
  };
  const r = (t?: number) => Math.random() < (t || 0.5);
  switch (type) {
    case "Normal": {
      return {
        ...base,
        type: "Normal",
        message: [
          "これはダミーです",
          dummyEmotes[0]
        ]
      }
    }
    case "Cheer": {
      return {
        ...base,
        type: "Cheer",
        bits: 300,
        message: [
          "",
          { ...dummyCheermotes[0] },
          " ",
          { ...dummyCheermotes[0] },
          " これはダミーのCheer",
          { ...dummyCheermotes[0] }
        ]
      }
    }
    case "Sub": {
      const isPrime = r();
      return {
        ...base,
        type: "Sub",
        message: "",
        methods: {
          plan: isPrime ? "Prime" : "1000",
          prime: isPrime
        }
      }
    }
    case "SubMysteryGift": {
      return {
        ...base,
        type: "SubMysteryGift",
        num: 10,
        methods: {
          plan: "1000",
          prime: false
        }
      }
    }
  }
  return {
    id: uuid(),
    type: "Normal",
    author: generateDummyAuthor(),
    message: [""],
    timestamp: new Date(),
  }
}