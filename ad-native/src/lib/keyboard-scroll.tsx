import { createContext, useCallback, useContext, useRef, type RefObject } from 'react';
import { findNodeHandle, ScrollView, type TextInput } from 'react-native';

type ScrollToInput = (input: TextInput | null) => void;

const KeyboardScrollContext = createContext<ScrollToInput | null>(null);

export const KeyboardScrollProvider = KeyboardScrollContext.Provider;

/**
 * KeyboardAvoidingView는 컨테이너 높이만 줄일 뿐, 이미 축소된 영역 안에서 포커스된
 * 입력창까지 스크롤해주지는 않는다 — 그래서 스크롤 영역 하단부 입력창은 계속 키보드에
 * 가려진 채 남는다. 이 훅은 그 스크롤을 대신 해준다: 키보드가 이미 화면을 줄여놓은 뒤라,
 * 포커스된 입력창을 스크롤 영역 위쪽 가까이로만 옮기면 자동으로 키보드 위에 위치하게 된다.
 */
export function useKeyboardScrollRegistration(): { scrollRef: RefObject<ScrollView | null>; scrollToInput: ScrollToInput } {
  const scrollRef = useRef<ScrollView>(null);

  const scrollToInput = useCallback<ScrollToInput>((input) => {
    const scrollNode = scrollRef.current;
    const scrollHandle = scrollNode && findNodeHandle(scrollNode);
    if (!scrollNode || !scrollHandle || !input) return;
    input.measureLayout(
      scrollHandle,
      (_x, y) => scrollNode.scrollTo({ y: Math.max(0, y - 24), animated: true }),
      () => {},
    );
  }, []);

  return { scrollRef, scrollToInput };
}

/** Provider 밖에서 쓰이면 null이라 안전하게 no-op 처리하면 된다. */
export function useKeyboardScroll(): ScrollToInput | null {
  return useContext(KeyboardScrollContext);
}
