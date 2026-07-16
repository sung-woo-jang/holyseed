import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { FlaskConical } from 'lucide-react'
import { axiosInstance, AUTH_API } from '@/shared/api'
import { saveTokens } from '@/shared/lib/storage'
import { useAuthStore, type LabUser } from '@/stores/auth.store'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'

interface RegisterResult {
  accessToken: string
  refreshToken: string
  user: LabUser
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    try {
      const { data: res } = await axiosInstance.post<RegisterResult>(AUTH_API.REGISTER, {
        email,
        password,
        name: name || undefined,
      })
      const { accessToken, refreshToken, user } = res.data
      await saveTokens(accessToken, refreshToken)
      setAuth({ accessToken, refreshToken }, user)
      navigate('/', { replace: true })
    } catch (error: any) {
      const message = error?.response?.data?.message
      toast.error(typeof message === 'string' ? message : '회원가입에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 rounded-lg border p-8">
        <div className="flex flex-col items-center gap-2">
          <FlaskConical className="size-8 text-primary" />
          <h1 className="text-xl font-semibold">회원가입</h1>
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
            <Label htmlFor="password">비밀번호 (최소 6자)</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">이름 (선택)</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? '가입 중…' : '회원가입'}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          이미 계정이 있나요?{' '}
          <Link to="/login" className="text-primary underline-offset-4 hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  )
}
