import axios, { AxiosError, type AxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/stores/auth.store'

const baseURL = `${import.meta.env.VITE_API_URL ?? ''}/api/fridge`

export const http = axios.create({ baseURL, timeout: 15000 })

interface Envelope<T> {
  success: boolean
  message: string
  data: T
}

http.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let refreshing: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken, setTokens, clear } = useAuthStore.getState()
  if (!refreshToken) return null
  try {
    const res = await axios.post<Envelope<{ accessToken: string; refreshToken: string }>>(
      `${baseURL}/auth/refresh`,
      { refreshToken },
    )
    const t = res.data.data
    setTokens(t.accessToken, t.refreshToken)
    return t.accessToken
  } catch {
    clear()
    return null
  }
}

http.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (AxiosRequestConfig & { _retried?: boolean }) | undefined
    if (error.response?.status !== 401 || !original || original._retried || original.url?.includes('/auth/refresh')) {
      return Promise.reject(error)
    }
    original._retried = true
    refreshing ??= refreshAccessToken().finally(() => {
      refreshing = null
    })
    const token = await refreshing
    if (!token) return Promise.reject(error)
    original.headers = { ...(original.headers ?? {}), Authorization: `Bearer ${token}` }
    return http.request(original)
  },
)

export async function get<T>(url: string): Promise<T> {
  const res = await http.get<Envelope<T>>(url)
  return res.data.data
}

export async function post<T = unknown>(url: string, body?: unknown): Promise<T> {
  const res = await http.post<Envelope<T>>(url, body ?? {})
  return res.data.data
}

export function errorMessage(e: unknown, fallback = '잠시 후 다시 시도해주세요'): string {
  if (axios.isAxiosError(e)) {
    const m = (e.response?.data as { message?: string | string[] } | undefined)?.message
    if (Array.isArray(m)) return m[0] ?? fallback
    if (typeof m === 'string' && m) return m
    if (!e.response) return '서버에 연결할 수 없어요'
  }
  return fallback
}
