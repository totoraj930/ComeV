import {
  ChatItem as YTChatItemData,
  EmojiItem,
  ImageItem,
  MessageItem,
} from 'youtube-chat-tauri/dist/types/data';
import styled from 'styled-components';
import { ChatItem, AppChatItemData } from '../services/liveChatService';
import React, { useMemo } from 'react';
import {
  TwitchNormalChatItem,
  TwitchEmote,
  TwitchUser,
  TwitchCheerItem,
  TwitchCheermoteMessage,
  TwitchSubItem,
  TwitchSubMysteryGiftItem,
} from '../utils/twitch';

export interface ChatItemViewOptions {
  showTime?: boolean;
  showAuthorName?: boolean;
  showAuthorIcon?: boolean;
  showAuthorBadge?: boolean;
}

const AuthorIcon: React.FC<{
  imageItem?: ImageItem;
}> = ({ imageItem }) => {
  return !imageItem ? (
    <div className="icon no-image"></div>
  ) : (
    <img className="icon" src={imageItem.url} alt={imageItem.alt} />
  );
};

const YTChatMessage: React.FC<{
  items: MessageItem[];
}> = ({ items }) => {
  if (items.length <= 0) return <></>;

  return (
    <p className="message">
      {items.map((item, i) => {
        const text = item as { text: string };
        const emoji = item as EmojiItem;
        if (text.text) {
          return <span key={i}>{text.text}</span>;
        } else if (emoji.emojiText) {
          if (emoji.url) {
            return (
              <img className="emoji" src={emoji.url} alt={emoji.alt} key={i} />
            );
          } else {
            return (
              <span className="emoji" key={i}>
                {emoji.emojiText}
              </span>
            );
          }
        }
        return '';
      })}
    </p>
  );
};

const convertTime = (date: Date) => {
  const h = ('0' + date.getHours()).slice(-2);
  const m = ('0' + date.getMinutes()).slice(-2);
  const s = ('0' + date.getSeconds()).slice(-2);
  return `${h}:${m}:${s}`;
};

// YouTubeのチャット
const YTChatItemView: React.FC<{
  data: YTChatItemData;
}> = ({ data }) => {
  return (
    <Item data-type="YouTube">
      <p className="time">{convertTime(data.timestamp)}</p>
      <NormalChat>
        <div
          className="author"
          data-is-member={data.isMembership}
          data-is-owner={data.isOwner}
          data-is-moderator={data.isModerator}
        >
          <AuthorIcon imageItem={data.author.thumbnail} />
          <p className="name" title={data.author.name}>
            {data.author.name}
            {data.author.badge && (
              <img
                className="badge"
                src={data.author.badge.thumbnail.url}
                alt={data.author.badge.thumbnail.alt}
                title={data.author.badge.label}
              />
            )}
          </p>
        </div>
        <YTChatMessage items={data.message} />
      </NormalChat>
    </Item>
  );
};

// YouTubeのスーパーチャット
const YTSuperChatItemView: React.FC<{
  data: YTChatItemData;
}> = ({ data }) => {
  if (!data.superchat) return <></>;
  return (
    <Item data-type="YouTube">
      <p className="time">{convertTime(data.timestamp)}</p>
      <SuperChat style={{ borderColor: data.superchat.color }}>
        <div
          className="author"
          data-is-member={data.isMembership}
          data-is-owner={data.isOwner}
          data-is-moderator={data.isModerator}
        >
          <AuthorIcon imageItem={data.author.thumbnail} />
          <div>
            <p className="name" title={data.author.name}>
              <span>{data.author.name}</span>
              {data.author.badge && (
                <img
                  className="badge"
                  src={data.author.badge.thumbnail.url}
                  alt={data.author.badge.thumbnail.alt}
                  title={data.author.badge.label}
                />
              )}
            </p>
            <p className="amount">{data.superchat.amount}</p>
          </div>
        </div>

        <YTChatMessage items={data.message} />
        {data.superchat.sticker && (
          <img
            className="sticker"
            src={data.superchat.sticker.url}
            alt={data.superchat.sticker.alt}
          />
        )}
      </SuperChat>
    </Item>
  );
};

// YouTubeのメンバーシップ
const YTMembershipItemView: React.FC<{
  data: YTChatItemData;
}> = ({ data }) => {
  if (!data.membership) return <></>;
  return (
    <Item data-type="YouTube">
      <p className="time">{convertTime(data.timestamp)}</p>
      <SuperChat style={{ borderColor: 'var(--c-member-body-bg)' }}>
        <div
          className="author"
          data-is-member={data.isMembership}
          data-is-owner={data.isOwner}
          data-is-moderator={data.isModerator}
        >
          <AuthorIcon imageItem={data.author.thumbnail} />
          <div>
            <p className="name" title={data.author.name}>
              <span>{data.author.name}</span>
              {data.author.badge && (
                <img
                  className="badge"
                  src={data.author.badge.thumbnail.url}
                  alt={data.author.badge.thumbnail.alt}
                  title={data.author.badge.label}
                />
              )}
            </p>
            <YTChatMessage items={data.membership.text} />
          </div>
        </div>

        <YTChatMessage items={data.message} />
      </SuperChat>
    </Item>
  );
};

// メンバーシップギフト

const YTMembershipGiftView: React.FC<{
  data: YTChatItemData;
}> = ({ data }) => {
  const bgImage = useMemo(() => {
    return `url(${
      data.membershipGift?.image?.url ||
      'https://www.gstatic.com/youtube/img/sponsorships/sponsorships_gift_purchase_announcement_artwork.png'
    })`;
  }, [data]);
  if (!data.membershipGift) return <></>;
  return (
    <Item data-type="YouTube">
      <p className="time">{convertTime(data.timestamp)}</p>
      <SuperChat
        style={{
          borderColor: 'var(--c-member-body-bg)',
          backgroundImage: bgImage,
        }}
      >
        <div
          className="author"
          data-is-member={data.isMembership}
          data-is-owner={data.isOwner}
          data-is-moderator={data.isModerator}
        >
          <AuthorIcon imageItem={data.author.thumbnail} />
          <div>
            <p className="name" title={data.author.name}>
              <span>{data.author.name}</span>
              {data.author.badge && (
                <img
                  className="badge"
                  src={data.author.badge.thumbnail.url}
                  alt={data.author.badge.thumbnail.alt}
                  title={data.author.badge.label}
                />
              )}
            </p>
            <p className="message">メンバーシップ ギフト</p>
          </div>
        </div>
        <YTChatMessage items={data.membershipGift.message} />
      </SuperChat>
    </Item>
  );
};

const TTVAuthor: React.FC<{
  author: TwitchUser;
  children?: React.ReactNode;
}> = ({ author, children }) => {
  return (
    <>
      <div
        className="author"
        data-is-member={author.isSubscriber}
        data-is-moderator={author.isModerator}
      >
        {author.badges.map((badge, i) => {
          if (!badge.url) return '';
          return (
            <img
              className="ttv-badge"
              src={badge.url}
              alt={badge.info || ''}
              key={i}
            />
          );
        })}
        <p className="name" title={author.name}>
          {author.displayName || author.name}
        </p>
        {children}
      </div>
    </>
  );
};

const TTVChatMessage: React.FC<{
  items: (TwitchCheermoteMessage | TwitchEmote | string)[];
}> = ({ items }) => {
  return (
    <p className="message">
      {items.map((item, i) => {
        if (typeof item === 'string') {
          return <span key={i}>{item}</span>;
        } else if ('bits' in item) {
          const cheer = item.cheermote;
          return (
            <span className="bits" key={i}>
              <img src={cheer.animated_url.dark} alt="bits" />
              <span style={{ color: cheer.color }}>{item.bits}</span>
            </span>
          );
        } else {
          return (
            <img
              className="emoji"
              src={item.animated_url || item.url}
              alt={item.name}
              key={i}
            />
          );
        }
      })}
    </p>
  );
};

// TwitchNormal
const TTVChatItemView: React.FC<{
  data: TwitchNormalChatItem;
}> = ({ data }) => {
  return (
    <Item data-type="Twitch">
      <p className="time">{convertTime(data.timestamp)}</p>
      <NormalChat data-is-highlight={!!data.isHighlight}>
        <TTVAuthor author={data.author}></TTVAuthor>
        <TTVChatMessage items={data.message} />
      </NormalChat>
    </Item>
  );
};

// TwitchCheer
const TTVCheerItemView: React.FC<{
  data: TwitchCheerItem;
}> = ({ data }) => {
  return (
    <Item data-type="Twitch">
      <p className="time">{convertTime(data.timestamp)}</p>

      <SuperChat style={{ borderColor: 'var(--c-twitch-cheer)' }}>
        <TTVAuthor author={data.author} />
        <p className="amount-bits">
          {data.bits} <span>Bits</span>
        </p>
        <TTVChatMessage items={data.message} />
      </SuperChat>
    </Item>
  );
};

// TwitchSub
const TTVSubItemView: React.FC<{
  data: TwitchSubItem;
}> = ({ data }) => {
  return (
    <Item data-type="Twitch">
      <p className="time">{convertTime(data.timestamp)}</p>

      <SuperChat style={{ borderColor: 'var(--c-member-body-bg)' }}>
        <TTVAuthor author={data.author}></TTVAuthor>

        <p className="message fw-b">
          {data.methods.prime && 'Primeで'}
          サブスクしました
        </p>
      </SuperChat>
    </Item>
  );
};

// TwitchSub
const TTVSubGiftItemView: React.FC<{
  data: TwitchSubMysteryGiftItem;
}> = ({ data }) => {
  return (
    <Item data-type="Twitch">
      <p className="time">{convertTime(data.timestamp)}</p>

      <SuperChat style={{ borderColor: 'var(--c-member-body-bg)' }}>
        <TTVAuthor author={data.author} />

        <p className="message fw-b">
          <span>{data.num}</span> 個のサブスクギフト
        </p>
      </SuperChat>
    </Item>
  );
};

// システム通知
const AppChatItemView: React.FC<{
  data: AppChatItemData;
}> = ({ data }) => {
  return (
    <Item>
      <p className="time">{convertTime(data.timestamp)}</p>
      <p className="app-message" data-type={data.type}>
        {data.message}
      </p>
    </Item>
  );
};

export const ChatItemView: React.FC<{
  chatItem: ChatItem;
  options?: ChatItemViewOptions;
}> = ({
  chatItem,
  options = {
    showTime: true,
    showAuthorName: true,
    showAuthorBadge: true,
    showAuthorIcon: true,
  },
}) => {
  if (chatItem.type === 'YouTube') {
    if (chatItem.data.superchat) {
      return <YTSuperChatItemView data={chatItem.data} />;
    } else {
      if (chatItem.data.membership) {
        return <YTMembershipItemView data={chatItem.data} />;
      } else if (chatItem.data.membershipGift) {
        return <YTMembershipGiftView data={chatItem.data} />;
      }
      return <YTChatItemView data={chatItem.data} />;
    }
  } else if (chatItem.type === 'App') {
    return <AppChatItemView data={chatItem.data} />;
  } else if (chatItem.type === 'Twitch') {
    switch (chatItem.data.type) {
      case 'Normal': {
        return <TTVChatItemView data={chatItem.data} />;
      }
      case 'Cheer': {
        return <TTVCheerItemView data={chatItem.data} />;
      }
      case 'Sub': {
        return <TTVSubItemView data={chatItem.data} />;
      }
      case 'SubGift': {
        break;
      }
      case 'SubMysteryGift': {
        return <TTVSubGiftItemView data={chatItem.data} />;
      }
    }
  }
  return <></>;
};

const Item = styled.div`
  display: flex;
  align-items: center;
  padding: 6px 10px;
  gap: 0 5px;
  border-bottom: 1px solid var(--c-border-2);
  position: relative;
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    pointer-events: none;
  }
  &[data-type='Twitch']:before {
    background-color: var(--c-mark-twitch);
  }
  &[data-type='YouTube']:before {
    background-color: var(--c-mark-youtube);
  }

  .time {
    font-size: 14px;
    color: var(--c-text-2);
  }

  .app-message {
    &[data-type='error'] {
      color: var(--c-text-warn);
    }
    &[data-type='log'] {
      color: var(--c-text-2);
    }
  }
  @media screen and (max-width: 550px) {
    padding: 6px 6px;
    .time {
      font-size: 11px;
    }
  }
  @media screen and (max-width: 400px) {
    .time {
      display: none;
    }
  }
`;

const SuperChat = styled.div`
  display: flex;
  flex: 1;
  padding: 10px;
  gap: 10px;
  flex-direction: column;
  border-radius: 10px;
  border-width: 0 10px;
  border-style: solid;
  background-color: var(--c-superchat-bg);
  background-position: right 10px top 10px;
  background-size: 50px;
  background-repeat: no-repeat;
  color: var(--c-superchat-c);
  .author {
    display: flex;
    align-items: center;
    .ttv-badge {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
      margin-right: 5px;
    }
    .name {
      display: flex;
      align-items: center;
      font-weight: normal;
      .badge {
        width: 18px;
        height: 18px;
        margin-left: 5px;
        background-color: var(--c-main);
      }
    }
    .amount {
      font-size: 16px;
      font-weight: bold;
    }
    .message {
      font-size: 15px;
      font-weight: bold;
    }
    .icon {
      width: 50px;
      height: 50px;
      min-width: 50px;
      min-height: 50px;
      /* border: 2px solid var(--c-border-2); */
      margin-right: 10px;
      border-radius: 50%;
      overflow: hidden;
      font-size: 10px;
      background-color: var(--c-sub);
    }
  }
  .amount-bits {
    font-weight: bold;
    font-size: 16px;
    span {
      font-size: 14px;
    }
  }
  .message {
    font-size: 15px;
    overflow-wrap: anywhere;
    .emoji {
      display: inline-block;
      width: 24px;
      height: auto;
      margin-left: 4px;
      vertical-align: middle;
    }
    span.emoji {
      width: auto;
      height: auto;
      font-size: 24px;
    }
    .bits {
      display: inline-flex;
      align-items: center;
      vertical-align: middle;
      img {
        width: 24px;
        height: 24px;
      }
      span {
        font-weight: bold;
      }
    }
  }
  .sticker {
    width: 80px;
    height: 80px;
  }
  @media screen and (max-width: 400px) {
    .author {
      .icon {
        width: 32px;
        height: 32px;
        min-width: 32px;
        min-height: 32px;
      }
      .name {
        font-size: 14px;
      }
      .amount {
        font-size: 15px;
      }
      .message {
        font-size: 14px;
      }
    }
  }
`;

const NormalChat = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 0 5px;
  flex: 1;
  .author {
    display: flex;
    align-items: center;
    gap: 5px;
    color: var(--c-text-2);
    width: 180px;
    min-width: 180px;
    &[data-is-member='true'] {
      color: var(--c-text-member);
    }
    &[data-is-moderator='true'] {
      color: var(--c-text-moderator);
    }
    &[data-is-owner='true'] {
      color: var(--c-text-owner);
    }
    .icon {
      width: 26px;
      height: 26px;
      border: 1px solid var(--c-border-2);
      border-radius: 50%;
      overflow: hidden;
      font-size: 10px;
      background-color: var(--c-sub);
      flex-shrink: 0;
    }
    .ttv-badge {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }
    .name {
      position: relative;
      font-size: 13px;
      font-weight: normal;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
      flex-grow: 1;
      flex-shrink: 1;
      .badge {
        position: absolute;
        top: 50%;
        right: 0;
        width: 16px;
        height: 16px;
        margin-top: -8px;
        background-color: var(--c-main);
      }
    }
  }
  .message {
    font-size: 15px;
    overflow-wrap: anywhere;
    span {
      display: inline;
      vertical-align: middle;
    }
    .emoji {
      display: inline-block;
      width: 24px;
      height: auto;
      margin-left: 4px;
      vertical-align: middle;
    }
    .bits {
      display: inline-flex;
      align-items: center;
      img {
        width: 24px;
        height: 24px;
      }
      span {
        font-weight: bold;
      }
    }
    span.emoji {
      width: auto;
      height: auto;
      font-size: 24px;
    }
  }
  &[data-is-highlight='true'] {
    .message {
      span {
        border-bottom: 2px solid var(--c-accent-1);
      }
    }
  }
  @media screen and (max-width: 550px) {
    .author {
      width: 130px;
      min-width: 130px;
      .icon {
        width: 20px;
        height: 20px;
      }
      .ttv-badge {
        width: 16px;
        height: 16px;
      }
    }
  }
  @media screen and (max-width: 450px) {
    .author {
      width: 100px;
      min-width: 100px;
      .icon {
        width: 16px;
        height: 16px;
      }
    }
  }
  @media screen and (max-width: 400px) {
    .author {
      width: 100px;
      min-width: 100px;
      .name {
        font-size: 11px;
        /* display: none; */
      }
    }
    .message {
      font-size: 13px;
    }
  }
`;
