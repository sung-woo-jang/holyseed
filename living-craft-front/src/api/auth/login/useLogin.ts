/**
 * 로그인 Mutation 훅
 */

import type { LoginResponse } from '@api';
import { MOCK_LOGIN_RESPONSE, mockDelay } from '@mocks';
import { useMutation } from '@tanstack/react-query';
import { showSuccessToast } from '@utils/toast';

import { useAuthStore } from '../../../store/authStore';
import { axiosInstance } from '../../axios';
import { AUTH_API } from '../../endpoints';

interface LoginParams {
  authorizationCode: string;
  referrer?: 'DEFAULT' | 'SANDBOX';
}

/**
 * 로그인 API 함수
 */
async function login(params: LoginParams): Promise<LoginResponse> {
  const { authorizationCode, referrer = 'DEFAULT' } = params;

  // 개발 환경에서는 Mock 데이터 반환
  if (__DEV__) {
    console.log('[Mock API] POST /auth/login');
    await mockDelay();
    return {
      ...MOCK_LOGIN_RESPONSE,
      accessToken: 'mock-access-token-' + Date.now(),
      refreshToken: 'mock-refresh-token-' + Date.now(),
    };
  }

  const { data } = await axiosInstance.post<LoginResponse>(AUTH_API.LOGIN, {
    authorizationCode,
    referrer,
  });
  return data.data;
}

/**
 * 로그인 훅
 */
export function useLogin() {
  const { setTokens, setUser } = useAuthStore();

  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      // 토큰 저장
      setTokens(data.accessToken, data.refreshToken);
      // 사용자 정보 저장
      setUser(data.user);
      showSuccessToast('로그인 되었습니다.');
    },
  });
}
