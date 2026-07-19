import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { FlaskConical } from 'lucide-react'
import { axiosInstance, AUTH_API } from '@/shared/api'
import { saveTokens } from '@/shared/lib/storage'
import { useAuthStore, type LabUser } from '@/stores/auth.store'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'

interface LoginResult {
  accessToken: string
  refreshToken: string
  user: LabUser
}

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    try {
      const { data: res } = await axiosInstance.post<LoginResult>(AUTH_API.LOGIN, { email, password })
      const { accessToken, refreshToken, user } = res.data
      await saveTokens(accessToken, refreshToken)
      setAuth({ accessToken, refreshToken }, user)
      navigate('/', { replace: true })
    } catch {
      toast.error('이메일 또는 비밀번호가 올바르지 않습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 rounded-lg border p-8">
        <div className="flex flex-col items-center gap-2">
          <FlaskConical className="size-8 text-primary" />
          <h1 className="text-xl font-semibold">Lab</h1>
          <p className="text-sm text-muted-foreground">개인 다목적 대시보드</p>
        </div>
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? '로그인 중…' : '로그인'}
          </Button>
        </form>
      </div>
    </div>
  )
}
