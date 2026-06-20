import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { api, TOKEN_KEY } from '@/shared/api'
import styles from './LoginPage.module.css'

const loginSchema = z.object({
  email: z.string().email('유효한 이메일 주소를 입력하세요'),
  password: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await api.post('/auth/login', data)
      const { accessToken } = res.data.data
      localStorage.setItem(TOKEN_KEY, accessToken)
      navigate('/admin/dashboard', { replace: true })
    } catch (err: any) {
      setError(err.response?.data?.message || '로그인에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h2 className={styles.title}>Wedding <span className={styles.titleAccent}>Archive</span></h2>
          <p className={styles.subtitle}>관리자 콘솔 로그인</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className={styles.errorSummary}>
              <p>{error}</p>
            </div>
          )}

          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>이메일</label>
            <input {...register('email')} id="email" type="email" autoComplete="email" className={styles.input} placeholder="admin@example.com" />
            {errors.email && <p className={styles.fieldError}>{errors.email.message}</p>}
          </div>

          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>비밀번호</label>
            <input {...register('password')} id="password" type="password" autoComplete="current-password" className={styles.input} placeholder="••••••••" />
            {errors.password && <p className={styles.fieldError}>{errors.password.message}</p>}
          </div>

          <button type="submit" disabled={isLoading} className={styles.submitButton}>
            {isLoading ? '로그인 중...' : '로그인'}
          </button>

          <div className={styles.footer}>
            <p className={styles.footerText}>
              아직 계정이 없으신가요?{' '}
              <Link to="/register" className={styles.link}>회원가입</Link>
            </p>
            <Link to="/" className={styles.previewLink}>← 청첩장 미리보기</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
