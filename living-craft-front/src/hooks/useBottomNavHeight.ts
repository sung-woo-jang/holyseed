import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  BOTTOM_NAV_BASE_HEIGHT,
  BOTTOM_NAV_EXTRA_SPACE,
  BOTTOM_NAV_MIN_BOTTOM,
} from '../constants/navigation';

/**
 * BottomNavigation의 총 높이를 계산하는 훅
 *
 * 기기별 Safe Area Insets를 고려하여 동적으로 계산합니다.
 *
 * @returns {number} BottomNavigation의 총 높이 (px)
 *
 * @example
 * const bottomNavHeight = useBottomNavHeight();
 * // iPhone 14: ~94.5px (74.5 + 0 + 20)
 * // iPhone 14 Pro Max: ~108.5px (74.5 + 34 + 20)
 */
export const useBottomNavHeight = (): number => {
  const insets = useSafeAreaInsets();

  return (
    BOTTOM_NAV_BASE_HEIGHT +
    Math.max(insets.bottom, BOTTOM_NAV_MIN_BOTTOM) +
    BOTTOM_NAV_EXTRA_SPACE
  );
};
