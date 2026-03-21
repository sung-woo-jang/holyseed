/**
 * Living Craft Auth Store
 * Zustand를 사용한 인증 상태 관리
 */

import { create } from 'zustand';

import type { User } from '../api/types';

/**
 * Auth 스토어 상태 타입
 */
interface AuthState {
  // 상태
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isInitialized: boolean;

  // 액션
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  initialize: () => Promise<void>;
}

/**
 * Auth 스토어 생성
 */
export const useAuthStore = create<AuthState>((set, get) => ({
  // 초기 상태
  accessToken: null,
  refreshToken: null,
  user: null,
  isInitialized: false,

  /**
   * 토큰 설정
   * - AccessToken과 RefreshToken을 저장
   * - AsyncStorage에도 저장 (React Native)
   */
  setTokens: (accessToken: string, refreshToken: string) => {
    set({ accessToken, refreshToken });

    // AsyncStorage에 저장 (React Native 환경)
    // TODO: React Native AsyncStorage 구현
    // try {
    //   AsyncStorage.setItem('accessToken', accessToken);
    //   AsyncStorage.setItem('refreshToken', refreshToken);
    // } catch (error) {
    //   console.error('Failed to save tokens to AsyncStorage:', error);
    // }
  },

  /**
   * 사용자 정보 설정
   */
  setUser: (user: User) => {
    set({ user });
  },

  /**
   * 로그아웃
   * - 모든 인증 정보 초기화
   * - AsyncStorage에서도 제거
   */
  logout: () => {
    set({
      accessToken: null,
      refreshToken: null,
      user: null,
    });

    // AsyncStorage에서 제거 (React Native 환경)
    // TODO: React Native AsyncStorage 구현
    // try {
    //   AsyncStorage.removeItem('accessToken');
    //   AsyncStorage.removeItem('refreshToken');
    // } catch (error) {
    //   console.error('Failed to remove tokens from AsyncStorage:', error);
    // }
  },

  /**
   * 인증 여부 확인
   */
  isAuthenticated: () => {
    const { accessToken } = get();
    return accessToken !== null;
  },

  /**
   * 앱 시작 시 초기화
   * - AsyncStorage에서 토큰 복원
   */
  initialize: async () => {
    // AsyncStorage에서 토큰 복원 (React Native 환경)
    // TODO: React Native AsyncStorage 구현
    // try {
    //   const accessToken = await AsyncStorage.getItem('accessToken');
    //   const refreshToken = await AsyncStorage.getItem('refreshToken');
    //
    //   if (accessToken && refreshToken) {
    //     set({ accessToken, refreshToken });
    //
    //     // 사용자 정보 조회
    //     // const user = await fetchMe();
    //     // set({ user });
    //   }
    // } catch (error) {
    //   console.error('Failed to restore tokens from AsyncStorage:', error);
    // } finally {
    //   set({ isInitialized: true });
    // }

    set({ isInitialized: true });
  },
}));

/**
 * Auth 스토어 기본 export
 */
export default useAuthStore;
