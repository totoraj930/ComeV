import { useCallback, useState } from "react";
import { MdPause, MdPlayArrow, MdOpenInBrowser, MdDashboard, MdSettings, MdPerson } from "react-icons/md";
import styled from "styled-components";
import { LiveChat } from "../services/liveChatService";

export const LiveControl: React.VFC<{
  liveChat: LiveChat;
}> = ({ liveChat }) => {
  const [url, setUrl] = useState<string>(liveChat.url);

  const onChangeUrl = useCallback(() => {

  }, []);

  return <>
    <div>
      { liveChat.isStarted && (
        <Btn1>
          <span>切断</span>
        </Btn1>
      )}

      { !liveChat.isStarted && (
        <Btn1>
          <span>接続</span>
        </Btn1>
      )}

      <UrlInput type="text"
        name={liveChat.id} id={liveChat.id}
        readOnly={liveChat.isStarted}
        value={url} onChange={onChangeUrl}
        placeholder="配信URL or チャンネルURL(推奨)"
      />
    </div>

    <div>
      
    <MdPause className="icon" />
    <MdPlayArrow className="icon" />
    <MdOpenInBrowser className="icon" />
    <MdDashboard className="icon" />
    <MdSettings className="icon" />
    <MdPerson className="icon" />
    </div>
  </>;
}

const UrlInput = styled.input`
  
`;

const Btn1 = styled.button`
  
`;