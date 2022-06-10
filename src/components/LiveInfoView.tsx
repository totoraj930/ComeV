import { MdPerson } from "react-icons/md";
import { SiTwitch, SiYoutube } from "react-icons/si"
import styled from "styled-components"
import { LiveChat } from "../services/liveChatService";

export const LiveInfoView: React.VFC<{
  liveChatList: LiveChat[];
}> = ({ liveChatList }) => {

  return (<>
    <Wrap>
      { liveChatList.map((liveChat) => {
        if (!liveChat.isStarted) return "";
        return (<Viewership key={liveChat.id} title="視聴者数">
          { liveChat.type === "YouTube" && <SiYoutube className="icon" /> }
          { liveChat.type === "Twitch" && <SiTwitch className="icon" /> }
          { liveChat.type === "Empty" && <MdPerson className="icon" /> }
          <span>{liveChat.metaData.viewership || " "}</span>
        </Viewership>);
      }) }
    </Wrap>
  </>);
}

const Wrap = styled.div`
  display: flex;
  gap: 5px;
`;

const Viewership = styled.p `
  display: flex;
  align-items: center;
  gap: 0 3px;
  span {
    font-size: 15px;
  }
  .icon {
    min-width: 20px;
    min-height: 20px;
  }
`
