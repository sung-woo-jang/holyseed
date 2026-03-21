import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { axiosInstance, AUTH_API } from '@/shared/api'
import { cn } from '@/shared/lib/utils'
import { PasswordInput } from '@/shared/ui-kit/password-input'
import { Button } from '@/shared/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/ui/form'
import { Input } from '@/shared/ui/input'
import { Loader2, LogIn } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuthStore } from '@/features/auth'

const formSchema = z.object({
  email: z.email({
    error: (iss) =>
      iss.input === ''
        ? '이메일을 입력해주세요'
        : '올바른 이메일 형식이 아닙니다',
  }),
  password: z
    .string()
    .min(1, '비밀번호를 입력해주세요')
    .min(7, '비밀번호는 7자 이상이어야 합니다'),
})

interface UserAuthFormProps extends React.HTMLAttributes<HTMLFormElement> {
  redirectTo?: string
}

export function UserAuthForm({
  className,
  redirectTo,
  ...props
}: UserAuthFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { auth } = useAuthStore()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true)

    try {
      const response = await axiosInstance.post<{
        accessToken: string
        user: { uuid: string; email: string; role: string }
      }>(AUTH_API.LOGIN, {
        email: data.email,
        password: data.password,
      })

      const { accessToken, user } = response.data.data

      // 쿠키에 토큰 저장 (7일 유효)
      const expires = new Date()
      expires.setDate(expires.getDate() + 7)
      document.cookie = `access_token=${accessToken}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`

      // 스토어 업데이트
      auth.setUser({
        accountNo: user.uuid,
        email: user.email,
        role: [user.role],
        exp: Date.now() + 24 * 60 * 60 * 1000,
      })
      auth.setAccessToken(accessToken)

      toast.success(`환영합니다, ${user.email}!`)

      // 리다이렉트
      const targetPath = redirectTo || '/'
      navigate(targetPath, { replace: true })
    } catch {
      toast.error('로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('grid gap-3', className)}
        {...props}
      >
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>이메일</FormLabel>
              <FormControl>
                <Input placeholder='admin@livingcraft.com' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormItem>
              <FormLabel>비밀번호</FormLabel>
              <FormControl>
                <PasswordInput placeholder='비밀번호를 입력하세요' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className='mt-2' disabled={isLoading}>
          {isLoading ? <Loader2 className='animate-spin' /> : <LogIn />}
          로그인
        </Button>
      </form>
    </Form>
  )
}
