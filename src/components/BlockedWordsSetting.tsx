import { AppConfig } from '@/context/config';
import { MdAdd, MdDeleteForever, MdFolderOpen } from 'react-icons/md';
import styled from 'styled-components';
import { Btn1, Btn2, FormatWrap, Input2, Item } from './SettingsView';
import { fs, path, invoke as invokeOrigin } from '@tauri-apps/api';
import { useState, useEffect } from 'react';

type Props = {
  initConfig: AppConfig;
  onChange?: (newConfig: AppConfig) => void;
};
export function BlockedWordsSetting({
  initConfig,
  onChange = () => {},
}: Props) {
  const [config, setConfig] = useState(initConfig);

  useEffect(() => {
    setConfig(initConfig);
  }, [initConfig]);

  const update = (newConfig: AppConfig) => {
    setConfig(newConfig);
    onChange(newConfig);
  };

  const remove = (index: number) => {
    const list = config.blockedWords;
    const newList = [...list.slice(0, index), ...list.slice(index + 1)];
    update({
      ...config,
      blockedWords: newList,
    });
  };

  const add = () => {
    const newList = [...config.blockedWords, ''];
    update({
      ...config,
      blockedWords: newList,
    });
  };

  return (
    <section>
      <div className="title">
        禁止ワード設定
        <HeaderBtns className="ml-a">
          <Btn1
            onClick={async () => {
              invokeOrigin('open_in_explorer', {
                path: await path.appConfigDir(),
              });
            }}
          >
            <MdFolderOpen className="icon" />
            保存場所を開く
          </Btn1>
        </HeaderBtns>
      </div>
      <div className="body">
        <Item>
          {/* <p className="title"></p> */}
          <div>
            <p className="description">
              指定したワードが含まれるチャットは表示されなくなります。
              <br />
              「/」で囲むと正規表現として扱います。(例: 「/(http|https):.+/」)
            </p>
            {config.blockedWords.map((text, index) => {
              return (
                <div key={index}>
                  <FormatWrap>
                    <Input2
                      type="text"
                      value={text}
                      onChange={(event) => {
                        config.blockedWords[index] = event.target.value;
                        update({ ...config });
                      }}
                    />
                    <Btn2
                      title="削除"
                      className="warn"
                      onClick={() => remove(index)}
                    >
                      <MdDeleteForever className="icon" />
                    </Btn2>
                  </FormatWrap>
                </div>
              );
            })}
            <div>
              <Btn2 onClick={() => add()}>
                <MdAdd className="icon" />
                追加
              </Btn2>
            </div>
          </div>
        </Item>
      </div>
    </section>
  );
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
  input[type='color'] {
    width: 100%;
    background-color: transparent;
    padding: 0;
    cursor: pointer;
  }
`;
