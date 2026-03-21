import { useState } from 'react'
import { axiosInstance, AUTH_API } from '@/shared/api'
import { useAuthStore } from '@/shared/stores/auth-store'
import { Button } from '@/shared/ui/button'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

export function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect')
  const checkAuth = useAuthStore((state) => state.checkAuth)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await axiosInstance.post<{ accessToken: string }>(
        AUTH_API.LOGIN,
        {
          email,
          password,
        }
      )
      const { accessToken } = response.data.data

      // 쿠키에 토큰 저장 (7일 유효)
      const expires = new Date()
      expires.setDate(expires.getDate() + 7)
      document.cookie = `access_token=${accessToken}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`

      checkAuth() // 인증 상태 업데이트
      toast.success('로그인 성공')

      // 리다이렉트 경로로 이동 (없으면 대시보드)
      navigate(redirect || '/')
    } catch {
      toast.error('로그인 실패')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='bg-background flex min-h-screen items-center justify-center p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader>
          <CardTitle className='text-2xl'>Living Craft 백오피스</CardTitle>
          <CardDescription>관리자 계정으로 로그인하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='email'>이메일</Label>
              <Input
                id='email'
                type='email'
                placeholder='admin@livingcraft.com'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='password'>비밀번호</Label>
              <Input
                id='password'
                type='password'
                placeholder='비밀번호를 입력하세요'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type='submit' className='w-full' disabled={isLoading}>
              {isLoading ? '로그인 중...' : '로그인'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
