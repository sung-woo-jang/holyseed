/**
 * API 엔드포인트 상수 정의
 * baseURL에 /api/lab이 포함되므로 상대 경로 사용
 */

// ===== 인증 API =====
export const AUTH_API = {
  REGISTER: '/auth/register',
  LOGIN: '/auth/login',
  REFRESH: '/auth/refresh',
  ME: '/users/me',
} as const

// ===== VR API =====
export const VR_API = {
  STATE: '/vr/state',
  FILLS: '/vr/fills',
  FILL_DELETE: (id: number | string) => `/vr/fills/${id}/delete`,
  CYCLES: '/vr/cycles',
  ROLLOVER: '/vr/cycles/rollover',
  SETTINGS_UPDATE: '/vr/settings/update',
} as const

// ===== 근무일지 API =====
export const WORKLOG_API = {
  LIST: '/worklog',
  SEARCH: '/worklog/search',
  CREATE: '/worklog',
  UPDATE: (id: number | string) => `/worklog/${id}/update`,
  DELETE: (id: number | string) => `/worklog/${id}/delete`,
} as const

// ===== 일정 API =====
export const SCHEDULE_API = {
  LIST: '/schedules',
  SEARCH: '/schedules/search',
  CREATE: '/schedules',
  UPDATE: (id: number | string) => `/schedules/${id}/update`,
  DELETE: (id: number | string) => `/schedules/${id}/delete`,
} as const

// ===== 저축 API =====
export const SAVING_API = {
  RECORDS: '/saving/records',
  SUMMARY: '/saving/summary',
  PLAN: '/saving/plan',
  UPSERT: '/saving/records',
  UPDATE: (id: number | string) => `/saving/records/${id}/update`,
  DELETE: (id: number | string) => `/saving/records/${id}/delete`,
} as const

// ===== Lab API =====
// 구 백오피스의 ADMIN_API 이름을 유지 — film-optimizer 훅들이 그대로 참조
export const ADMIN_API = {
  // 필름 재단 최적화
  FILM_OPTIMIZER: {
    // 필름지 관리
    FILMS: {
      LIST: '/film-optimizer/films',
      CREATE: '/film-optimizer/films',
      DETAIL: (id: number | string) => `/film-optimizer/films/${id}`,
      UPDATE: (id: number | string) => `/film-optimizer/films/${id}/update`,
      DELETE: (id: number | string) => `/film-optimizer/films/${id}/delete`,
    },
    // 재단 프로젝트 관리
    PROJECTS: {
      LIST: '/film-optimizer/projects',
      CREATE: '/film-optimizer/projects',
      DETAIL: (id: number | string) => `/film-optimizer/projects/${id}`,
      UPDATE: (id: number | string) => `/film-optimizer/projects/${id}/update`,
      DELETE: (id: number | string) => `/film-optimizer/projects/${id}/delete`,
    },
    // 재단 조각 관리
    PIECES: {
      ADD: (projectId: number | string) => `/film-optimizer/projects/${projectId}/pieces`,
      UPDATE: (projectId: number | string, pieceId: number | string) =>
        `/film-optimizer/projects/${projectId}/pieces/${pieceId}/update`,
      DELETE: (projectId: number | string, pieceId: number | string) =>
        `/film-optimizer/projects/${projectId}/pieces/${pieceId}/delete`,
      TOGGLE_COMPLETE: (projectId: number | string, pieceId: number | string) =>
        `/film-optimizer/projects/${projectId}/pieces/${pieceId}/toggle-complete`,
    },
  },
} as const
