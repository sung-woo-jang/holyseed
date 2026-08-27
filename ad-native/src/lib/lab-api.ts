import axios from 'axios';
import { getTokens } from './storage';

/**
 * lab(라오어 제외) API — ad와 별도 계정 시스템(lab.users)이지만 실제로는 동일 소유자라
 * 백엔드가 /api/lab에 한해 ad 토큰도 허용하도록 완화됨(JwtStrategy). 그래서 별도 로그인
 * 없이 ad 토큰을 그대로 재사용 — 토큰 갱신도 lib/api.ts 쪽 인터셉터가 이미 처리해준다.
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

labApi.interceptors.response.use((res) => {
  // SuccessResponse<T> 언래핑: { success, message, data: T, timestamp } → T
  if (res.data && typeof res.data === 'object' && 'success' in res.data && 'data' in res.data) {
    res.data = res.data.data;
  }
  return res;
});
