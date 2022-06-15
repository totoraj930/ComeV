import {
  TwitchCheerItem,
  TwitchMessageItem,
  TwitchNormalChatItem,
  TwitchSubItem,
  TwitchSubMysteryGiftItem,
  TwitchUser
} from "../../src/utils/twitch";

function escapeHtml(html: string) {
  return html
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/, "&quot;");
}

/** ノーマルチャット */
export function createNormalChatElm(item: TwitchNormalChatItem) {
  const htmlStr = `
    <div class="normal twitch">
      <div class="content">
        ${createAuthorElm(item.author).outerHTML}
        ${createMessageElm(item.message).outerHTML}
      </div>
    </div>
  `;
  return createElement(htmlStr);
}

/** Cheerチャット */
export function createCheerChatElm(item: TwitchCheerItem) {
  const htmlStr = `
    <div class="cheer twitch">
      <div class="header">
        <div class="content">
          ${createAuthorElm(item.author).outerHTML}
        </div>
        <p class="amount">${item.bits} Bits</p>
      </div>
      <div class="body">
        ${createMessageElm(item.message).outerHTML}
      </div>
    </div>
  `;
  return createElement(htmlStr);
}

/** サブスク */
export function createSubChatElm(item: TwitchSubItem) {
  const htmlStr = `
    <div class="subscribe twitch">
      <div class="header">
        <div class="content">
          ${createAuthorElm(item.author).outerHTML}
        </div>
      </div>
      <div class="body">
        ${createMessageElm([
          item.methods.prime ? "Primeで" : "",
          "サブスクしました"
        ]).outerHTML}
      </div>
    </div>
  `;
  return createElement(htmlStr);
}

/** サブスクギフト(Mystery) */
export function createSubGiftChatElm(item: TwitchSubMysteryGiftItem) {
  const htmlStr = `
    <div class="subscribe twitch">
      <div class="header">
        <div class="content">
          ${createAuthorElm(item.author).outerHTML}
        </div>
      </div>
      <div class="body">
        ${createMessageElm([
          "サブスクギフトを",
          item.num + "",
          "個送りました"
        ]).outerHTML}
      </div>
    </div>
  `;
  return createElement(htmlStr);
}

/** 投稿者Elment(共通) */
export function createAuthorElm(author: TwitchUser) {
  const name = author.displayName || author.name || ""
  const htmlStr = `
    <p class="author">
      ${author.badges.map((item) => {
        return `<img
          class="badge"
          src="${item.url}"
          alt="badge"
        />`;
      }).join("\n")}
      <span class="name">${escapeHtml(name)}</span>
    </p>
  `;
  return createElement(htmlStr);
}

/** メッセージのElementをつくる(共通) */
export function createMessageElm(message: TwitchMessageItem[]) {
  const htmlStr = `
    <p class="message">
      ${
        message.map((item, i) => {
          if (typeof item === "string") {
            return `<span class="text">${escapeHtml(item)}</span>`;
          }
          else if ("bits" in item) {
            return `<img
              src="${item.cheermote.animated_url.dark}"
              alt="bits"
              class="cheermote"
            />`;
          }
          else {
            return `<img
              src="${item.animated_url || item.url}"
              alt="${item.name}"
              class="emote"
            />`;
          }
        }).join("\n")
      }
    </p>
  `;
  return createElement(htmlStr);
}

function createElement(htmlStr: string) {
  const $elm = document.createElement("div");
  $elm.innerHTML = htmlStr;
  const $res = $elm.lastElementChild;
  if ($res instanceof HTMLElement) {
    return $res;
  } else {
    return $elm;
  }
}