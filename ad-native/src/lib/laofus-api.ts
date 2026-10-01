import axios from 'axios';
import { BASE_URL } from './api';

/** 라오어(무한매수법) API — 백엔드 전체가 @Public()이라 인증 헤더가 없음 */
/** 자산일기 API와 같은 도메인(nginx가 /api/laofus를 실주문 프로세스로 보냄) — .../api/ad → .../api/laofus */
export const LAOFUS_BASE_URL = BASE_URL.replace(/\/api\/ad\/?$/, '/api/laofus');

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
