import axios from 'axios';
import { BASE_URL as AD_BASE_URL } from './api';
import { clearTokens, getTokens, saveTokens } from './storage';
import { useAuthStore } from '../stores/auth.store';

/**
 * lab(라오어 제외) API — ad와 별도 계정 시스템(lab.users)이지만 실제로는 동일 소유자라
 * 백엔드가 /api/lab에 한해 ad 토큰도 허용하도록 완화됨(JwtStrategy). 그래서 별도 로그인
 * 없이 ad 토큰을 그대로 재사용 — 토큰 만료 시 갱신도 lib/api.ts와 동일하게 ad의
 * auth/refresh 엔드포인트로 직접 처리한다(과거엔 이 인터셉터가 없어서, ad 토큰이 만료된
 * 순간 근무일지/라오어 조회가 전부 401로 조용히 실패해 "데이터가 없다"로 보이는 버그가 있었음).
 */
export const LAB_BASE_URL = 'https://lab.holyseed.p-e.kr/api/lab';

export const labApi = axios.create({
  baseURL: LAB_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

labApi.interceptors.request.use(async (config) => {
  const { accessToken } = await getTokens();
  if (accessToken) {
    config.headers['Authorization'] = `Bearer ${accessToken}`;
  }
  return config;
});

labApi.interceptors.response.use(
  (res) => {
    // SuccessResponse<T> 언래핑: { success, message, data: T, timestamp } → T
    if (res.data && typeof res.data === 'object' && 'success' in res.data && 'data' in res.data) {
      res.data = res.data.data;
    }
    return res;
  },
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const { refreshToken } = await getTokens();
        if (!refreshToken) throw new Error('no refresh token');

        const { data: raw } = await axios.post(`${AD_BASE_URL}/auth/refresh`, { refreshToken });
        const payload = raw?.data ?? raw;
        await saveTokens(payload.accessToken, payload.refreshToken);
        useAuthStore.getState().setAuth(
          { accessToken: payload.accessToken, refreshToken: payload.refreshToken },
          useAuthStore.getState().user!,
        );
        original.headers['Authorization'] = `Bearer ${payload.accessToken}`;
        return labApi(original);
      } catch {
        await clearTokens();
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(error);
  },
);
