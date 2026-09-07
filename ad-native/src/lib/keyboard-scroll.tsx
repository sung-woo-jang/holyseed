import { createContext, useCallback, useContext, useRef, type RefObject } from 'react';
import { ScrollView, type NativeScrollEvent, type NativeSyntheticEvent, type TextInput } from 'react-native';

type ScrollToInput = (input: TextInput | null) => void;
type OnScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => void;

const KeyboardScrollContext = createContext<ScrollToInput | null>(null);

export const KeyboardScrollProvider = KeyboardScrollContext.Provider;

/**
 * KeyboardAvoidingView는 컨테이너 높이만 줄일 뿐, 이미 축소된 영역 안에서 포커스된
 * 입력창까지 스크롤해주지는 않는다 — 그래서 스크롤 영역 하단부 입력창은 계속 키보드에
 * 가려진 채 남는다. 이 훅은 그 스크롤을 대신 해준다.
 *
 * `measureLayout(관련 노드, ...)`으로 한 번에 상대 좌표를 구하는 방식은 New Architecture에서
 * 조용히 실패하는 경우가 있어(onFail도 안 불리고 그냥 아무 일도 안 일어남), 대신 입력창과
 * 스크롤뷰 각각의 화면 절대좌표(measure)를 따로 구해 차이를 계산하고, 거기에 현재 스크롤
 * 오프셋(onScroll로 계속 추적)을 더해 목표 offset을 직접 계산하는 더 단순한 방식을 쓴다.
 * 포커스 직후 바로 재면 애니메이션/레이아웃이 아직 안 정착해 값이 튈 수 있어 한 프레임 미룬다.
 */
export function useKeyboardScrollRegistration(): { scrollRef: RefObject<ScrollView | null>; scrollToInput: ScrollToInput; onScroll: OnScroll } {
  const scrollRef = useRef<ScrollView>(null);
  const scrollOffsetRef = useRef(0);

  const onScroll = useCallback<OnScroll>((e) => {
    scrollOffsetRef.current = e.nativeEvent.contentOffset.y;
  }, []);

  const scrollToInput = useCallback<ScrollToInput>((input) => {
    const scrollNode = scrollRef.current;
    if (!scrollNode || !input) return;
    // RN 타입 선언엔 measure가 없지만(NativeMethods 미포함), 런타임엔 항상 존재한다 —
    // RN 공식 문서도 ScrollView ref로 measure/measureLayout을 쓸 수 있다고 명시함.
    const measurableScroll = scrollNode as unknown as { measure: TextInput['measure'] };
    requestAnimationFrame(() => {
      input.measure((_ix: number, _iy: number, _iw: number, _ih: number, inputPageY: number) => {
        measurableScroll.measure((_sx: number, _sy: number, _sw: number, _sh: number, scrollPageY: number) => {
          const targetY = scrollOffsetRef.current + (inputPageY - scrollPageY) - 24;
          scrollNode.scrollTo({ y: Math.max(0, targetY), animated: true });
        });
      });
    });
  }, []);

  return { scrollRef, scrollToInput, onScroll };
}

/** Provider 밖에서 쓰이면 null이라 안전하게 no-op 처리하면 된다. */
export function useKeyboardScroll(): ScrollToInput | null {
  return useContext(KeyboardScrollContext);
}
