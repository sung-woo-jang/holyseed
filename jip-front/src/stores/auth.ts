import { create } from 'zustand'

interface AuthState {
  token: string | null
  isAdmin: boolean
  setToken: (token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('jip_token'),
  isAdmin: !!localStorage.getItem('jip_token'),
  setToken: (token) => {
    localStorage.setItem('jip_token', token)
    set({ token, isAdmin: true })
  },
  logout: () => {
    localStorage.removeItem('jip_token')
    set({ token: null, isAdmin: false })
  },
}))
