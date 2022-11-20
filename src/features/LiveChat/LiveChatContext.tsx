import React from 'react';
import { createContext, useReducer } from 'react';
import { LiveChat } from '.';

export const LiveChatContext = createContext<LiveChatContextProps>({
  state: {},
  dispatch: (action: LiveChatContextAction) => {},
});

const initialState = {};

type LiveChatContextState = {
  [key: string]: {
    url: string;
    liveChat: LiveChat;
  };
};
interface LiveChatContextProps {
  state: LiveChatContextState;
  dispatch: (action: LiveChatContextAction) => void;
}

export type LiveChatContextAction = UpdateAction | AddAction | DeleteAction;

interface BaseAction {
  type: string;
}

interface UpdateAction extends BaseAction {
  type: 'UPDATE';
  targetId: string;
  liveChat: LiveChat;
}
interface AddAction extends BaseAction {
  type: 'ADD';
  liveChat: LiveChat;
}
interface DeleteAction extends BaseAction {
  type: 'DELETE';
  targetId: string;
}

function liveChatReducer(
  state: LiveChatContextState,
  action: LiveChatContextAction
) {
  switch (action.type) {
    case 'ADD': {
      return {
        ...state,
        [action.liveChat.id]: { url: '', liveChat: action.liveChat },
      };
      break;
    }
    case 'UPDATE': {
      break;
    }
    case 'DELETE': {
      break;
    }
  }
  return { ...state };
}

export const LiveChatProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(liveChatReducer, initialState);
  return (
    <LiveChatContext.Provider value={{ state: state, dispatch: dispatch }}>
      {children}
    </LiveChatContext.Provider>
  );
};
