
import { window as tauriWindow } from '@tauri-apps/api';
import { invoke } from '@tauri-apps/api/tauri';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import styled from 'styled-components';
import { VscChromeClose, VscChromeMaximize, VscChromeMinimize, VscChromeRestore, VscSettings } from 'react-icons/vsc';
import { AppConfigContext } from '../../context/config';

type TitlebarProps = {
  title?: string;
  size?: 's' | 'm' | 'l';
};

export const Titlebar: React.VFC<TitlebarProps> = (props) => {
  const {state: config, dispatch} = useContext(AppConfigContext);
  const [isMaximized, setMaximized] = useState<boolean>(false);
  const onContextMenu = useCallback((event: React.MouseEvent) => {
    // invoke("test", { message: "hello" });
    invoke("show_system_menu");
    event.preventDefault();
  }, []);

  useEffect(() => {
    if (props.title) {
      tauriWindow.appWindow.setTitle(props.title);
    }
  }, [props.title]);

  return (
    <Header data-tauri-drag-region {...props} onContextMenu={onContextMenu}>
      <img data-tauri-drag-region draggable="false" src={`${process.env.PUBLIC_URL}/logo192.png`} alt="icon" />
      <h1 data-tauri-drag-region className="hide-400">{ props.title }</h1>
      <ul onContextMenu={(event) => { event.stopPropagation(); event.preventDefault(); }}>
        <li>
          <button onClick={() => { dispatch({
            type: "CHANGE",
            data: {...config, maxChatItemNum: config.maxChatItemNum + 1}
          }) }}>
            <VscSettings />
          </button>
        </li>
        <li>
          <button onClick={() => { tauriWindow.appWindow.minimize() }}>
            <VscChromeMinimize />
          </button>
        </li>
        <li>
          <button onClick={() => { tauriWindow.appWindow.toggleMaximize() }}>
            { isMaximized && <VscChromeRestore />}
            { !isMaximized && <VscChromeMaximize />}
          </button>
        </li>
        <li>
          <button className="close" onClick={() => { tauriWindow.appWindow.close() }}>
            <VscChromeClose />
          </button>
        </li>
      </ul>
    </Header>
  );
}


Titlebar.defaultProps = {
  title: 'Tauri App',
  size: 'l'
}

const Header = styled.header<TitlebarProps>`
  display: flex;
  justify-content: center;
  align-items: center;
  user-select: none;
  background: var(--c-header-main);
  color: var(--c-header-text);
  img {
    width: 16px;
    height: 16px;
    margin: 0 10px;
    user-select: none;
  }
  h1 {
    flex: 1;
    font-size: ${props => {
      switch (props.size) {
        case 's': return '12px';
        case 'm': return '13px';
        case 'l': return '14px';
        default: return '14px';
      }
    }};
    font-weight: normal;
    cursor: default;
  }
  ul {
    display: flex;
    list-style: none;
    margin-left: auto;
    button {
      padding: 5px 12px;
      font-size: 16px;
      background: var(--c-header-button-bg);
      color: var(--c-header-button-c);
      &:hover {
        background: var(--c-header-button-bg-2);
        color: var(--c-header-button-c-2);
      }
      &.close:hover {
        background: var(--c-header-button-bg-3);
        color: var(--c-header-button-c-3);
      }
    }
  }
`;
