import { type ReactNode, useLayoutEffect } from 'react'
import type { AxiosError, AxiosResponse } from 'axios'
import { toast } from 'sonner'
import type { ApiResponse, ErrorResponse } from './apiResponseTypes'
import { axiosInstance } from './axios'

export function AxiosInterceptor({ children }: { children: ReactNode }) {
  useLayoutEffect(() => {
    // Request Interceptor
    const requestInterceptor = axiosInstance.interceptors.request.use(
      (config) => {
        // 쿠키에서 액세스 토큰 가져오기
        const cookies = document.cookie.split('; ')
        const accessTokenCookie = cookies.find((row) =>
          row.startsWith('access_token=')
        )
        const accessToken = accessTokenCookie?.split('=')[1]

        // 토큰이 있으면 Authorization 헤더에 추가
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`
        }

        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response Interceptor
    const responseInterceptor = axiosInstance.interceptors.response.use(
      (response: AxiosResponse<ApiResponse<unknown>>) => {
        // 응답 그대로 반환 (data 추출 안 함)
        return response
      },
      (error: AxiosError<ErrorResponse>) => {
        const { response } = error

        if (!response) {
          toast.error('네트워크 연결을 확인해주세요.')
          return Promise.reject(error)
        }

        const { status, data } = response

        switch (status) {
          case 401: {
            // 쿠키 삭제
            document.cookie =
              'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
            document.cookie =
              'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'

            toast.error('인증이 만료되었습니다. 다시 로그인해주세요.')

            const currentPath = window.location.pathname
            if (currentPath !== '/sign-in') {
              window.location.href = `/sign-in?redirect=${encodeURIComponent(currentPath)}`
            }
            break
          }

          case 403:
            toast.error('접근 권한이 없습니다.')
            break

          case 404:
            toast.error('요청한 리소스를 찾을 수 없습니다.')
            break

          case 400:
            toast.error(data?.message || '잘못된 요청입니다.')
            break

          case 500:
            toast.error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
            break

          default:
            toast.error(data?.message || '오류가 발생했습니다.')
        }

        return Promise.reject(error)
      }
    )

    // 클린업 함수
    return () => {
      axiosInstance.interceptors.request.eject(requestInterceptor)
      axiosInstance.interceptors.response.eject(responseInterceptor)
    }
  }, [])

  return children
}
