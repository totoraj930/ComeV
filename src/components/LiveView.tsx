
import styled from 'styled-components';
import { useLiveChat } from '../hooks/useLiveChat';
import { MdPlayArrow, MdPause, MdDeleteForever, MdMenu, MdExpandLess, MdSettingsSuggest, MdFastForward, MdSkipNext, MdSettings, MdPlaylistAdd } from "react-icons/md";
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ChatView } from '../components/ChatView';
import { fs } from "@tauri-apps/api"
import { useSettings } from '../hooks/useSettings';
import { requestBouyomi } from '../utils/bouyomi';
import { ChatItemContext } from '../context/chatItem';
import { SettingsView, SettingTab } from './SettingsView';
import { AppConfig } from '../context/config';
import { sendChatApi } from '../utils/sendChatApi';
import { DummySender } from './DummySender';
import { uuid } from '../utils/uuid';
import { ChatItem, createLiveChatEmpty, LiveChat } from '../services/liveChatService';
import { LiveControl } from './LiveControl';
import { LiveChatContext } from '../context/liveChat';
import { LiveInfoView } from './LiveInfoView';
import { DummySender2 } from './DummySender2';


export const LiveView: React.VFC<{
}> = () => {
  
  const { dispatch: dispatchLiveChat } = useContext(LiveChatContext);
  const { liveChatMap, liveChatUpdater } = useLiveChat();
  const { state: chatItemContext } = useContext(ChatItemContext);
  const chatItems = useRef<ChatItem[]>([]);

  const [isShowMenu, setIsShowMenu] = useState<boolean>(false);
  const [isShowSettings, setIsShowSettings] = useState<boolean>(false);
  // const { state: config } = useContext(AppConfigContext);
  const { settings, settingsUpdater } = useSettings();
  const settingScrollPos = useRef<number>(0);
  const settingTab = useRef<SettingTab>("main");
  const onCloseSettings = useCallback((
    resSettings: AppConfig,
    isCancel: boolean,
    scrollPos: number,
    tab: SettingTab,
  ) => {
    settingScrollPos.current = scrollPos;
    settingTab.current = tab;
    setIsShowSettings(false);
    if (isCancel) return;
    settingsUpdater({
      type: "CHANGE_SAVE",
      data: {...resSettings}
    });
  }, [settingsUpdater]);
  
  const liveChatList: LiveChat[] = useMemo(() => {
    return Object.keys(liveChatMap).map((id) => liveChatMap[id]);
  }, [liveChatMap]);


  useEffect(() => {
    chatItems.current = chatItemContext.items;
  }, [chatItemContext]);


  // 初回マウント時
  useEffect(() => {
    // 設定読み込み
    settingsUpdater({
      type: "LOAD"
    }).then((_settings) => {
      for (const url of _settings.prevUrl) {
        if (Object.keys(liveChatMap).length) return;
        dispatchLiveChat({
          type: "ADD",
          liveChat: createLiveChatEmpty(uuid(), url)
        });
      }
    });

    let prevLog: string = "";

    // log.jsonに書き出す
    const logInterval = setInterval(() => {
      const logText = JSON.stringify(chatItems.current.slice(-100));
      // 前回と同じなら何もしない
      if (prevLog === logText) return;
      prevLog = logText;
      fs.writeFile({
        path: "log.json",
        contents: logText,
      }, {
        dir: fs.BaseDirectory.App
      });
    }, 5000);


    return () => {
      clearInterval(logInterval);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (<Wrap className={ `theme-${settings.themeName}` }>
  {/* <Titlebar size="m" title="ComeV" /> */}
  <Main data-anony-blur={settings.enableAnonyView}>
    <ChatControl>
      
      <LiveControlList>
        { liveChatList.map((liveChat) => {
          return <LiveControl liveChat={liveChat} key={liveChat.id} />
        }) }
      </LiveControlList>
      <InfoBar>
        <InfoBarLeft>
          <Btn2 onClick={() => setIsShowSettings(true)} title="設定">
            <MdSettings className="icon" />
            <span className="hide-400">設定</span>
          </Btn2>
          <LiveInfoView liveChatList={liveChatList} />
        </InfoBarLeft>
        <InfoBarRight>
          <Btn2 onClick={() => setIsShowMenu(!isShowMenu)}
            title={isShowMenu ? "閉じる" : "メニュー"}>
            { isShowMenu && <span className="hide-400">閉じる</span> }
            { isShowMenu && <MdExpandLess className="icon" /> }

            { !isShowMenu && <span className="hide-400">メニュー</span> }
            { !isShowMenu && <MdMenu className="icon" /> }
          </Btn2>
        </InfoBarRight>
      </InfoBar>
      
      {isShowMenu && (
        <MenuPanel>
          <Line>
            <p className="title">基本機能</p>
            <Btn2 onClick={() => settingsUpdater({ type: "LOAD" })}>
              <MdSettingsSuggest className="icon" />
              <span>設定リロード</span>
            </Btn2>

            <Btn2 onClick={() => {
              liveChatUpdater({ type: "CLEAR" });
              sendChatApi("clear", {});
            }} className="warn">
              <MdDeleteForever className="icon" />
              <span>クリア</span>
            </Btn2>

            <Btn2 onClick={() => {
              dispatchLiveChat({
                type: "ADD",
                liveChat: createLiveChatEmpty(uuid(), "")
              });
            }} className="warn">
              <MdPlaylistAdd className="icon" />
              <span>接続先を追加</span>
            </Btn2>
          </Line>

          <hr />

          {/* 棒読みちゃん */}
          <Line>
            <p className="title">棒読み連携</p>

            <Switch htmlFor="s">
              <input type="checkbox" name="s" id="s"
                checked={settings.bouyomi.enable}
                onChange={() => {
                  settingsUpdater({
                    type: "CHANGE_SAVE",
                    data: {
                      ...settings,
                      bouyomi: {
                        ...settings.bouyomi,
                        enable: !settings.bouyomi.enable
                      }
                    }
                  });
                }} />
              <span className="slider"></span>
            </Switch>

            <Btn2 onClick={() => requestBouyomi("skip", settings.bouyomi)}>
              <MdFastForward className="icon" />
            </Btn2>

            <Btn2 onClick={() => requestBouyomi("clear", settings.bouyomi)}>
              <MdSkipNext className="icon" />
            </Btn2>


          </Line>

          <hr />

          {/* テスト用機能 */}
          <DummySender />
          <DummySender2 />
        </MenuPanel>
      )}

      <DebugPanel>
        <button className="btn-base-2" onClick={() => {}}>
          <MdPlayArrow className="icon" />
        </button>
        <button className="btn-base-2" onClick={() => {}}>
          <MdPause className="icon" />
        </button>
        <button className="btn-base-2" onClick={() => {}}>
          <MdPlayArrow className="icon" />
        </button>
      </DebugPanel>
    </ChatControl>
    <ChatView chatItems={chatItemContext} />
    {isShowSettings && <SettingsView closeHandler={onCloseSettings} scrollPos={settingScrollPos.current} tab={settingTab.current} />}
  </Main>
  
</Wrap>)
}



const Wrap = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--c-main);
  color: var(--c-text);
  /* border: 1px solid var(--c-border-1); */
  .view {
    flex: 1;
  }
`;

const Main = styled.div`
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
`;

const ctlShadowSize = 15;
const ChatControl = styled.div`
  position: relative;
  background: var(--c-sub);
  border-bottom: 1px solid var(--c-border-1);
  &:after {
    content: "";
    position: absolute;
    top: 100%;
    left: -${ctlShadowSize*2}px;
    width: calc(100% + ${ctlShadowSize*2}px);
    height: ${ctlShadowSize}px;
    box-shadow: inset 20px ${ctlShadowSize}px ${ctlShadowSize}px -${ctlShadowSize}px var(--c-shadow);
    pointer-events: none;
  }
  .url {
    flex: 1;
    padding: 5px 7px;
    font-size: 14px;
    background: var(--c-input-bg);
    color: var(--c-input-c);
    border: 1px solid var(--c-input-bd);
    border-radius: 4px;
    box-shadow: inset 0 0 3px var(--c-input-s);
    min-width: 100px;
    &:focus {
      outline: 1px solid var(--c-input-c);
    }
    &:read-only {
      color: var(--c-input-c-2)
    }
    &:read-only:focus {
      outline: none;
    }
  }
  .btn-base-1 {
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
  }
  .btn-1 {
    background: var(--c-btn-1-bg);
    color: var(--c-btn-1-c);
    border-radius: 100px;
    font-size: 14px;
    &:hover {
      background: var(--c-btn-1-bg-2);
      color: var(--c-btn-1-c-2);
      cursor: pointer;
    }
  }
  .btn-2 {
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



export const Line = styled.div`
  display: flex;
  flex-wrap: wrap;
  padding: 5px 10px;
  gap: 6px;
  font-size: 14px;
  > .title {
    display: flex;
    gap: 3px;
    align-items: center;
  }
  > .body {
    display: flex;
    flex-wrap: wrap;
    flex: 1;
    gap: 6px;
  }
  .line-r {
    margin-left: auto;
  }
  @media screen and (max-width: 550px) {
    padding: 5px 6px;
  }
`;

const LiveControlList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 5px 7px;
`;
const InfoBar = styled.div`
  display: flex;
  flex-direction: row;
  gap: 5px;
  padding: 5px 7px;
`;
const InfoBarLeft = styled.div`
  display: flex;
  flex-direction: row;
  flex-shrink: 1;
  flex-grow: 1;
  gap: 5px;
`;
const InfoBarRight = styled.div`
  display: flex;
  flex-direction: row;
`;


const MenuPanel = styled.div`
  background: var(--c-menu-bg);
  z-index: 10;
  .title {
    min-width: 100px;
    color: var(--c-text-2);
    border-right: 1px solid var(--c-border-1);
    font-weight: bold;
    @media screen and (max-width: 400px) {
      min-width: 100%;
      border: 0;
    }
  }
  hr {
    width: 100%;
    height: 1px;
    background: var(--c-border-1);
  }
`;

const DebugPanel = styled.div`
  position: absolute;
  display: none;
  width: 100%;
  top: 200%;
  left: 0;
  padding: 5px;
  background: rgba(0, 0, 0, 0.8);
  z-index: 100;
`;

export const Switch = styled.label`
  display: inline-block;
  position: relative;
  width: 46px;
  height: 20px;
  cursor: pointer;
  input {
    width: 0;
    height: 0;
    opacity: 0;
  }
  .slider {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    border-radius: 300px;
    background: var(--c-switch-bg);
    transition: background-color 200ms;
    user-select: none;
    &:before {
      content: "off";
      position: absolute;
      font-size: 10px;
      top: 0;
      left: 21px;
      line-height: 20px;
      color: var(--c-switch-off);
      text-transform: uppercase;
      transition: 200ms;
    }
    &:after {
      content: "";
      position: absolute;
      width: 16px;
      height: 16px;
      top: 2px;
      left: 2px;
      border-radius: 300px;
      background: var(--c-switch-c);
      transition: 200ms;
    }
  }

  input:focus + .slider {
    outline: 2px ridge;
  }

  input:checked + .slider {
    background: var(--c-switch-bg-2);
    &:before {
      content: "on";
      color: var(--c-switch-on);
      left: 8px;
    }
    &:after {
      left: auto;
      left: 100%;
      margin-left: -18px;
    }
  }
`;


export const Btn2 = styled.button`
  display: flex;
  cursor: pointer;
  background: transparent;
  color: var(--c-text);
  align-items: center;
  font-size: 14px;
  min-width: 20px;
  min-height: 20px;
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