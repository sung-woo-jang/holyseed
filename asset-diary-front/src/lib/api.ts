import axios from 'axios';
import { clearTokens, getTokens, saveTokens } from './storage';
import { useAuthStore } from '../stores/auth.store';

const BASE_URL = process.env['SERVER_BASE_URL'] ?? 'http://localhost:8000/api/ad';

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
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const { refreshToken } = await getTokens();
        if (!refreshToken) throw new Error('no refresh token');

        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        await saveTokens(data.accessToken, data.refreshToken);
        useAuthStore.getState().setAuth(
          { accessToken: data.accessToken, refreshToken: data.refreshToken },
          useAuthStore.getState().user!,
        );
        original.headers['Authorization'] = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        await clearTokens();
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(error);
  },
);
