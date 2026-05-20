import { create } from 'zustand'

interface AuthState {
  token: string | null
  user: { id: number; username: string; displayName: string } | null
  setAuth: (token: string, user: AuthState['user']) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('pc_token'),
  user: null,
  setAuth: (token, user) => {
    localStorage.setItem('pc_token', token)
    set({ token, user })
  },
  logout: () => {
    localStorage.removeItem('pc_token')
    set({ token: null, user: null })
  },
}))
