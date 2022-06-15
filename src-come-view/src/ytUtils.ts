import { ChatItem, ImageItem, MessageItem } from "youtube-chat-tauri/dist/types/data";

/** メンバーシップのElementをつくる */
export function createMembershipElm(item: ChatItem) {
  if (!item.membership) return null;
  const $wrap = createChatElm(item);
  $wrap.className = "membership youtube";
  $wrap.innerHTML = `
    <div class="header">
      <img class="icon" src="${item.author.thumbnail?.url}" />
      <div class="content">
        <p class="author">
          <span class="name">${item.author.name}</span>
          ${createBadgeElm(item.author.badge?.thumbnail)?.outerHTML || ""}
        </p>
        ${createMessageElm(item.membership.text)?.outerHTML || ""}
      </div>
    </div>
    <div class="body" style="
      ${item.message.length > 0 ? "" : "display: none;"}
    ">
      ${createMessageElm(item.message)?.outerHTML || ""}
    </div>
  `;
  return $wrap;
}


/** スーパーチャットのElementをつくる */
export function createSuperChatElm(item: ChatItem) {
  if (!item.superchat) return null;
  const $wrap = createChatElm(item);
  $wrap.className = "superchat youtube";
  if (item.superchat.sticker) {
    $wrap.className = "supersticker youtube";
  }
  $wrap.innerHTML = `
    <div class="header" style="
      background: ${
        item.superchat.colorList.headerBackgroundColor
        || item.superchat.colorList.backgroundColor
        || item.superchat.color};
      color: ${item.superchat.colorList.headerTextColor};
    ">
      <img class="icon" src="${item.author.thumbnail?.url}" />
      <div class="content">
        <p class="author">
          <span class="name">${item.author.name}</span>
          ${createBadgeElm(item.author.badge?.thumbnail)?.outerHTML || ""}
        </p>
        <p class="amount">${item.superchat.amount}</p>
      </div>
    </div>
    <div class="body" style="
      background: ${
        item.superchat.colorList.bodyBackgroundColor
        || item.superchat.colorList.backgroundColor
        || item.superchat.color};
      color: ${item.superchat.colorList.bodyTextColor};
      ${item.message.length > 0 || item.superchat.sticker ? "" : "display: none;"}
    ">
      ${createMessageElm(item.message)?.outerHTML || ""}
      ${item.superchat.sticker
        ? createStickerElm(item.superchat.sticker).outerHTML
        : ""}
    </div>
  `;
  return $wrap;
}

/** メンバーシップギフトのElementをつくる */
export function createMembershipGiftElm(item: ChatItem) {
  if (!item.membershipGift) return null;
  const $wrap = document.createElement("div");
  $wrap.className = "gift youtube";
  $wrap.innerHTML = `
    <div class="header" style="background-image: url(${item.membershipGift.image?.url});">
      <img class="icon" src="${item.author.thumbnail?.url}" />
      <div class="content">
        <p class="author">
          <span class="name">${item.author.name}</span>
          ${createBadgeElm(item.author.badge?.thumbnail)?.outerHTML || ""}
        </p>
        ${createMessageElm(item.membershipGift.message)?.outerHTML || ""}
      </div>
    </div>
  `;
  return $wrap;
}

/** ノーマルチャットのElementをつくる */
export function createChatElm(item: ChatItem) {
  const $wrap = document.createElement("div");
  $wrap.className = "normal youtube";
  $wrap.innerHTML = `
    <img class="icon" src="${item.author.thumbnail?.url}" />
    <div class="content">
      <p class="author">
        <span class="name">${item.author.name}</span>
        ${createBadgeElm(item.author.badge?.thumbnail)?.outerHTML || ""}
      </p>
      ${createMessageElm(item.message)?.innerHTML || ""}
    </div>
  `;
  return $wrap;
}

/** ステッカーのElementをつくる */
export function createStickerElm(imgItem: ImageItem) {
  const $img = document.createElement("img");
  $img.classList.add("sticker");
  $img.src = imgItem.url;
  return $img;
}

/** バッジのElementをつくる */
export function createBadgeElm(imgItem?: ImageItem) {
  if (!imgItem) return null;
  const $img = document.createElement("img");
  $img.classList.add("badge");
  $img.src = imgItem.url;
  return $img;
}

/** メッセージのElementをつくる */
export function createMessageElm(message: MessageItem[]) {
  if (message.length <= 0) return null;
  const $message = document.createElement("p");
  $message.classList.add("message");
  for (const item of message) {
    if ("text" in item) {
      const $item = document.createElement("span");
      $item.innerText = item.text;
      $item.classList.add("text");
      $message.append($item);
    } else {
      const $item = document.createElement("img");
      $item.src = item.url;
      $item.classList.add("emoji");
      $message.append($item);
    }
  }
  return $message;
}