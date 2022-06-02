import { ChatItem as YTChatItemData, EmojiItem, ImageItem, MessageItem } from "youtube-chat-tauri/dist/types/data";
import styled from "styled-components";
import { ChatItem, AppChatItemData, dummyParts } from "../services/liveChatService";
import { useSettings } from "../hooks/useSettings";

export interface ChatItemViewOptions {
  showTime?: boolean;
  showAuthorName?: boolean;
  showAuthorIcon?: boolean;
  showAuthorBadge?: boolean;
}

const AuthorIcon: React.VFC<{
  imageItem?: ImageItem;
}> = ({ imageItem }) => {
  return !imageItem
    ? <div className="icon no-image"></div>
    : <img className="icon" src={imageItem.url} alt={imageItem.alt} />;
}

const YTChatMessage: React.VFC<{
  items: MessageItem[]
}> = ({ items }) => {

  return <p className="message">
    {items.map((item, i) => {
      const text = (item as { text: string });
      const emoji = (item as EmojiItem);
      if (text.text) {
        return <span key={i}>{text.text}</span>;
      } else if (emoji.emojiText) {
        if (emoji.url) {
          return <img className="emoji" src={emoji.url} alt={emoji.alt} key={i} />
        } else {
          return <span className="emoji">{emoji.emojiText}</span>
        }
      }
      return '';
    })}
  </p>;
}


const convertTime = (date: Date) => {
  const h = ('0' + date.getHours()).slice(-2);
  const m = ('0' + date.getMinutes()).slice(-2);
  const s = ('0' + date.getSeconds()).slice(-2);
  return `${h}:${m}:${s}`;
}

// YouTubeのチャット
const YTChatItemView: React.VFC<{
  data: YTChatItemData;
}> = ({ data }) => {
  return <Item>
  <p className="time">
    {convertTime(data.timestamp)}
  </p>
  <NormalChat>
    <div className="author"
        data-is-member={data.isMembership}
        data-is-owner={data.isOwner}
        data-is-moderator={data.isModerator}>
        <AuthorIcon imageItem={data.author.thumbnail} />
        <p className="name" title={data.author.name}>
            {data.author.name}
            {data.author.badge && (
              <img
                className="badge"
                src={data.author.badge.thumbnail.url}
                alt={data.author.badge.thumbnail.alt}
                title={data.author.badge.label} />
            )}
        </p>
    </div>
    <YTChatMessage items={data.message} />
  </NormalChat>
</Item>;
}

// YouTubeのスーパーチャット
const YTSuperChatItemView: React.VFC<{
  data: YTChatItemData;
}> = ({ data }) => {
  if (!data.superchat) return <></>;
  return <Item>
    <p className="time">
      {convertTime(data.timestamp)}
    </p>
    <SuperChat style={{ borderColor: data.superchat.color }}>
      <div className="author"
          data-is-member={data.isMembership}
          data-is-owner={data.isOwner}
          data-is-moderator={data.isModerator}>
          <AuthorIcon imageItem={data.author.thumbnail} />
          <div>
            <p className="name" title={data.author.name}>
                <span>{data.author.name}</span>
                {data.author.badge && (
                  <img
                    className="badge"
                    src={data.author.badge.thumbnail.url}
                    alt={data.author.badge.thumbnail.alt}
                    title={data.author.badge.label} />
                )}
            </p>
            <p className="amout">
              {data.superchat.amount}
            </p>
          </div>
      </div>

      <YTChatMessage items={data.message} />
    </SuperChat>
  </Item>;
}

// システム通知
const AppChatItemView: React.VFC<{
  data: AppChatItemData;
}> = ({ data }) => {
  return <Item>
    <p className="time">
      { convertTime(data.timestamp) }
    </p>
    <p className="app-message" data-type={data.type}>
      { data.message }
    </p>
  </Item>;
};

export const ChatItemView: React.VFC<{
  chatItem: ChatItem;
  options?: ChatItemViewOptions;
}> = ({ chatItem, options = {showTime: true, showAuthorName: true, showAuthorBadge: true, showAuthorIcon: true} }) => {

  if (chatItem.type === "YouTube") {
    if (chatItem.data.superchat) {
      return <YTSuperChatItemView data={chatItem.data} />
    } else {
      return <YTChatItemView data={chatItem.data} />;
    }
  } else if (chatItem.type === "App") {
    return <AppChatItemView data={chatItem.data} />;
  }
  return <></>;
}



const Item = styled.div`
  display: flex;
  align-items: center;
  padding: 6px 10px;
  gap: 0 5px;
  border-bottom: 1px solid var(--c-border-2);


  .time {
    font-size: 14px;
    color: var(--c-text-2);
  }

  .app-message {
    &[data-type=error] {
      color: var(--c-text-warn);
    }
    &[data-type=log] {
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
  background: var(--c-superchat-bg);
  color: var(--c-superchat-c);
  .author {
    display: flex;
    align-items: center;
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
    .amout {
      font-size: 16px;
      font-weight: bold;
    }
    .icon {
      width: 50px;
      height: 50px;
      /* border: 2px solid var(--c-border-2); */
      margin-right: 10px;
      border-radius: 50%;
      overflow: hidden;
      font-size: 10px;
      background-color: var(--c-sub);
    }
  }
  .message {
    font-size: 15px;
    overflow-wrap: anywhere;
    .emoji {
      display: inline-block;
      width: 24px;
      height: 24px;
      margin-left: 4px;
      vertical-align: middle;
    }
    span.emoji {
      width: auto;
      height: auto;
      font-size: 24px;
    }
  }
  @media screen and (max-width: 400px) {
    .author {
      .icon {
        width: 40px;
        height: 40px;
      }
      .name {
        font-size: 14px;
      }
      .amout {
        font-size: 15px;
      }
    }
  }
`;

const NormalChat = styled.div`
  display: flex;
  align-items: center;
  gap: 0 5px;
  flex: 1;
  .author {
    display: flex;
    align-items: center;
    gap: 5px;
    color: var(--c-text-2);
    &[data-is-member=true] {
      color: var(--c-text-member);
    }
    &[data-is-moderator=true] {
      color: var(--c-text-moderator);
    }
    &[data-is-owner=true] {
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
    }
    .name {
      position: relative;
      width: 150px;
      font-size: 13px;
      font-weight: normal;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
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
    .emoji {
      display: inline-block;
      width: 24px;
      height: 24px;
      margin-left: 4px;
      vertical-align: middle;
    }
    span.emoji {
      width: auto;
      height: auto;
      font-size: 24px;
    }
  }
  @media screen and (max-width: 550px) {
    .author {
      .icon {
        width: 20px;
        height: 20px;
      }
      .name {
        width: 90px;
      }
    }
  }
  @media screen and (max-width: 450px) {
    .author {
      .icon {
        width: 16px;
        height: 16px;
      }
      .name {
        width: 80px;
      }
    }
  }
  @media screen and (max-width: 400px) {
    .author {
      .name {
        width: 60px;
        font-size: 11px;
        /* display: none; */
      }
    }
  }
`;