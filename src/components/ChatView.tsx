import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MdKeyboardArrowDown } from 'react-icons/md';
import styled from 'styled-components';
import { useSettings } from '../hooks/useSettings';
import { ChatItemContextState } from '../context/chatItem';

function scrollToBottom($elm: HTMLElement, duration = 100) {
  let isCancel = false;
  if (duration === 0) {
    $elm.scrollTo({
      top: $elm.scrollHeight - $elm.clientHeight,
    });
    return {
      cancel: () => {},
      promise: Promise.resolve(isCancel),
    };
  }
  return {
    cancel: () => {
      isCancel = true;
    },
    promise: new Promise<boolean>((resolve) => {
      const targetY = $elm.scrollHeight - $elm.clientHeight;
      const startTime = Date.now();
      const startY = $elm.scrollTop;
      const diffY = targetY - startY;
      const task = () => {
        if (isCancel) {
          resolve(isCancel);
          return;
        }
        const time = Date.now();
        const progress = Math.min(1, (time - startTime) / duration);
        $elm.scrollTo({
          top: diffY * progress + startY,
        });
        if (progress < 1) {
          requestAnimationFrame(task);
        } else {
          resolve(isCancel);
        }
      };
      task();
    }),
  };
}

export const ChatView: React.FC<{
  chatItems: ChatItemContextState;
}> = ({ chatItems }) => {
  const { settings } = useSettings();
  const enableScroll = useRef<boolean>(true);
  const lastScrollTime = useRef<number>(Date.now());
  const $view = useRef<HTMLUListElement>(null);
  const scrollCancel = useRef<() => void>(() => {});
  const [showScrollBtn, setShowScrollBtn] = useState<boolean>(false);

  const chatItemViewList = useMemo(() => {
    return [];
    // return chatItems.map((item, i) => <li key={item.id}><ChatItemView chatItem={item} /></li>);
  }, [chatItems]);

  useEffect(() => {
    if (!$view.current) return;
    if (enableScroll.current) {
      // scrollCancel.current();
      const task = scrollToBottom(
        $view.current,
        settings.useSmoothScroll ? 50 : 0
      );
      task.promise.then((isCancel) => {
        setShowScrollBtn(isCancel);
      });
      scrollCancel.current = task.cancel;
      lastScrollTime.current = Date.now();
    }
  }, [chatItems]);

  const onScroll = () => {
    if (!$view.current) return;
    const $v = $view.current;
    // 一番下までスクロールされていたら
    if ($v.scrollHeight - $v.clientHeight - 200 <= $v.scrollTop) {
      enableScroll.current = true;
      setShowScrollBtn(false);
    } else if (Date.now() - lastScrollTime.current > 60) {
      enableScroll.current = false;
      setShowScrollBtn(true);
    }
  };

  useEffect(() => {}, []);

  return (
    <View className="view">
      <ul ref={$view} onScroll={() => onScroll()}>
        {/* {chatItemViewList} */}
        {chatItems.views}
      </ul>
      {showScrollBtn && (
        <button
          className="btn-1"
          onClick={() => {
            if (!$view.current) return;
            scrollCancel.current();
            const task = scrollToBottom(
              $view.current,
              settings.useSmoothScroll ? 50 : 0
            );
            task.promise.then((isCancel) => {
              setShowScrollBtn(isCancel);
            });
            scrollCancel.current = task.cancel;
            lastScrollTime.current = Date.now();
          }}
        >
          <MdKeyboardArrowDown className="icon" />
        </button>
      )}
    </View>
  );
};

const View = styled.div`
  /* display: flex;
  flex-direction: column; */
  position: relative;
  .btn-1 {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    bottom: 20px;
    right: 40px;
    border-radius: 20px;
    background: var(--c-btn-1-bg);
    color: var(--c-btn-1-c);
    box-shadow: 0 0 8px var(--c-shadow);
    cursor: pointer;
    .icon {
      width: 24px;
      height: 24px;
    }
    &:hover {
      background: var(--c-btn-1-bg-2);
      color: var(--c-btn-1-c-2);
    }
  }
  ul {
    position: absolute;
    display: block;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    overflow-y: scroll;
    ::-webkit-scrollbar {
      width: 15px;
      height: 15px;
      border-width: 0 0 0 1px;
      border-style: solid;
      border-color: var(--c-scrollbar-border);
      @media screen and (max-width: 400px) {
        width: 10px;
        height: 10px;
      }
    }
    ::-webkit-scrollbar-thumb {
      border-radius: 6px;
      background: var(--c-scrollbar-thumb);
    }
    ::-webkit-scrollbar-thumb:hover {
      border-radius: 6px;
      background: var(--c-scrollbar-thumb-h);
    }
    ::-webkit-scrollbar-corner {
      background: var(--c-sub);
    }
  }
  .test {
    min-height: 1000px;
  }
`;
