/**
 * TwitchのURLか確認
 */
export function isTwitchUrl(urlStr: string) {
  const url = new window.URL(urlStr);
  if (url.hostname.match(/^([0-9A-z]+\.|)(twitch\.tv)/)) {
    return true;
  }
  return false;
}

/**
 * TwitchのURLからChannelを返す
 */
export function parseTwitchUrl(urlStr: string) {
  if (!isTwitchUrl(urlStr)) return null;
  const url = new window.URL(urlStr);
  const parts = url.pathname.split('/');
  return parts[1] || null;
}
