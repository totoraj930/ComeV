import { useCallback, useContext } from "react";
import { MdChat, MdAttachMoney, MdPersonAdd, MdCardGiftcard } from "react-icons/md";
import { ChatItemContext } from "../context/chatItem";
import { useSettings } from "../hooks/useSettings";
import { ChatItem, createDummyYTChatItem, createDummyYTGiftItem, createDummyYTMembershipItem, createDummyYTStickerItem, createDummyYTSuperChatItem } from "../services/liveChatService";
import { sendBouyomi } from "../utils/bouyomi";
import { sendChatApi } from "../utils/sendChatApi";
import { uuid } from "../utils/uuid";
import { Btn2, Line } from "./LiveView";

export const DummySender: React.VFC<{
}> = () => {
  const { settings } = useSettings();
  const { dispatch: dispatchChatItem } = useContext(ChatItemContext);
  const sendDummyChat = useCallback((type: "normal" | "superchat" | "sticker" | "membership" | "gift" | "random") => {
    let item: ChatItem;
    const r = (t?: number) => Math.random() < (t || 0.5);
    const sChat = createDummyYTSuperChatItem(r() ? "これはダミーのスーパーチャット" : null, null);
    const sChat2 = createDummyYTStickerItem();
    const chat = createDummyYTChatItem(null, null, r(), r(0.3), r(0.3));
    switch (type) {
      case "normal": {
        item = chat;
        break;
      }
      case "superchat": {
        item = sChat;
        break;
      }
      case "sticker": {
        item = sChat2;
        break;
      }
      case "membership": {
        item = createDummyYTMembershipItem(null, r());
        break;
      }
      case "gift": {
        item = createDummyYTGiftItem();
        break;
      }
      case "random": {
        item = r(0.3)
          ? r(0.5) ? sChat : sChat2
          : chat;
        break;
      }
      default: {
        item = chat;
        break;
      }
    }
    dispatchChatItem({
      type: "ADD",
      config: settings,
      actionId: uuid(),
      chatItem: item,
    });
    sendBouyomi(item, settings.bouyomi);
    sendChatApi("youtube", item);
    sendChatApi("youtube-list", [item]);

  }, [dispatchChatItem, settings]);
  return <>
    <Line>
      <p className="title">表示テスト</p>
      <div className="body">
        <Btn2 onClick={() => sendDummyChat("normal")}>
          <MdChat className="icon" />
          <span className="hide-400">通常</span>
        </Btn2>
        <Btn2 onClick={() => sendDummyChat("superchat")}>
          <MdAttachMoney className="icon" />
          <span className="hide-400">スパチャ</span>
        </Btn2>
        <Btn2 onClick={() => sendDummyChat("sticker")}>
          <MdAttachMoney className="icon" />
          <span className="hide-400">ステッカー</span>
        </Btn2>
        <Btn2 onClick={() => sendDummyChat("membership")}>
          <MdPersonAdd className="icon" />
          <span className="hide-400">メンバー</span>
        </Btn2>
        <Btn2 onClick={() => sendDummyChat("gift")}>
          <MdCardGiftcard className="icon" />
          <span className="hide-400">ギフト</span>
        </Btn2>
        {/* <Btn2 onClick={() => sendDummyChat("random")}>
          <MdGrade className="icon" />
          <span className="hide-400">ランダム</span>
        </Btn2> */}
      </div>
    </Line>
  </>;
}