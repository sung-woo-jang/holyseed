import { useEffect } from 'react';

/**
 * 자동 스크롤 기능을 제공하는 커스텀 훅
 */
export const useAutoPlay = (
  enabled: boolean,
  interval: number,
  currentIndex: number,
  itemCount: number,
  onScrollToIndex: (index: number) => void
) => {
  useEffect(() => {
    if (!enabled || itemCount === 0) return;

    const timer = setInterval(() => {
      const nextIndex = currentIndex + 1;

      // 마지막 아이템에 도달하면 자동 스크롤 중지
      if (nextIndex < itemCount) {
        onScrollToIndex(nextIndex);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [enabled, interval, currentIndex, itemCount, onScrollToIndex]);
};
