import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Splash } from '@/components/ui'
import { useAuthStore } from '@/stores/auth.store'

export default function AuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const p = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const accessToken = p.get('accessToken')
    const refreshToken = p.get('refreshToken')
    window.history.replaceState(null, '', window.location.pathname)
    if (!accessToken || !refreshToken) {
      navigate('/login?error=oauth', { replace: true })
      return
    }
    useAuthStore.getState().setTokens(accessToken, refreshToken)
    navigate('/', { replace: true })
  }, [navigate])

  return <Splash>로그인 중…</Splash>
}
