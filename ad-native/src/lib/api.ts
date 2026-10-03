import axios, { type AxiosInstance } from 'axios';
import Constants from 'expo-constants';
import { clearTokens, getTokens, saveTokens } from './storage';
import { useAuthStore } from '../stores/auth.store';

export const BASE_URL =
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ?? 'https://ad.holyseed.p-e.kr/api/ad';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * 인증 헤더 부착 + 401 시 갱신 토큰으로 1회 재시도 + SuccessResponse 봉투 벗기기.
 * 자산일기 API(api)와 라오어 API(laofusApi)가 같은 로그인 토큰을 쓴다 — 라오어 조회도 소유자 로그인이 필요해졌다.
 */
export function installAuth(instance: AxiosInstance): void {
  instance.interceptors.request.use(async (config) => {
    const { accessToken } = await getTokens();
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  });

  instance.interceptors.response.use(
    (res) => {
      // SuccessResponse<T> 언래핑: { success, message, data: T, timestamp } → T
      if (res.data && typeof res.data === 'object' && 'success' in res.data && 'data' in res.data) {
        res.data = res.data.data;
      }
      return res;
    },
    async (error) => {
      const original = error.config;
      if (error.response?.status === 401 && original && !original._retry) {
        original._retry = true;
        try {
          const { refreshToken } = await getTokens();
          if (!refreshToken) throw new Error('no refresh token');

          const { data: raw } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
          const payload = raw?.data ?? raw;
          await saveTokens(payload.accessToken, payload.refreshToken);
          const state = useAuthStore.getState();
          if (state.user) state.setAuth({ accessToken: payload.accessToken, refreshToken: payload.refreshToken }, state.user);
          original.headers['Authorization'] = `Bearer ${payload.accessToken}`;
          return instance(original);
        } catch {
          await clearTokens();
          useAuthStore.getState().logout();
        }
      }
      return Promise.reject(error);
    },
  );
}

installAuth(api);
