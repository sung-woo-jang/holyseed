import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'
import type { TypedAxiosInstance } from './axios-types'
import { clearTokens, getTokens, saveTokens } from '@/shared/lib/storage'
import { useAuthStore } from '@/stores/auth.store'

export enum ContentType {
  Json = 'application/json',
  FormData = 'multipart/form-data',
  UrlEncoded = 'application/x-www-form-urlencoded',
  Text = 'text/plain',
}

// baseURL에 /api/lab 포함 (dev는 vite proxy 경유)
const BASE_URL = `${import.meta.env.VITE_API_URL || ''}/api/lab`

const createAxiosInstance = (contentType: string, baseURL: string): AxiosInstance => {
  const config: AxiosRequestConfig = {
    baseURL,
    timeout: 30000,
    headers: {
      'Content-Type': contentType,
    },
  }

  return axios.create(config)
}

const rawInstance = createAxiosInstance(ContentType.Json, BASE_URL)

rawInstance.interceptors.request.use(async (config) => {
  const { accessToken } = await getTokens()
  if (accessToken) {
    config.headers['Authorization'] = `Bearer ${accessToken}`
  }
  return config
})

// 응답은 ApiResponse<T> 전체를 그대로 전달 (언래핑 없음) + 401 시 토큰 갱신 후 재시도
rawInstance.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const { refreshToken } = await getTokens()
        if (!refreshToken) throw new Error('no refresh token')

        const { data: raw } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken })
        const payload = raw?.data ?? raw
        await saveTokens(payload.accessToken, payload.refreshToken)
        const store = useAuthStore.getState()
        if (store.user) {
          store.setAuth({ accessToken: payload.accessToken, refreshToken: payload.refreshToken }, store.user)
        }
        original.headers['Authorization'] = `Bearer ${payload.accessToken}`
        return rawInstance(original)
      } catch {
        await clearTokens()
        useAuthStore.getState().logout()
      }
    }
    return Promise.reject(error)
  }
)

const axiosInstance = rawInstance as TypedAxiosInstance

export { axiosInstance }
