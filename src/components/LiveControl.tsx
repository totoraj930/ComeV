import { invoke as invokeOrigin } from "@tauri-apps/api";
import React, { useCallback, useState } from "react";
import { MdPause, MdPlayArrow, MdOpenInBrowser, MdDashboard, MdSettings, MdPerson, MdDeleteForever } from "react-icons/md";
import styled from "styled-components";
import { useLiveChat } from "../hooks/useLiveChat";
import { LiveChat } from "../services/liveChatService";

export const LiveControl: React.VFC<{
  liveChat: LiveChat;
}> = ({ liveChat }) => {
  const [url, setUrl] = useState<string>(liveChat.url);
  const { liveChatUpdater } = useLiveChat();

  const onChangeUrl = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    liveChatUpdater({
      type: "CHANGE_URL",
      targetId: liveChat.id,
      url: event.target.value
    });
  }, [liveChatUpdater, liveChat]);

  const onOpenInBrowser = (useAdmin: boolean = false) => {
    let url = "";
    if (liveChat.type === "YouTube") {
      const liveId = liveChat.api.liveId;
      if (liveId) {
        url = useAdmin
          ? `https://studio.youtube.com/video/${liveId}/livestreaming`
          : `https://youtube.com/watch?v=${liveId}`;
      } else {
        url = liveChat.url;
      }
    } else if (liveChat.type === "Twitch") {
      url = liveChat.url;
    } else if (liveChat.url.match(/^(http|https):\/\/.+/)) {
      url = liveChat.url;
    }

    if (url.length > 0) invokeOrigin("open_in_browser", { url });
  }

  return <Wrap>
    <Line>

      { !liveChat.isStarted && (
        <Btn1 onClick={() => liveChatUpdater({ type: "START_CHAT", targetId: liveChat.id })}>
          <MdPlayArrow className="icon" />
          <span className="hide-400">接続</span>
        </Btn1>
      )}

      { liveChat.isStarted && (
        <Btn1 className="warn" onClick={() => liveChatUpdater({ type: "STOP_CHAT", targetId: liveChat.id })}>
          <MdPause className="icon" />
          <span className="hide-400">切断</span>
        </Btn1>
      )}

      <Btn2 onClick={() => onOpenInBrowser()} title="ブラウザで開く">
        <MdOpenInBrowser className="icon" />
      </Btn2>

      <Btn2 onClick={() => onOpenInBrowser(true)} title="管理画面をブラウザで開く">
        <MdDashboard className="icon" />
      </Btn2>

      <UrlInputWrap>
        <UrlInput type="text"
          className="url-input"
          name={liveChat.id} id={liveChat.id}
          readOnly={liveChat.isStarted}
          defaultValue={url} onChange={onChangeUrl}
          placeholder="配信URL or チャンネルURL(推奨)"
        />
      </UrlInputWrap>
      
      <Btn2 className="warn" title="接続先を削除"
        onClick={() => liveChatUpdater({ type: "DELETE", targetId: liveChat.id })}>
        <MdDeleteForever className="icon" />
      </Btn2>

    </Line>

    {/* <div>
      
    <MdOpenInBrowser className="icon" />
    <MdDashboard className="icon" />
    <MdSettings className="icon" />
    <MdPerson className="icon" />
    </div> */}
  </Wrap>;
}

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
`;
const Line = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 5px;
  .hide {
    display: none;
  }
  &:hover .hide {
    display: block;
  }
`;

const UrlInputWrap = styled.div`
  position: relative;
  height: 30px;
  flex-grow: 1;
  flex-shrink: 1;
`;
const UrlInput = styled.input`
  position: absolute;
  width: 100%;
  height: 100%;
  padding: 0 7px;
  font-size: 14px;
  background: var(--c-input-bg);
  color: var(--c-input-c);
  border: 1px solid var(--c-input-bd);
  border-radius: 4px;
  box-shadow: inset 0 0 3px var(--c-input-s);
  min-width: 0;
  &:focus {
    outline: 1px solid var(--c-input-c);
  }
  &:read-only {
    color: var(--c-input-c-2)
  }
  &:read-only:focus {
    outline: none;
  }
`;

const Btn1 = styled.button`
  display: flex;
  height: 30px;
  align-items: center;
  padding: 10px;
  .icon {
    width: 20px;
    height: 20px;
  }
  span {
    margin: 0 8px;
    text-align: left;
  }
  background: var(--c-btn-1-bg);
  color: var(--c-btn-1-c);
  border-radius: 100px;
  font-size: 14px;
  &:hover {
    background: var(--c-btn-1-bg-2);
    color: var(--c-btn-1-c-2);
    cursor: pointer;
  }
  &.warn {
    background: var(--c-btn-2-bg);
    color: var(--c-btn-2-c);
    border-radius: 100px;
    font-size: 14px;
    &:hover {
      background: var(--c-btn-2-bg-2);
      color: var(--c-btn-2-c-2);
      cursor: pointer;
    }
  }
`;

const Btn2 = styled.button`
  cursor: pointer;
  background: transparent;
  color: var(--c-text);
  align-items: center;
  font-size: 14px;
  .icon {
    min-width: 20px;
    min-height: 20px;
  }
  &:hover {
    color: var(--c-btn-1-bg);
  }
  &.warn:hover {
    color: var(--c-text-warn);
  }
`;