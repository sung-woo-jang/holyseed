/**
 * 로그아웃 Mutation 훅
 */

import { mockDelay } from '@mocks';
import { useMutation } from '@tanstack/react-query';
import { showSuccessToast } from '@utils/toast';

import { useAuthStore } from '../../../store/authStore';
import { axiosInstance } from '../../axios';
import { AUTH_API } from '../../endpoints';

/**
 * 로그아웃 API 함수
 */
async function logout(): Promise<void> {
  // 개발 환경에서는 로그만 출력
  if (__DEV__) {
    console.log('[Mock API] POST /auth/logout');
    await mockDelay(300);
    return;
  }

  await axiosInstance.post(AUTH_API.LOGOUT);
}

/**
 * 로그아웃 훅
 */
export function useLogout() {
  const { logout: clearAuth } = useAuthStore();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      // 로컬 상태 초기화
      clearAuth();
      showSuccessToast('로그아웃 되었습니다.');
    },
    onError: () => {
      // 에러가 발생해도 로컬 상태는 초기화
      clearAuth();
    },
  });
}
