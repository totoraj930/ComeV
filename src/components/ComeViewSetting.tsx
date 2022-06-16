import { fs, path, invoke as invokeOrigin } from "@tauri-apps/api";
import { useEffect, useRef, useState } from "react";
import { MdFolderOpen, MdContentCopy, MdOpenInBrowser, MdSettingsSuggest, MdSettingsBackupRestore } from "react-icons/md";
import styled from "styled-components";
import { AppConfig, copyConfig, defaultConfig } from "../context/config";
import { useSettings } from "../hooks/useSettings";
import { sendChatApi } from "../utils/sendChatApi";
import { Switch } from "./LiveView";
import { Btn1, Btn2, FormatWrap, Input1, Input2, Item } from "./SettingsView";
type ConfigField<T> = {
  displayName: string;
  value: T;
}
interface ComeViewConfig {
  display: {
    icon: ConfigField<boolean>;
    badgeYT: ConfigField<boolean>;
    badgeTTV: ConfigField<boolean>;
    name: ConfigField<boolean>;
    superName: ConfigField<boolean>;
  };
  fontName: string;
  customCSS: string;
  customTag: string;
  outline: number;
  limit: number;
  distCSS: string;
}

function getDefConfig(): ComeViewConfig {
  return {
    display: {
      icon: {
        displayName: "アイコン",
        value: false
      },
      badgeYT: {
        displayName: "バッジ(YouTube)",
        value: true
      },
      badgeTTV: {
        displayName: "バッジ(Twitch)",
        value: true
      },
      name: {
        displayName: "投稿者名(通常)",
        value: false
      },
      superName: {
        displayName: "投稿者名(スパチャ系)",
        value: true
      },
    },
    outline: 4,
    limit: 10,
    fontName: "Noto Sans JP",
    customCSS: `/* 独自にCSSをいじる場合はここに書いてください */`,
    customTag: `<!-- Google Fontsを読み込む場合はここに書いてください(<link>) -->

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&display=swap" rel="stylesheet">
`,
    distCSS: "",
  }
}

function isBoolean(val: unknown) {
  return typeof val === "boolean";
}
function isString(val: unknown) {
  return typeof val === "string";
}
function isNumber(val: unknown) {
  return typeof val === "number"
    && !isNaN(val);
}
function numMinMax(num: number, min: number = 0, max?: number) {
  return Math.max(min, Math.min(num, max ?? num));
}

function parseObj(rawJson: any, def: ComeViewConfig): ComeViewConfig {
  const res = {...def, ...rawJson} as ComeViewConfig;
  (Object.keys(def.display) as (keyof ComeViewConfig["display"])[])
  .forEach((key, i) => {
    if (!res.display[key]) {
      res.display[key] = def.display[key];
      return;
    }
    const val = res.display[key].value;
    res.display[key].displayName = def.display[key].displayName;
    if (!isBoolean(val)) {
      res.display[key] = def.display[key]
    }
  });

  if (!isString(res.customCSS)) {
    res.customCSS = def.customCSS;
  }
  if (!isString(res.customTag)) {
    res.customTag = def.customTag;
  }
  if (!isNumber(res.limit)) {
    res.limit = def.limit;
  } else {
    res.limit = numMinMax(res.limit, 1, 100);
  }
  if (!isNumber(res.outline)) {
    res.outline = def.outline;
  } else {
    res.outline = numMinMax(res.outline, 0, 10);
  }

  return res;
}

const BASE_DIR = fs.BaseDirectory.App;
const FILE_PATH = "come-view-config.json";

async function loadConfig(): Promise<ComeViewConfig> {
  const files = await fs.readDir("./", { dir: BASE_DIR });
  let rawText = "{}";
  for (const file of files) {
    if (file.name !== FILE_PATH) continue;
    rawText = await fs.readTextFile(FILE_PATH, { dir: BASE_DIR });
    break;
  }
  let rawJson = {};
  try {
    rawJson = JSON.parse(rawText);
  } catch {}
  const res = parseObj(rawJson, getDefConfig());
  await saveConfig(res);
  return res;
}

function saveConfig(obj: Object) {
  return fs.writeFile({
    path: FILE_PATH,
    contents: JSON.stringify(obj, null, "    ")
  }, { dir: BASE_DIR });
}

function generateOutlineShadow(
  size: number = 1,
  color: string = "#000"
) {
  const shadowList = [];
  for (let x = -size; x <= size; x++) {
    for (let y = -size; y <= size; y++) {
      shadowList.push(`${x}px ${y}px 0 ${color}`);
    }
  }
  return shadowList;
}


export const ComeViewSetting: React.VFC<{
  copiedS: AppConfig
}> = ({ copiedS }) => {

  const [config, setConfig] = useState<ComeViewConfig | null>(null);
  const viewURL = `http://localhost:${copiedS.apiServer.port}/come_view`;

  const configRef = useRef<ComeViewConfig>();
  useEffect(() => {
    loadConfig()
    .then((c) => setConfig(c));
    return () => {
      if (configRef.current) {
        saveConfig(configRef.current)
        .then(() => {
          sendChatApi("reload", {});
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!config) return;
    const d = config.display;
    const css: string[] = [];
    const dn = "display: none!important;";
    if (!d.icon.value) {
      css.push(`.icon { ${dn} }`);
    }
    if (!d.badgeTTV.value) {
      css.push(`.twitch .badge { ${dn} }`);
    }
    if (!d.badgeYT.value) {
      css.push(`.youtube .badge { ${dn} }`);
    }
    if (!d.name.value) {
      css.push(`.normal .name { ${dn} }`);
    }
    if (!d.superName.value) {
      css.push(`
        .superchat .name,
        .cheer .name,
        .membership .name,
        .subscribe .name,
        .gift .name {
          ${dn}
        }
      `);
    }
    css.push(`:root { --font-name: ${config.fontName}; }`);

    if (config.outline > 0) {
      css.push(`
        :root { 
          --outline: ${
            generateOutlineShadow(config.outline, "var(--outline-c)").join(",")
          }; 
        }`);
    } else {
      css.push(`:root { --outline: none; }`);
    }

    config.distCSS = css.join("\n") + config.customCSS;

    configRef.current = config;
  }, [config]);
  
  return (<>
    <section>
      <div className="title">
        外部連携コメビュ
        <HeaderBtns className="ml-a">
          <Btn1
            onClick={async () => {
              invokeOrigin("open_in_explorer", { path: await path.appDir()});
            }}>
              <MdFolderOpen className="icon" />
              保存場所を開く
          </Btn1>
        </HeaderBtns>
      </div>
      {
        config &&
        <div className="body">
          <Item>
            <p className="title">
              コメビュURL
            </p>
            <div>
              <FormatWrap>
                <Input2 type="text" readOnly value={viewURL} id="view_url" />
                <Btn2
                  title="ブラウザで開く"
                  onClick={(() => invokeOrigin("open_in_browser", { url: viewURL }))}
                >
                  <MdOpenInBrowser className="icon" />
                </Btn2>
                <Btn2
                  title="URLをコピー"
                  onClick={() => navigator.clipboard.writeText(viewURL)}
                >
                  <MdContentCopy className="icon" />
                </Btn2>
              </FormatWrap>
            </div>
          </Item>

          {(Object.keys(config.display) as (keyof ComeViewConfig["display"])[]).map((key, i) => {
            const item = config.display[key];
            const prefix = "display__" + key;
            return (<Item key={i}>
              <p className="title">
                {item.displayName}
              </p>
              <div>
                <Switch htmlFor={prefix}>
                  <input type="checkbox"
                    name={prefix} id={prefix}
                    defaultChecked={ item.value }
                    onChange={(event) => {
                      item.value = event.target.checked;
                      setConfig({...config});
                    }} />
                  <span className="slider"></span>
                </Switch>
              </div>
            </Item>)
          })}

          <Item>
            <label htmlFor="outline" className="title">
              文字の縁取り
            </label>
            <div>
              <Input1
                id="outline"
                type="number"
                min="0"
                max="10"
                defaultValue={config.outline}
                onChange={(event) => {
                  config.outline = parseInt(event.target.value);
                  setConfig({...config});
                }}
              />
            </div>
          </Item>

          <Item>
            <label htmlFor="font_name" className="title">
              フォント
            </label>
            <div>
              <Input1
                id="font_name"
                type="text"
                defaultValue={config.fontName}
                onChange={(event) => {
                  config.fontName = event.target.value;
                  setConfig({...config});
                }}
              />
            </div>
          </Item>

          <Item>
            <label htmlFor="limit" className="title">
              表示上限
            </label>
            <div>
              <Input1
                id="limit"
                type="number"
                min="1"
                max="100"
                defaultValue={config.limit}
                onChange={(event) => {
                  config.limit = parseInt(event.target.value);
                  setConfig({...config});
                }}
              />
            </div>
          </Item>

          <Item>
            <p className="title"></p>
            <div>
              <Btn1 onClick={async () => {
                await saveConfig(config);
                sendChatApi("reload", {});
              }}>
                <MdSettingsSuggest className="icon" />
                コメビュに反映
              </Btn1>
            </div>
          </Item>

          <Item>
            <label htmlFor="custom_css" className="title">
              カスタムCSS
            </label>
            <div>
              <Textarea1
                name="custom_css"
                id="custom_css"
                defaultValue={config.customCSS}
                onChange={(event) => {
                  config.customCSS = event.target.value;
                  setConfig({...config});
                }}
              />
            </div>
          </Item>

          <Item>
            <label htmlFor="custom_tag" className="title">
              カスタムheadタグ
              <Btn2
                onClick={() => {
                  config.customTag = getDefConfig().customTag;
                  setConfig({...config});
                  const $elm = document.getElementById("custom_tag");
                  if ($elm) ($elm as HTMLInputElement).value = config.customTag;
                }}
                className="warn"
              >
                <MdSettingsBackupRestore className="icon" />
                初期化
              </Btn2>
            </label>
            <div>
              <Textarea1
                name="custom_tag"
                id="custom_tag"
                defaultValue={config.customTag}
                onChange={(event) => {
                  config.customTag = event.target.value;
                  setConfig({...config});
                }}
              />
            </div>
          </Item>
        </div>
      }
    </section>
  </>);
}

const Textarea1 = styled.textarea`
  width: 100%;
  min-height: 20rem;
  padding: 10px;
  font-size: 14px;
  background: var(--c-input-bg);
  color: var(--c-input-c);
  border: 1px solid var(--c-input-bd);
  border-radius: 4px;
  box-shadow: inset 0 0 4px var(--c-input-s);
`;

const HeaderBtns = styled.div`
  display: flex;
  gap: 5px;
`;

const ReloadBtnWrap = styled.div`
  position: fixed;
  bottom: 70px;
  left: 10px;
`;