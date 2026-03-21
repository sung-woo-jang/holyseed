import { create } from 'zustand'

interface AuthStore {
  isAuthenticated: boolean
  checkAuth: () => boolean
  logout: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  isAuthenticated: false,
  checkAuth: () => {
    // 쿠키에서 토큰 확인
    const hasToken = document.cookie.includes('access_token=')
    set({ isAuthenticated: hasToken })
    return hasToken
  },
  logout: () => {
    // 쿠키 삭제
    document.cookie =
      'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    document.cookie =
      'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    set({ isAuthenticated: false })
  },
}))
