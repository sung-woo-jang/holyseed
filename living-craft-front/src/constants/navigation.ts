import { NavigationItem } from '@types';

export const BOTTOM_NAV_ITEMS: NavigationItem[] = [
  { label: '홈', path: '/', iconName: 'icon-home-blue' },
  { label: '포트폴리오', path: '/portfolio', iconName: 'icon-briefcase' },
  { label: '견적받기', path: '/reservation', iconName: 'icon-document-won-blue' },
  { label: '마이페이지', path: '/my', iconName: 'icon-person-default-man' },
];

/**
 * 탭바 설정 인터페이스
 * Apps-in-Toss 가이드라인: 항상 플로팅 형태만 사용
 */
export interface TabBarConfig {
  isVisible: boolean; // true: 표시, false: 숨김
}

/**
 * 경로별 탭바 설정
 * 모든 탭바는 플로팅 형태로 표시됨 (Apps-in-Toss 가이드라인 준수)
 */
export const ROUTE_TAB_CONFIG: Record<string, TabBarConfig> = {
  '/': { isVisible: true }, // 홈
  '/portfolio': { isVisible: true }, // 포트폴리오
  '/reservation': { isVisible: true }, // 예약
  '/reviews': { isVisible: true }, // 리뷰
  '/my': { isVisible: true }, // 마이페이지
};

/**
 * BottomNavigation 높이 계산용 상수
 * Apps-in-Toss 가이드라인: 플로팅 형태의 탭바 사용
 */

/**
 * BottomNavigation 내부 컴포넌트의 기본 높이
 * - paddingTop: 9px
 * - paddingBottom: 8px
 * - navItem paddingVertical: 16px (8px × 2)
 * - 아이콘: 24px
 * - 텍스트 lineHeight: 16.5px
 * - 아이콘-텍스트 간격: 1px
 * = 총 74.5px
 */
export const BOTTOM_NAV_BASE_HEIGHT = 74.5;

/**
 * BottomNavigation의 최소 하단 여백
 * Safe Area가 없는 기기를 위한 최소값
 */
export const BOTTOM_NAV_MIN_BOTTOM = 8;

/**
 * BottomNavigation 아래 추가 여유 공간
 * 스크롤 시 컨텐츠가 내비게이션에 너무 가까이 붙지 않도록
 */
export const BOTTOM_NAV_EXTRA_SPACE = 20;

/**
 * @deprecated 동적 계산을 위해 useBottomNavHeight() 훅을 사용하세요
 *
 * 레거시 고정 높이 값
 * 이전 버전과의 호환성을 위해 남겨둠
 */
export const TAB_BAR_HEIGHT = 130;
