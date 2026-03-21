import { useEffect } from 'react'
import { useAuthStore } from '@/shared/stores/auth-store'
import { useNavigate, useLocation } from 'react-router-dom'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const checkAuth = useAuthStore((state) => state.checkAuth)

  useEffect(() => {
    const isAuth = checkAuth()

    if (!isAuth) {
      // 현재 경로를 저장하고 로그인 페이지로 이동
      navigate(`/sign-in?redirect=${encodeURIComponent(location.pathname)}`)
    }
  }, [checkAuth, navigate, location.pathname])

  return <>{children}</>
}
