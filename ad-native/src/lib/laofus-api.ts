import axios from 'axios';
import { BASE_URL, installAuth } from './api';

/** 라오어(무한매수법) API — 소유자 로그인 토큰이 필요하다(자산일기 API와 같은 토큰) */
/** 자산일기 API와 같은 도메인(nginx가 /api/laofus를 실주문 프로세스로 보냄) — .../api/ad → .../api/laofus */
export const LAOFUS_BASE_URL = BASE_URL.replace(/\/api\/ad\/?$/, '/api/laofus');

export const laofusApi = axios.create({
  baseURL: LAOFUS_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

installAuth(laofusApi);
