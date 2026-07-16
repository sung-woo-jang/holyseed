import React, { useEffect } from 'react'
import { useLocation, Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { axiosInstance, AUTH_API } from '@/shared/api'
import { getTokens } from '@/shared/lib/storage'
import { useAuthStore, type LabUser } from '@/stores/auth.store'

const PUBLIC_PATHS = ['/login', '/register']

export default function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const { isReady, isAuthenticated, setAuth, setReady } = useAuthStore()
  const location = useLocation()

  useEffect(() => {
    restoreSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function restoreSession() {
    try {
      const { accessToken, refreshToken } = await getTokens()

      if (accessToken && refreshToken) {
        const { data: res } = await axiosInstance.get<LabUser>(AUTH_API.ME)
        setAuth({ accessToken, refreshToken }, res.data)
      }
    } catch {
      // 토큰 만료 등 → 로그인 화면으로
    } finally {
      setReady()
    }
  }

  if (!isReady) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const isPublic = PUBLIC_PATHS.includes(location.pathname)

  if (!isAuthenticated && !isPublic) {
    return <Navigate to="/login" replace />
  }
  if (isAuthenticated && isPublic) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
