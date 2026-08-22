/**
 * API 엔드포인트 상수 정의
 * baseURL에 /api/lab이 포함되므로 상대 경로 사용
 */

// ===== 인증 API =====
export const AUTH_API = {
  LOGIN: '/auth/login',
  REFRESH: '/auth/refresh',
  ME: '/users/me',
} as const

// ===== VR API =====
export const VR_API = {
  STATE: '/vr/state',
  PRICE: '/vr/price',
  CASH_BALANCE: '/vr/cash-balance',
  STATUS: '/vr/status',
  RUN: '/vr/run',
  FILLS: '/vr/fills',
  FILL_DELETE: (id: number | string) => `/vr/fills/${id}/delete`,
  CYCLES: '/vr/cycles',
  ROLLOVER: '/vr/cycles/rollover',
  SETTINGS_UPDATE: '/vr/settings/update',
  EVENTS: '/vr/events',
  CANDLES: '/vr/candles',
} as const

// ===== 근무일지 API =====
export const WORKLOG_API = {
  LIST: '/worklog',
  SEARCH: '/worklog/search',
  CREATE: '/worklog',
  UPDATE: (id: number | string) => `/worklog/${id}/update`,
  DELETE: (id: number | string) => `/worklog/${id}/delete`,
  UPLOAD_PHOTOS: '/worklog/upload-photos',
  JOB_OPTIONS: '/worklog/job-options',
  CREATE_JOB_OPTION: '/worklog/job-options',
  DELETE_JOB_OPTION: (id: number | string) => `/worklog/job-options/${id}/delete`,
  CATEGORY_OPTIONS: '/worklog/category-options',
  CREATE_CATEGORY_OPTION: '/worklog/category-options',
  REORDER_CATEGORY_OPTIONS: '/worklog/category-options/reorder',
  SORT_PREF: '/worklog/sort-pref',
} as const

// ===== 지출내역 API =====
export const EXPENSE_API = {
  LIST: '/expense',
  SEARCH: '/expense/search',
  CREATE: '/expense',
  UPDATE: (id: number | string) => `/expense/${id}/update`,
  DELETE: (id: number | string) => `/expense/${id}/delete`,
} as const
