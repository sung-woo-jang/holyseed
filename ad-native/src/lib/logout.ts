import { clearTokens } from './storage';
import { queryClient } from './query-client';
import { useAuthStore } from '../stores/auth.store';

/** 로그아웃 — 토큰과 조회 캐시를 비운다(캐시를 남기면 같은 기기의 다음 계정에 이전 데이터가 잠깐 보일 수 있음) */
export async function performLogout(): Promise<void> {
  await clearTokens();
  queryClient.clear();
  useAuthStore.getState().logout();
}
