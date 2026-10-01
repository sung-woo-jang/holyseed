import { create } from 'zustand'
import type { Me } from '@/api/types'

const AT = '@fridge:accessToken'
const RT = '@fridge:refreshToken'

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
function write(key: string, value: string | null) {
  try {
    if (value) localStorage.setItem(key, value)
    else localStorage.removeItem(key)
  } catch {
    /* 저장소를 못 쓰는 환경 — 메모리 상태만 유지 */
  }
}

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  me: Me | null
  setTokens: (access: string, refresh: string) => void
  setMe: (me: Me | null) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: read(AT),
  refreshToken: read(RT),
  me: null,
  setTokens: (access, refresh) => {
    write(AT, access)
    write(RT, refresh)
    set({ accessToken: access, refreshToken: refresh })
  },
  setMe: (me) => set({ me }),
  clear: () => {
    write(AT, null)
    write(RT, null)
    set({ accessToken: null, refreshToken: null, me: null })
  },
}))
