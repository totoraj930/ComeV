import { YouTubeLiveId } from 'youtube-chat-tauri/dist/types/data';

/**
 * URLがYouTubeのものか判定
 */
export function isYouTubeUrl(urlStr: string) {
  const url = new window.URL(urlStr);
  if (url.hostname.match(/^([0-9A-z]+\.|)(youtube\.com|youtu\.be)/)) {
    return true;
  }
  return false;
}

/**
 *urlからyoutube-chat用のidオブジェクトを生成
 */
export function parseUrl(urlStr: string): YouTubeLiveId | null {
  if (!isYouTubeUrl(urlStr)) return null;
  const url = new window.URL(urlStr);
  if (url.pathname === '/watch') {
    // 視聴ページURL
    const v = url.searchParams.get('v');
    if (!v) return null;
    return { liveId: v };
  } else if (url.hostname === 'youtu.be') {
    // 共有用URL
    const v = url.pathname.replace('/', '');
    return { liveId: v };
  } else {
    // チャンネルURL
    const parts = url.pathname.split('/');
    if (parts[1] === 'c' && parts[2]) {
      return { customChannelId: parts[2] };
    } else if (parts[1] === 'channel' && parts[2]) {
      return { channelId: parts[2] };
    }
  }
  return null;
}
