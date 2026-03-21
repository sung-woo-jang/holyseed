/**
 * 토큰 갱신 Mutation 훅
 */

import type { RefreshTokenResponse } from '@api';
import { MOCK_REFRESH_RESPONSE, mockDelay } from '@mocks';
import { useMutation } from '@tanstack/react-query';

import { useAuthStore } from '../../../store/authStore';
import { axiosInstance } from '../../axios';
import { AUTH_API } from '../../endpoints';

/**
 * 토큰 갱신 API 함수
 */
async function refreshToken(token: string): Promise<RefreshTokenResponse> {
  // 개발 환경에서는 Mock 데이터 반환
  if (__DEV__) {
    console.log('[Mock API] POST /auth/refresh');
    await mockDelay(300);
    return {
      ...MOCK_REFRESH_RESPONSE,
      accessToken: 'mock-access-token-refreshed-' + Date.now(),
      refreshToken: 'mock-refresh-token-refreshed-' + Date.now(),
    };
  }

  const { data } = await axiosInstance.post<RefreshTokenResponse>(AUTH_API.REFRESH, {
    refreshToken: token,
  });
  return data.data;
}

/**
 * 토큰 갱신 훅
 */
export function useRefreshToken() {
  const { setTokens } = useAuthStore();

  return useMutation({
    mutationFn: refreshToken,
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken);
    },
  });
}
