import axios from 'axios';
import { clearLabTokens, getLabTokens, saveLabTokens } from './lab-storage';
import { useLabAuthStore } from '../stores/labAuth.store';

/** ad와 완전히 분리된 lab 계정(lab.users)용 API — 토큰/스토리지/스토어 전부 독립 */
export const LAB_BASE_URL = 'https://lab.holyseed.p-e.kr/api/lab';

export const labApi = axios.create({
  baseURL: LAB_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

labApi.interceptors.request.use(async (config) => {
  const { accessToken } = await getLabTokens();
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
        const { refreshToken } = await getLabTokens();
        if (!refreshToken) throw new Error('no refresh token');

        const { data: raw } = await axios.post(`${LAB_BASE_URL}/auth/refresh`, { refreshToken });
        const payload = raw?.data ?? raw;
        await saveLabTokens(payload.accessToken, payload.refreshToken);
        useLabAuthStore.getState().setAuth(
          { accessToken: payload.accessToken, refreshToken: payload.refreshToken },
          useLabAuthStore.getState().user!,
        );
        original.headers['Authorization'] = `Bearer ${payload.accessToken}`;
        return labApi(original);
      } catch {
        await clearLabTokens();
        useLabAuthStore.getState().logout();
      }
    }
    return Promise.reject(error);
  },
);
