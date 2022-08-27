import { useCallback, useContext } from 'react';
import {
  MdChat,
  MdAttachMoney,
  MdPersonAdd,
  MdCardGiftcard,
} from 'react-icons/md';
import { SiTwitch } from 'react-icons/si';
import { ChatItemContext } from '../context/chatItem';
import { useSettings } from '../hooks/useSettings';
import { TTVChatItem } from '../services/liveChatService';
import { generateDummy, sendBouyomiTTV } from '../services/liveChatTwitch';
import { sendChatApi } from '../utils/sendChatApi';
import { TwitchChatItem } from '../utils/twitch';
import { uuid } from '../utils/uuid';
import { Btn2, Line } from './LiveView';

export const DummySender2: React.FC = () => {
  const { settings } = useSettings();
  const { dispatch: dispatchChatItem } = useContext(ChatItemContext);
  const sendDummyChat = useCallback(
    (type: TwitchChatItem['type']) => {
      const ttvItem: TwitchChatItem = generateDummy(type);
      const r = (t?: number) => Math.random() < (t || 0.5);
      const item: TTVChatItem = {
        type: 'Twitch',
        id: uuid(),
        isDummy: true,
        data: ttvItem,
      };
      dispatchChatItem({
        type: 'ADD',
        config: settings,
        actionId: uuid(),
        chatItem: [item],
      });
      if (settings.bouyomi.enable) {
        sendBouyomiTTV(ttvItem, settings.bouyomi);
      }
      sendChatApi('twitch', item);
    },
    [dispatchChatItem, settings]
  );
  return (
    <>
      <Line>
        <p className="title">
          表示テスト
          <SiTwitch className="icon" />
        </p>
        <div className="body">
          <Btn2 onClick={() => sendDummyChat('Normal')}>
            <MdChat className="icon" />
            <span className="hide-400">通常</span>
          </Btn2>
          <Btn2 onClick={() => sendDummyChat('Cheer')}>
            <MdAttachMoney className="icon" />
            <span className="hide-400">Cheer</span>
          </Btn2>
          <Btn2 onClick={() => sendDummyChat('Sub')}>
            <MdPersonAdd className="icon" />
            <span className="hide-400">サブスク</span>
          </Btn2>
          <Btn2 onClick={() => sendDummyChat('SubMysteryGift')}>
            <MdCardGiftcard className="icon" />
            <span className="hide-400">ギフト</span>
          </Btn2>
        </div>
      </Line>
    </>
  );
};
