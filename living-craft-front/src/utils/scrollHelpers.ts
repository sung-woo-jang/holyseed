import { RefObject } from 'react';
import { ScrollView, View } from 'react-native';

/**
 * 특정 step으로 스크롤
 */
export function scrollToStep(
  scrollViewRef: RefObject<ScrollView>,
  stepRef: View | null,
  offset: number = -16
): void {
  if (!stepRef || !scrollViewRef.current) return;

  stepRef.measureLayout(
    scrollViewRef.current.getInnerViewNode(),
    (_x, y) => {
      scrollViewRef.current?.scrollTo({ y: y + offset, animated: true });
    },
    () => {}
  );
}

/**
 * 지연 후 스크롤 (애니메이션 후 사용)
 */
export function scheduleScrollToStep(
  scrollViewRef: RefObject<ScrollView>,
  stepRef: View | null,
  delay: number = 300,
  offset: number = -16
): void {
  setTimeout(() => scrollToStep(scrollViewRef, stepRef, offset), delay);
}
