/**
 * 인증 관련 Query 훅
 * 현재는 인증 상태를 Zustand 스토어에서 관리하므로 Query 훅은 최소화
 */

import { useAuthStore } from '@store/authStore';

/**
 * 인증 여부 확인
 */
export function useIsAuthenticated() {
  return useAuthStore((state) => state.isAuthenticated());
}

/**
 * 현재 사용자 정보
 */
export function useCurrentUser() {
  return useAuthStore((state) => state.user);
}
