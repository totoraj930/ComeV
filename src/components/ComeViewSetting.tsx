import { fs, path, invoke as invokeOrigin } from "@tauri-apps/api";
import { useEffect, useRef, useState } from "react";
import { MdFolderOpen, MdContentCopy, MdOpenInBrowser, MdSettingsSuggest, MdSettingsBackupRestore } from "react-icons/md";
import styled from "styled-components";
import { AppConfig } from "../context/config";
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
  color: {
    "--name-c": ConfigField<string>;
    "--owner-name-c": ConfigField<string>;
    "--moderator-name-c": ConfigField<string>;
    "--member-name-c": ConfigField<string>;
    "--subscriber-name-c": ConfigField<string>;
    "--text-c": ConfigField<string>;
    "--outline-c": ConfigField<string>;
  };
  animeIn: {
    fade: ConfigField<boolean>;
    slideL: ConfigField<boolean>;
    slideR: ConfigField<boolean>;
  };
  useSmoothScroll: boolean;
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
    color: {
      "--name-c": {
        displayName: "通常",
        value: "#c0c0c0"
      },
      "--owner-name-c": {
        displayName: "オーナー",
        value: "#ffa551"
      },
      "--moderator-name-c": {
        displayName: "モデレーター",
        value: "#17d1ff"
      },
      "--member-name-c": {
        displayName: "メンバー",
        value: "#a5ff15"
      },
      "--subscriber-name-c": {
        displayName: "サブスクライバー",
        value: "#a5ff15"
      },
      "--text-c": {
        displayName: "テキスト",
        value: "#ffffff"
      },
      "--outline-c": {
        displayName: "縁取り",
        value: "#000000"
      },
    },
    animeIn: {
      fade: {
        displayName: "フェード",
        value: true,
      },
      slideL: {
        displayName: "左へスライド",
        value: false,
      },
      slideR: {
        displayName: "右へスライド",
        value: false,
      }
    },
    useSmoothScroll: true,
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
      res.display[key] = def.display[key];
    }
  });

  (Object.keys(def.color) as (keyof ComeViewConfig["color"])[])
  .forEach((key, i) => {
    if (!res.color[key]) {
      res.color[key] = def.color[key];
      return;
    }
    const val = res.color[key].value;
    res.color[key].displayName = def.color[key].displayName;
    if (!isString(val)) {
      res.color[key] = def.color[key];
    }
  });

  (Object.keys(def.animeIn) as (keyof ComeViewConfig["animeIn"])[])
  .forEach((key, i) => {
    if (!res.animeIn[key]) {
      res.animeIn[key] = def.animeIn[key];
      return;
    }
    const val = res.animeIn[key].value;
    res.animeIn[key].displayName = def.animeIn[key].displayName;
    if (!isBoolean(val)) {
      res.animeIn[key] = def.animeIn[key];
    }
  });

  if (!isBoolean(res.useSmoothScroll)) {
    res.useSmoothScroll = def.useSmoothScroll;
  }
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

  res.distCSS = generateDistCSS(res);

  return res;
}

const BASE_DIR = fs.BaseDirectory.App;
const FILE_PATH = "come-view-config.json";

export async function loadConfig(): Promise<ComeViewConfig> {
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

function generateDistCSS(config: ComeViewConfig) {
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

  const colorVal: string[] = [];
  for (const [key, item] of Object.entries(config.color)) {
    colorVal.push(`${key}: ${item.value};`);
  }

  css.push(`:root { ${colorVal.join("")} }`);

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

  const animeInNameVal: string[] = [];
  const animeIn = config.animeIn;
  if (animeIn.fade.value) animeInNameVal.push("fadeIn");
  if (animeIn.slideL.value) animeInNameVal.push("slideInFromR");
  if (animeIn.slideR.value) animeInNameVal.push("slideInFromL");
  if (animeInNameVal.length > 0) {
    css.push(
      `:root { --in-animation-name: ${animeInNameVal.join(",")}; }`
    );
  } else {
    css.push(`:root { --in-animation-name: none; }`);
  }

  return css.join("\n") + config.customCSS;
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

    config.distCSS = generateDistCSS(config);

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

          <Item>
            <p className="title">表示設定</p>
            <SmallItemWrap>
              {(Object.keys(config.display) as (keyof ComeViewConfig["display"])[]).map((key, i) => {
                const item = config.display[key];
                const prefix = "display__" + key;
                return (<SmallItem key={i}>
                  <label htmlFor={prefix}>
                    {item.displayName}
                  </label>
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
                </SmallItem>)
              })}
            </SmallItemWrap>
          </Item>

          

          <Item>
            <p className="title">表示色</p>
            <SmallItemWrap>
              {(Object.keys(config.color) as (keyof ComeViewConfig["color"])[]).map((key, i) => {
                const item = config.color[key];
                const prefix = "color__" + key;
                return (<SmallItem key={i}>
                  <label htmlFor={prefix}>
                    {item.displayName}
                  </label>
                  <input
                    id={prefix}
                    name={prefix}
                    type="color"
                    defaultValue={ item.value }
                    onChange={(event) => {
                      item.value = event.target.value;
                      setConfig({...config});
                    }}
                  />
                </SmallItem>)
              })}
            </SmallItemWrap>
          </Item>

          

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
            <p className="title">スクロールアニメ</p>
            <div>
              <Switch htmlFor="use_smooth_scroll">
                <input type="checkbox"
                  name="use_smooth_scroll" id="use_smooth_scroll"
                  defaultChecked={ config.useSmoothScroll }
                  onChange={(event) => {
                    config.useSmoothScroll = event.target.checked;
                    setConfig({...config});
                  }}
                />
                <span className="slider"></span>
              </Switch>
              <p className="description">
                自動スクロールを滑らかにするか<br />
                有効だとコメントが秒間10個以上の場合に遅延が発生します
              </p>
            </div>
          </Item>

          
          <Item>
            <p className="title">登場アニメ</p>
            <SmallItemWrap>
              {(Object.keys(config.animeIn) as (keyof ComeViewConfig["animeIn"])[]).map((key, i) => {
                const item = config.animeIn[key];
                const prefix = "animeIn__" + key;
                return (<SmallItem key={i}>
                  <label htmlFor={prefix}>
                    {item.displayName}
                  </label>
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
                </SmallItem>)
              })}
            </SmallItemWrap>
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

const SmallItemWrap = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 5px;
`;
const SmallItem = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 150px;
  border: 1px solid var(--c-border-2);
  padding: 3px;
  > label {
    font-size: 12px;
    cursor: pointer;
  }
  input[type=color] {
    width: 100%;
    background-color: transparent;
    padding: 0;
    cursor: pointer;
  }
`;