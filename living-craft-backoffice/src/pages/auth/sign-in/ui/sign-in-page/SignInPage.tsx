import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'
import { useSearchParams } from 'react-router-dom'
import { AuthLayout } from '@/features/auth/auth-layout'
import { UserAuthForm } from '@/features/auth/sign-in/ui/user-auth-form'

export function SignIn() {
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect') || undefined

  return (
    <AuthLayout>
      <Card className='gap-4'>
        <CardHeader>
          <CardTitle className='text-lg tracking-tight'>
            Living Craft 백오피스
          </CardTitle>
          <CardDescription>관리자 계정으로 로그인하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <UserAuthForm redirectTo={redirect} />
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
