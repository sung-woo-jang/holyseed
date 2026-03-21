/**
 * API 엔드포인트 상수 정의
 * baseURL에 /api가 포함되므로 상대 경로 사용
 */

// ===== 인증 API =====
export const AUTH_API = {
  LOGIN: '/admin/auth/login',
  REFRESH: '/admin/auth/refresh',
  ME: '/admin/auth/me',
} as const

// ===== 예약 관리 API =====
export const ADMIN_API = {
  // 예약 관리
  RESERVATIONS: {
    LIST: '/admin/reservations',
    DETAIL: (id: string) => `/admin/reservations/${id}`,
    STATUS: (id: string) => `/admin/reservations/${id}/status`,
    CANCEL: (id: string) => `/admin/reservations/${id}/cancel`,
  },

  // 서비스 관리 (백엔드: /api/admin/services/*)
  SERVICES: {
    LIST: '/admin/services',
    CREATE: '/admin/services',
    DETAIL: (id: number | string) => `/admin/services/${id}`,
    UPDATE: (id: number | string) => `/admin/services/${id}`,
    DELETE: (id: number | string) => `/admin/services/${id}/delete`,
    TOGGLE: (id: number | string) => `/admin/services/${id}/toggle`,
    ORDER: '/admin/services/update-order',
  },

  // 행정구역 관리
  DISTRICTS: {
    LIST: '/admin/districts',
  },

  // 아이콘 관리
  ICONS: {
    LIST: '/icons',
    CREATE: '/icons/admin',
    UPDATE: (id: number | string) => `/icons/admin/${id}/update`,
  },

  // 포트폴리오 관리
  PORTFOLIOS: {
    LIST: '/admin/portfolios',
    CREATE: '/admin/portfolios',
    DETAIL: (id: string) => `/admin/portfolios/${id}`,
    UPDATE: (id: string) => `/admin/portfolios/${id}`,
    DELETE: (id: string) => `/admin/portfolios/${id}/delete`,
  },

  // 리뷰 관리
  REVIEWS: {
    LIST: '/admin/reviews',
    DETAIL: (id: string) => `/admin/reviews/${id}`,
    DELETE: (id: string) => `/admin/reviews/${id}/delete`,
  },

  // 고객 관리
  CUSTOMERS: {
    LIST: '/admin/customers',
    DETAIL: (id: string) => `/admin/customers/${id}`,
  },

  // 운영 설정
  SETTINGS: {
    OPERATING_HOURS: {
      GET: '/admin/settings/operating-hours',
      UPDATE: '/admin/settings/operating-hours',
    },
    HOLIDAYS: {
      LIST: '/admin/settings/holidays',
      CREATE: '/admin/settings/holidays',
      DELETE: (date: string) => `/admin/settings/holidays/${date}`,
    },
  },

  // 대시보드 통계
  DASHBOARD: {
    STATS: '/admin/dashboard/stats',
  },

  // 이미지 업로드
  UPLOAD: {
    IMAGE: '/upload',
  },

  // 프로모션 배너 관리
  PROMOTIONS: {
    LIST: '/admin/promotions',
    CREATE: '/admin/promotions',
    DETAIL: (id: number | string) => `/admin/promotions/${id}`,
    UPDATE: (id: number | string) => `/admin/promotions/${id}/update`,
    DELETE: (id: number | string) => `/admin/promotions/${id}/delete`,
    TOGGLE: (id: number | string) => `/admin/promotions/${id}/toggle`,
    REORDER: '/admin/promotions/reorder',
  },

  // 필름 재단 최적화
  FILM_OPTIMIZER: {
    // 필름지 관리
    FILMS: {
      LIST: '/admin/film-optimizer/films',
      CREATE: '/admin/film-optimizer/films',
      DETAIL: (id: number | string) => `/admin/film-optimizer/films/${id}`,
      UPDATE: (id: number | string) =>
        `/admin/film-optimizer/films/${id}/update`,
      DELETE: (id: number | string) =>
        `/admin/film-optimizer/films/${id}/delete`,
    },
    // 재단 프로젝트 관리
    PROJECTS: {
      LIST: '/admin/film-optimizer/projects',
      CREATE: '/admin/film-optimizer/projects',
      DETAIL: (id: number | string) => `/admin/film-optimizer/projects/${id}`,
      UPDATE: (id: number | string) =>
        `/admin/film-optimizer/projects/${id}/update`,
      DELETE: (id: number | string) =>
        `/admin/film-optimizer/projects/${id}/delete`,
    },
    // 재단 조각 관리
    PIECES: {
      ADD: (projectId: number | string) =>
        `/admin/film-optimizer/projects/${projectId}/pieces`,
      UPDATE: (projectId: number | string, pieceId: number | string) =>
        `/admin/film-optimizer/projects/${projectId}/pieces/${pieceId}/update`,
      DELETE: (projectId: number | string, pieceId: number | string) =>
        `/admin/film-optimizer/projects/${projectId}/pieces/${pieceId}/delete`,
      TOGGLE_COMPLETE: (projectId: number | string, pieceId: number | string) =>
        `/admin/film-optimizer/projects/${projectId}/pieces/${pieceId}/toggle-complete`,
    },
  },
} as const

// ===== 고객용 API (참고용, 백오피스에서는 사용하지 않음) =====
export const PUBLIC_API = {
  SERVICES: {
    LIST: '/services',
    DETAIL: (id: string) => `/services/${id}`,
    AVAILABLE_TIMES: '/services/available-times',
  },
  PORTFOLIOS: {
    LIST: '/portfolios',
    DETAIL: (id: string) => `/portfolios/${id}`,
  },
  REVIEWS: {
    LIST: '/reviews',
    DETAIL: (id: string) => `/reviews/${id}`,
  },
} as const
