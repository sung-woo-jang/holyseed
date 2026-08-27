import axios from 'axios';

/** 라오어(무한매수법) API — 백엔드 전체가 @Public()이라 인증 헤더가 없음 */
export const LAOFUS_BASE_URL = 'https://lab.holyseed.p-e.kr/api/laofus';

export const laofusApi = axios.create({
  baseURL: LAOFUS_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

laofusApi.interceptors.response.use((res) => {
  // SuccessResponse<T> 언래핑: { success, message, data: T, timestamp } → T
  if (res.data && typeof res.data === 'object' && 'success' in res.data && 'data' in res.data) {
    res.data = res.data.data;
  }
  return res;
});
