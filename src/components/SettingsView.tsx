import { invoke as invokeOrigin, path } from "@tauri-apps/api";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { MdBackspace, MdFolderOpen, MdSettings, MdSettingsBackupRestore } from "react-icons/md";
import styled from "styled-components";
import { AppConfig, BouyomiTwitchConfig, BouyomiYouTubeConfig, copyConfig, defaultConfig } from "../context/config";
import { useSettings } from "../hooks/useSettings";
import { ComeViewSetting } from "./ComeViewSetting";
import { Switch } from "./LiveView";

export type SettingTab = "main" | "obs";

export const SettingsView: React.VFC<{
  tab?: SettingTab;
  scrollPos?: number;
  closeHandler: (resSettings: AppConfig, isCancel: boolean, scrollPos: number, tab: SettingTab) => void;
}> = ({ closeHandler, scrollPos = 100, tab = "main" }) => {

  const { settings, settingsUpdater } = useSettings();

  const [ copiedS, setCopiedS ] = useState<AppConfig>(copyConfig(settings));

  const [ activeTab, setActiveTab ] = useState<SettingTab>(tab)

  const scrollY = useRef<number>(0);
  const $main = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCopiedS(copyConfig(settings));
  }, [settings]);

  const def = useMemo(() => {
    return copyConfig(defaultConfig);
  }, []);

  useEffect(() => {
    if (!$main.current) return;
    $main.current.scrollTo({
      top: scrollPos
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <Wrap>
    <Main
      ref={$main}
      onScroll={(event) => { scrollY.current = event.currentTarget.scrollTop }}
    >
      <Header>
        <ul className="tab-list">
          <li>
            <Btn2 onClick={() => setActiveTab("main") }>
              <MdSettings className="icon" />
              アプリ設定
            </Btn2>
          </li>
          <li>
            <Btn2 onClick={() => setActiveTab("obs") }>
              <MdSettings className="icon" />
              外部連携コメビュ設定
            </Btn2>
          </li>
        </ul>
      </Header>

      <hr />

      
      {/* main ------------------------------------------------------------------------------------ */}
      {
        activeTab === "main" &&
        <>
          <section>
            <p className="title">
              基本設定
              <Btn1 className="ml-a"
                onClick={async () => {
                  invokeOrigin("open_in_explorer", { path: await path.appDir()});
                }}>
                  <MdFolderOpen className="icon" />
                  保存場所を開く
              </Btn1>
            </p>
            <div className="body">
              <Item>
                <label htmlFor="theme_name" 
                  className="title">テーマ</label>
                <div>
                  <select
                    name="theme_name" id="theme_name"
                    defaultValue={copiedS.themeName}
                    onChange={(event) => {
                      copiedS.themeName = event.target.value;
                      settingsUpdater({
                        type: "CHANGE",
                        data: copiedS
                      });
                    }}
                  >
                    <option value="dark">ダーク</option>
                    <option value="light">ライト</option>
                  </select>
                </div>
              </Item>
              <Item>
                <label htmlFor="max_chat_item_num" 
                  className="title">表示上限</label>
                <div>
                  <div className="unit">
                    <Input1
                      type="number"
                      name="max_chat_item_num" id="max_chat_item_num"
                      min="50" max="800" step="50"
                      defaultValue={copiedS.maxChatItemNum}
                      onChange={(event) => { copiedS.maxChatItemNum = Number.parseInt(event.target.value) }}
                      placeholder={def.maxChatItemNum + ""}
                    />
                    <span>個</span>
                  </div>
                  <p className="description">多すぎると重くなります</p>
                </div>
              </Item>
              <Item>
                <p className="title">スクロールアニメ</p>
                <div>
                  <Switch htmlFor="use_smooth_scroll">
                    <input type="checkbox"
                      name="use_smooth_scroll" id="use_smooth_scroll"
                      defaultChecked={ copiedS.useSmoothScroll }
                      onChange={(event) => { copiedS.useSmoothScroll = event.target.checked }}
                    />
                    <span className="slider"></span>
                  </Switch>
                  <p className="description">自動スクロールを滑らかにするか</p>
                </div>
              </Item>
              <Item>
                <label htmlFor="interval_ms"
                  className="title">チャット取得間隔</label>
                <div>
                  <div className="unit">
                    <Input1
                      type="number"
                      name="interval_ms" id="interval_ms"
                      min="1000" max="10000" step="500"
                      defaultValue={copiedS.intervalMs}
                      onChange={(event) => { copiedS.intervalMs = Number.parseInt(event.target.value) }}
                      placeholder={def.intervalMs + ""}
                    />
                    <span>ミリ秒</span>
                  </div>
                  <p className="description">1秒 = 1000ミリ秒 (YouTubeにのみ適用されます)</p>
                </div>
              </Item>
            </div>
          </section>
          <hr />
          <section style={{display: "none"}}>
            <p className="title">
              外部連携
            </p>
            <Item>
              <p className="title">APIサーバー</p>
              <div>
                <Switch htmlFor="api_server__enable">
                  <input type="checkbox"
                    name="api_server__enable" id="api_server__enable"
                    defaultChecked={ copiedS.apiServer.enable }
                    onChange={(event) => { copiedS.apiServer.enable = event.target.checked }} />
                  <span className="slider"></span>
                </Switch>
                <p className="description">OBSなどにコメントを表示する場合はON(変更時は再起動が必要)</p>
              </div>
            </Item>
            <Item>
              <label htmlFor="api_server__port"
                className="title">ポート番号</label>
              <div>
                <Input1
                  type="number"
                  name="api_server__port" id="api_server__port"
                  min="49152" max="65535"
                  defaultValue={ copiedS.apiServer.port }
                  onChange={(event) => { copiedS.apiServer.port = Number.parseInt(event.target.value) }}
                  placeholder={def.apiServer.port + ""}
                />
                <p className="description">サーバーを開くポート番号(基本変えなくて大丈夫)</p>
              </div>
            </Item>
          </section>
          {/* <hr /> */}
          <section>
            <p className="title">
              棒読みちゃん
            </p>
            <Item>
              <p className="title">連携する</p>
              <div>
                <Switch htmlFor="bouyomi__enable">
                  <input type="checkbox"
                    name="bouyomi__enable" id="bouyomi__enable"
                    defaultChecked={ copiedS.bouyomi.enable }
                    onChange={(event) => { copiedS.bouyomi.enable = event.target.checked }} />
                  <span className="slider"></span>
                </Switch>
                <p className="description">棒読みちゃんにチャットを読み上げてもらう場合はON</p>
              </div>
            </Item>
            <Item>
              <label htmlFor="bouyomi__port"
                className="title">ポート番号</label>
              <div>
                <Input1
                  type="number"
                  name="bouyomi__port" id="bouyomi__port"
                  min="49152" max="65535"
                  defaultValue={ copiedS.bouyomi.port }
                  onChange={(event) => { copiedS.bouyomi.port = Number.parseInt(event.target.value) }}
                  placeholder={def.bouyomi.port + ""}
                />
                <p className="description">棒読みちゃんのHTTP連携のポート番号</p>
              </div>
            </Item>
            <Item>
              <p className="title">読み上げ設定</p>
              <div>
                {
                  (Object.keys(def.bouyomi.youtube) as (keyof BouyomiYouTubeConfig)[])
                  .map((key, i) => {
                    const copiedVal = copiedS.bouyomi.youtube[key];
                    const defVal = def.bouyomi.youtube[key];
                    if (typeof copiedVal !== "string") return "";
                    const prefix = `bouyomi__youtube__${key}`;
                    let name = " (YouTube)";
                    switch (key) {
                      case "normal": {
                        name = "通常" + name;
                        break;
                      }
                      case "superchat": {
                        name = "スパチャ" + name;
                        break;
                      }
                      case "membership": {
                        name = "メンバーシップ" + name;
                        break;
                      }
                      case "membershipGift": {
                        name = "ギフト" + name;
                        break;
                      }
                    }
                    const setValue = (value: string) => {
                      const $input = document.getElementById(prefix) as HTMLInputElement;
                      $input.value = value;
                      copiedS.bouyomi.youtube[key] = value;
                    };
                    return (<div key={i} style={{ width: "100%" }}>
                      <label htmlFor={prefix} className="sub-title">{name}</label>
                      <FormatWrap>
                        <Input2
                          type="text"
                          name={prefix} id={prefix}
                          defaultValue={copiedVal}
                          onChange={(event) => { copiedS.bouyomi.youtube[key] = event.target.value }}
                          placeholder={defVal}
                        />
                        <Btn2
                          title="削除" className="warn"
                          onClick={() => setValue("")}
                        >
                          <MdBackspace className="icon" />
                        </Btn2>
                        <Btn2
                          title="初期設定に戻す"
                          onClick={() => setValue(defVal)}
                        >
                          <MdSettingsBackupRestore className="icon" />
                        </Btn2>
                      </FormatWrap>
                    </div>)
                  })
                }

                {
                  (Object.keys(def.bouyomi.twitch) as (keyof BouyomiTwitchConfig)[])
                  .map((key, i) => {
                    const copiedVal = copiedS.bouyomi.twitch[key];
                    const defVal = def.bouyomi.twitch[key];
                    if (typeof defVal !== "string") return "";
                    const prefix = `bouyomi__twitch__${key}`;
                    let name = " (Twitch)";
                    switch (key) {
                      case "normal": {
                        name = "通常" + name;
                        break;
                      }
                      case "cheer": {
                        name = "Cheer" + name;
                        break;
                      }
                      case "sub": {
                        name = "サブスク" + name;
                        break;
                      }
                      case "subPrime": {
                        name = "Primeサブスク" + name;
                        break;
                      }
                      case "subGift": {
                        name = "サブスクギフト" + name;
                        break;
                      }
                    }
                    const setValue = (value: string) => {
                      const $input = document.getElementById(prefix) as HTMLInputElement;
                      $input.value = value;
                      copiedS.bouyomi.twitch[key] = value;
                    };
                    return (<div key={i} style={{ width: "100%" }}>
                      <label htmlFor={prefix} className="sub-title">{name}</label>
                      <FormatWrap>
                        <Input2
                          type="text"
                          name={prefix} id={prefix}
                          defaultValue={copiedVal}
                          onChange={(event) => { copiedS.bouyomi.twitch[key] = event.target.value }}
                          placeholder={defVal}
                        />
                        <Btn2
                          title="削除" className="warn"
                          onClick={() => setValue("")}
                        >
                          <MdBackspace className="icon" />
                        </Btn2>
                        <Btn2
                          title="初期設定に戻す"
                          onClick={() => setValue(defVal)}
                        >
                          <MdSettingsBackupRestore className="icon" />
                        </Btn2>
                      </FormatWrap>
                    </div>)
                  })
                }

                <p className="description">
                  $(Message): チャット本文<br />
                  $(Name): 投稿者名<br />
                  $(Amount): スパチャ金額 or ビッツ<br />
                  $(GiftNum): ギフトの個数(YouTube非対応)<br />
                  に置き換えて読み上げます<br />
                  ※ 空白にすると読み上げなくなります<br />
                  ※「￥100」「$100.00」「NT$100.00」などの表記になります(辞書登録推奨)
                </p>
              </div>
            </Item>
          </section>
        </>
      }

      {/* obs ------------------------------------------------------------------------------------ */}
      {
        activeTab === "obs" &&
        <ComeViewSetting copiedS={copiedS} />
      }
      
    </Main>
    
    <Footer>
      <div className="wrap">
        <div className="mr">
          <Btn1 className="a warn" onClick={ () => closeHandler({...copiedS}, true, scrollY.current, activeTab) }>
            キャンセル
          </Btn1>
        </div>

        <Btn1 className="large" onClick={ () => closeHandler({...copiedS}, false, scrollY.current, activeTab) }>
          保存
        </Btn1>
      </div>
    </Footer>
  
  </Wrap>;
}
const Wrap = styled.div`
  position: absolute;
  display: flex;
  flex-direction: column;
  z-index: 20;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--c-main);
`;

const Header = styled.div`
  padding: 10px;
  .tab-list {
    display: flex;
    list-style: none;
    gap: 5px;
  }
`;
const Footer = styled.div`
  background: var(--c-sub);
  .wrap {
    display: flex;
    align-items: center;
    max-width: 550px;
    margin: 0 auto;
    padding: 10px;
  }
  .mr {
    margin-right: auto;
  }
`;

export const Btn1 = styled.button`
  display: flex;
  height: 30px;
  align-items: center;
  padding: 10px;
  .icon {
    width: 20px;
    height: 20px;
  }
  background: var(--c-btn-1-bg);
  color: var(--c-btn-1-c);
  border-radius: 100px;
  font-size: 14px;
  cursor: pointer;
  &:hover {
    background: var(--c-btn-1-bg-2);
    color: var(--c-btn-1-c-2);
  }

  &.large {
    width: 120px;
    height: 40px;
    font-size: 15px;
    justify-content: center;
  }

  &.a {
    color: var(--c-text);
    background: transparent;
    text-decoration: underline;
    &:hover {
      color: var(--c-btn-1-bg);
      background: transparent;
    }
    &.warn:hover {
      color: var(--c-text-warn);
    }
  }
`;

export const Btn2 = styled.button`
  cursor: pointer;
  color: var(--c-text);
  background: transparent;
  display: flex;
  align-items: center;
  gap: 0 3px;
  .icon {
    width: 20px;
    height: 20px;
  }
  &:hover {
    color: var(--c-btn-1-bg);
  }
  &.warn:hover {
    color: var(--c-text-warn);
  }
`;

const ss = 10;
export const Main = styled.div`
  position: relative;
  flex: 1;
  overflow-y: scroll;
  overflow-x: auto;
  box-shadow:
    inset 0 ${ss}px ${ss}px -${ss}px var(--c-shadow),
    inset 0 -${ss}px ${ss}px -${ss}px var(--c-shadow);
  > hr {
    width: 100%;
    height: 1px;
    margin-bottom: 10px;
    background: var(--c-border-1);
  }
  > section {
    padding: 10px;
    > .title {
      display: flex;
      align-items: center;
      position: relative;
      margin-bottom: 10px;
      font-weight: bold;
      /* padding-bottom: 2px; */
      /* &:after {
        content: "";
        position: absolute;
        width: 200px;
        height: 2px;
        bottom: 0;
        left: 0;
        background: var(--c-text);
      } */
    }
    .body {
      font-size: 14px;
    }
  }

  
  ::-webkit-scrollbar {
    width: 15px;
    height: 15px;
    border-width: 0 0 0 1px;
    border-style: solid;
    border-color: var(--c-scrollbar-border);
    @media screen and (max-width: 400px) {
      width: 10px;
      height: 10px;
    }
  }
  ::-webkit-scrollbar-thumb {
    border-radius: 6px;
    background: var(--c-scrollbar-thumb);
  }
  ::-webkit-scrollbar-thumb:hover {
    border-radius: 6px;
    background: var(--c-scrollbar-thumb-h);
  }
  ::-webkit-scrollbar-corner {
    background: var(--c-sub);
  }
`;

export const Item = styled.div`
  display: flex;
  align-items: flex-start;
  border-top: 1px solid var(--c-border-2);
  flex-wrap: nowrap;
  min-height: 50px;
  > .title {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    min-width: 150px;
    padding: 5px;
    gap: 5px;
    font-size: 14px;
    font-weight: bold;
  }
  > div {
    padding: 5px;
    flex-grow: 1;
    flex-shrink: 1;
    .sub-title {
      font-size: 14px;
    }
    .unit {
      display: flex;
      align-items: center;
      > span {
        margin-left: 5px;
        font-size: 13px;
      }
    }
    > .description {
      padding: 5px 0;
      width: 100%;
      color: var(--c-text-2);
      font-size: 13px;
    }
  }

  select {
    width: 120px;
    padding: 10px 5px;
    font-size: 16px;
    background: var(--c-input-bg);
    color: var(--c-input-c);
    border: 1px solid var(--c-input-bd);
    border-radius: 4px;
    box-shadow: inset 0 0 4px var(--c-input-s);
  }

  @media screen and (max-width: 450px) {
    flex-wrap: wrap;
    > .title {
      min-width: 100%;
    }
    > .description {
      padding-left: 5px;
    }
  }
`;

export const Input1 = styled.input`
  padding: 10px 5px;
  font-size: 16px;
  background: var(--c-input-bg);
  color: var(--c-input-c);
  border: 1px solid var(--c-input-bd);
  border-radius: 4px;
  box-shadow: inset 0 0 4px var(--c-input-s);
  
  &[type=number] {
    width: 120px;
  }
  &[type=text] {
    width: 200px;
  }
`;

export const FormatWrap = styled.div`
  display: flex;
  width: 100%;
  gap: 5px;
  align-items: center;
  margin-bottom: 16px;
`;
export const Input2 = styled.input`
  flex-grow: 1;
  padding: 10px 5px;
  font-size: 14px;
  background: var(--c-input-bg);
  color: var(--c-input-c);
  border: 1px solid var(--c-input-bd);
  border-radius: 4px;
  box-shadow: inset 0 0 4px var(--c-input-s);
  &[type=text] {
    flex-grow: 1;
    flex-shrink: 1;
  }
  &::placeholder {
    opacity: 0.5;
  }
`;