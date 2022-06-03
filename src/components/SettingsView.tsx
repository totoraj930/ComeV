import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { AppConfig, copyConfig, defaultConfig } from "../context/config";
import { useSettings } from "../hooks/useSettings";
import { Switch } from "./LiveView";


export const SettingsView: React.VFC<{
  closeHandler: (resSettings: AppConfig, isCancel: boolean) => void
}> = ({closeHandler}) => {

  const { settings, settingsUpdater } = useSettings();

  const [ copiedS, setCopiedS ] = useState<AppConfig>(copyConfig(settings));

  useEffect(() => {
    setCopiedS(copyConfig(settings));
  }, [settings]);

  const def = useMemo(() => {
    return copyConfig(defaultConfig);
  }, [])

  return <Wrap>
    <Main>
      <section>
        <p className="title">
          基本設定
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
          </Item>
          <Item>
            <label htmlFor="interval_ms"
              className="title">チャット取得間隔</label>
            <div>
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
            <p className="description">1秒 = 1000ミリ秒</p>
          </Item>
        </div>
      </section>
      <hr />
      <section>
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
          </div>
          <p className="description">OBSなどにコメントを表示する場合はON(変更時は再起動が必要)</p>
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
              placeholder={def.apiServer.port + ""} />
          </div>
          <p className="description">サーバーを開くポート番号(基本変えなくて大丈夫)</p>
        </Item>
      </section>
      <hr />
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
          </div>
          <p className="description">棒読みちゃんにチャットを読み上げてもらう場合はON</p>
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
              placeholder={def.bouyomi.port + ""} />
          </div>
          <p className="description">棒読みちゃんのHTTP連携のポート番号</p>
        </Item>
        <Item>
          <label htmlFor="bouyomi__format"
            className="title">読み上げ形式</label>
          <div>
            <Input1
              type="text"
              name="bouyomi__format" id="bouyomi__format"
              defaultValue={ copiedS.bouyomi.format }
              onChange={(event) => { copiedS.bouyomi.format = event.target.value }}
              placeholder={def.bouyomi.format}
              />
          </div>
          <p className="description">$(Message)をチャット本文、$(Name)を投稿者名に置き換えて読み上げます</p>
        </Item>
      </section>
    </Main>
    
    <Footer>
      <div className="wrap">
        <div className="mr">
          <Btn1 className="a warn" onClick={ () => closeHandler({...copiedS}, true) }>
            キャンセル
          </Btn1>
        </div>

        <Btn1 className="large" onClick={ () => closeHandler({...copiedS}, false) }>
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

const Btn1 = styled.button`
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
  &:hover {
    background: var(--c-btn-1-bg-2);
    color: var(--c-btn-1-c-2);
    cursor: pointer;
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

const ss = 10;
const Main = styled.div`
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

const Item = styled.div`
  display: flex;
  align-items: center;
  border-top: 1px solid var(--c-border-2);
  flex-wrap: wrap;
  > .title {
    display: flex;
    align-items: center;
    min-width: 150px;
    padding: 5px;
    font-size: 14px;
  }
  > div {
    display: flex;
    align-items: center;
    padding: 5px;
    > span {
      margin-left: 5px;
      font-size: 13px;
    }
  }
  > .description {
    padding: 0 0 5px 155px;
    width: 100%;
    color: var(--c-text-2);
    font-size: 13px;
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
    > .title {
      min-width: 100%;
    }
    > .description {
      padding-left: 5px;
    }
  }
`;

const Input1 = styled.input`
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