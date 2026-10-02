import type { GestureResponderEvent } from 'react-native';

/**
 * 차트 스크럽(터치+드래그)이 시작되면 바깥 ScrollView가 제스처를 가져가지 못하게 한다.
 * - onResponderGrant가 true를 돌려줘야 RN이 네이티브 스크롤(안드로이드 requestDisallowInterceptTouchEvent)을 막는다
 * - onResponderTerminationRequest=false: 손이 위아래로 흔들려도 JS 쪽 ScrollView에 응답자를 넘기지 않는다
 */
export function scrubLock(onGrant: (e: GestureResponderEvent) => void) {
  return {
    onResponderGrant: (e: GestureResponderEvent) => {
      onGrant(e);
      return true;
    },
    onResponderTerminationRequest: () => false,
  };
}
