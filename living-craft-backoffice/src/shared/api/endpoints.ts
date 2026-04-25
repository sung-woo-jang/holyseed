// API 엔드포인트 상수 정의

export const AUTH_API = {
  LOGIN: '/admin/auth/login',
  REFRESH: '/admin/auth/refresh',
  ME: '/admin/auth/me',
} as const

export const ADMIN_API = {
  ICONS: {
    LIST: '/icons',
    CREATE: '/icons/admin',
    UPDATE: (id: number | string) => `/icons/admin/${id}/update`,
  },
} as const
