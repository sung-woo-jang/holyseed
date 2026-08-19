import axios from 'axios';
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

api.interceptors.request.use(async (config) => {
  const { accessToken } = await getTokens();
  if (accessToken) {
    config.headers['Authorization'] = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
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

        const { data: raw } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        const payload = raw?.data ?? raw;
        await saveTokens(payload.accessToken, payload.refreshToken);
        useAuthStore.getState().setAuth(
          { accessToken: payload.accessToken, refreshToken: payload.refreshToken },
          useAuthStore.getState().user!,
        );
        original.headers['Authorization'] = `Bearer ${payload.accessToken}`;
        return api(original);
      } catch {
        await clearTokens();
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(error);
  },
);
