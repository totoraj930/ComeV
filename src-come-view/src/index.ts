import { ChatItem, YTChatItem, TTVChatItem } from "../../src/services/liveChatService";
import * as yt from "./ytUtils";
import * as ttv from "./ttvUtils";
let tasks: ChatItem[] = [];
let $list: HTMLElement[] = [];
let limit = 30;

/** 初回のElement追加とスクロール */
export function init(items: ChatItem[]) {
  const $wrap = document.querySelector("#wrap") as HTMLDivElement;
  for (const item of items) {
    const $elm = createElm(item);
    showChatItem($elm);
  }
  requestAnimationFrame(() => scroll($wrap, 0));
}

export function start(es: EventSource, _limit: number = 30) {
  limit = _limit + 1;
  removeChatItem(limit);

  es.addEventListener("youtube", (event) => {
    try {
      const item = JSON.parse(event.data) as YTChatItem;
      addTask(item);
    } catch {}
  });

  es.addEventListener("twitch", (event) => {
    try {
      const item = JSON.parse(event.data) as TTVChatItem;
      addTask(item);
    } catch {}
  });
  
  es.addEventListener("app", (event) => {
  
  });
  
  es.addEventListener("clear", (event) => {
    removeChatItem(0);
  });

  es.addEventListener("reload", (event) => {
    window.location.reload();
  });

}

/** タスクを追加 */
function addTask(item: ChatItem) {
  tasks.push(item);
  // タスクが1つなら即実行
  if (tasks.length === 1) {
    executeTask();
  }
}

/** タスクを実行 */
async function executeTask() {
  if (!tasks[0]) return;
  const $wrap = document.querySelector("#wrap") as HTMLDivElement;
  const $elm = createElm(tasks[0]);
  showChatItem($elm);
  const { promise } = scroll($wrap, 50);
  // スクロールを待つ
  await promise;

  // 30ms待機してから次のタスクへ
  setTimeout(() => {
    tasks = tasks.slice(1);
    // 範囲外を削除
    removeChatItem(limit);
    // 次のタスクへ
    executeTask();
  }, 30);
}

/**
 * スクロールタスク
 */
function scroll($elm: HTMLElement, duration: number) {
  let isCancel = false;
  
  const promise = new Promise<boolean>((resolve) => {
    const bottomY = $elm.scrollHeight - $elm.clientHeight;
    if (duration <= 0) {
      $elm.scrollTo({ top: bottomY });
      return Promise.resolve();
    }
    const startTime = Date.now();
    const startY = $elm.scrollTop;
    const diff = bottomY - startY;
    const sTask = () => {
      if (isCancel) {
        resolve(true);
        return;
      }
      const progress = Math.min(1, (Date.now() - startTime) / duration);
      $elm.scrollTo({
        top: startY + diff * progress
      });
      if (progress < 1) {
        requestAnimationFrame(sTask);
      } else {
        resolve(false);
      }
    }
    sTask();
  });

  return {
    cancel: () => { isCancel = true },
    promise,
  }
}

/** チャット表示 */
export function showChatItem($elm: HTMLElement) {
  const $wrap = document.querySelector("#wrap") as HTMLDivElement;
  $wrap.append($elm);
  $list.push($elm);
}

/** 範囲外のElementを削除 */
export function removeChatItem(maxNum: number) {
  if ($list.length <= maxNum) return;
  if (maxNum === 0) {
    for (const $target of $list) {
      $target.remove();
    }
    $list = [];
    return;
  }
  const $targetList = $list.slice(0, -maxNum);
  for (const $target of $targetList) {
    $target.remove();
  }
  $list = $list.slice(-maxNum);
  if ($list.length >= maxNum) {
    $list[0].classList.add("hide");
  }
}


/** コメント表示用Elementを生成 */
export function createElm(item: ChatItem) {
  let $res: HTMLElement | null = null;
  if (item.type === "YouTube") {
    const data = item.data;
    if (data.superchat) {
      $res = yt.createSuperChatElm(data);
    }
    else if (data.membership) {
      $res = yt.createMembershipElm(data);
    }
    else if (data.membershipGift) {
      $res = yt.createMembershipGiftElm(data);
    }
    else {
      $res = yt.createChatElm(data);
    }
    $res?.setAttribute("data-is-member", data.isMembership + "");
    $res?.setAttribute("data-is-owner", data.isOwner + "");
    $res?.setAttribute("data-is-moderator", data.isModerator + "");
    $res?.setAttribute("data-is-verified", data.isVerified + "");
  }
  else if (item.type === "Twitch") {
    const data = item.data;
    switch (data.type) {
      case "Normal": {
        $res = ttv.createNormalChatElm(data);
        break;
      }
      case "Cheer": {
        $res = ttv.createCheerChatElm(data);
        break;
      }
      case "Sub": {
        $res = ttv.createSubChatElm(data);
        break;
      }
      case "SubMysteryGift": {
        $res = ttv.createSubGiftChatElm(data);
        break;
      }
      default: {
      }
    }
    
    $res?.setAttribute("data-is-subscriber", data.author.isSubscriber + "");
    $res?.setAttribute("data-is-moderator", data.author.isModerator + "");
  }
  return $res || document.createElement("div");
}
