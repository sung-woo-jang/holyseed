/**
 * API 엔드포인트 상수 정의
 * baseURL에 /api가 포함되므로 상대 경로 사용
 */

// ===== 인증 API =====
export const AUTH_API = {
  LOGIN: '/auth/login',
  REFRESH: '/auth/refresh',
  LOGOUT: '/auth/logout',
} as const;

// ===== 고객용 API =====
export const API = {
  // 서비스
  SERVICES: {
    LIST: '/services',
    DETAIL: (id: number | string) => `/services/${id}`,
    AVAILABLE_TIMES: '/services/available-times',
    AVAILABLE_DATES: '/services/available-dates',
  },

  // 포트폴리오
  PORTFOLIOS: {
    LIST: '/portfolios',
    DETAIL: (id: number | string) => `/portfolios/${id}`,
  },

  // 리뷰
  REVIEWS: {
    LIST: '/reviews',
    CREATE: '/reviews',
    DETAIL: (id: number | string) => `/reviews/${id}`,
  },

  // 예약
  RESERVATIONS: {
    CREATE: '/reservations',
    DETAIL: (id: number | string) => `/reservations/${id}`,
    CANCEL: (id: number | string) => `/reservations/${id}/cancel`,
  },

  // 사용자
  USERS: {
    ME: '/users/me',
    MY_RESERVATIONS: '/users/me/reservations',
    MY_REVIEWS: '/users/me/reviews',
  },

  // 파일 업로드
  FILES: {
    UPLOAD_REVIEW_IMAGES: '/upload/reviews',
    UPLOAD_RESERVATION_PHOTOS: '/files/reservations/upload-photos',
  },

  // 프로모션
  PROMOTIONS: {
    LIST: '/promotions',
    CLICK: (id: number | string) => `/promotions/${id}/click`,
  },
} as const;
