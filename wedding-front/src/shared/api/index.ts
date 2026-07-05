import axios from 'axios'

export const TOKEN_KEY = 'wedding-token'
export const API_BASE = '/api/wedding'

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

// 요청마다 JWT 자동 첨부
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// 401이면 토큰 제거 후 로그인 페이지로 (단, 로그인/회원가입 요청은 제외)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url: string = err.config?.url ?? ''
    const isAuthRequest = url.includes('/auth/login') || url.includes('/auth/register')
    if (err.response?.status === 401 && !isAuthRequest) {
      localStorage.removeItem(TOKEN_KEY)
      // 이미 로그인 페이지면 리다이렉트하지 않음 (무한 새로고침 방지)
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  },
)

export function unwrap<T>(res: { data: { data: T } }): T {
  return res.data.data
}
