import { LayoutAnimation } from 'react-native';

let isAnimating = false;
let animationTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * LayoutAnimation 중복 실행을 방지하는 유틸리티 함수
 * 이전 애니메이션이 완료되기 전에 새로운 애니메이션이 요청되면 무시
 */
export function safeLayoutAnimation(duration: number = 250) {
  if (isAnimating) {
    return;
  }

  isAnimating = true;
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

  // 애니메이션 duration 후 플래그 초기화
  if (animationTimeout) {
    clearTimeout(animationTimeout);
  }

  animationTimeout = setTimeout(() => {
    isAnimating = false;
    animationTimeout = null;
  }, duration);
}
