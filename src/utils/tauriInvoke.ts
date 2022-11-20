/**
 * @tauri-apps/api.invokeのメモリリークが直るまでの暫定的な対応
 * ダミーのコールバックを呼ぶのでPromiseは帰らない
 * https://github.com/tauri-apps/tauri/commit/f72cace36821dc675a6d25268ae85a21bdbd6296
 */

import { fs } from '@tauri-apps/api';

interface Window {
  __TAURI_IPC__: (obj: object) => void;
  _19990930: () => void; // 適当な数字
}

declare let window: Window;

export function writeFile(
  path: string,
  contents: string,
  dir: fs.BaseDirectory
) {
  const args = {
    __tauriModule: 'Fs',
    message: {
      cmd: 'writeFile',
      path: path,
      contents: Array.from(new TextEncoder().encode(contents)),
      options: {
        dir: dir,
      },
    },
  };
  invoke('tauri', args);
}

export function invoke(cmd: string, args?: object) {
  const _a = args || {};
  window._19990930 = () => {};
  window.__TAURI_IPC__({
    cmd: cmd,
    callback: 19990930,
    error: 19990930,
    ..._a,
  });
}
