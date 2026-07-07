import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { api, TOKEN_KEY } from '@/shared/api'
import styles from './RegisterPage.module.css'

const registerSchema = z
  .object({
    email: z.string().email('유효한 이메일 주소를 입력하세요'),
    password: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다'),
    confirmPassword: z.string(),
    groomName: z.string().min(1, '신랑 이름을 입력하세요').max(50),
    brideName: z.string().min(1, '신부 이름을 입력하세요').max(50),
    slug: z
      .string()
      .min(3, 'URL은 최소 3자 이상이어야 합니다')
      .max(50)
      .regex(/^[a-z0-9-]+$/, 'URL은 영문 소문자, 숫자, 하이픈(-)만 사용 가능합니다'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '비밀번호가 일치하지 않습니다',
    path: ['confirmPassword'],
  })

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) })

  const slugValue = watch('slug', '')

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    setError(null)
    try {
      const { confirmPassword: _, ...payload } = data
      const res = await api.post('/auth/register', payload)
      const { accessToken } = res.data.data
      localStorage.setItem(TOKEN_KEY, accessToken)
      navigate('/admin/dashboard', { replace: true })
    } catch (err: any) {
      setError(err.response?.data?.message || '등록에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h2 className={styles.title}>회원가입</h2>
          <p className={styles.subtitle}>새 청첩장을 시작하세요</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className={styles.errorSummary}>
              <p>{error}</p>
            </div>
          )}

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>계정 정보</h3>
            <div className={styles.field}>
              <label htmlFor="email" className={styles.label}>이메일 <span className={styles.required}>*</span></label>
              <input {...register('email')} id="email" type="email" className={styles.input} placeholder="admin@example.com" />
              {errors.email && <p className={styles.fieldError}>{errors.email.message}</p>}
            </div>
            <div className={styles.field}>
              <label htmlFor="password" className={styles.label}>비밀번호 <span className={styles.required}>*</span></label>
              <input {...register('password')} id="password" type="password" className={styles.input} placeholder="최소 6자 이상" />
              {errors.password && <p className={styles.fieldError}>{errors.password.message}</p>}
            </div>
            <div className={styles.field}>
              <label htmlFor="confirmPassword" className={styles.label}>비밀번호 확인 <span className={styles.required}>*</span></label>
              <input {...register('confirmPassword')} id="confirmPassword" type="password" className={styles.input} placeholder="비밀번호를 다시 입력하세요" />
              {errors.confirmPassword && <p className={styles.fieldError}>{errors.confirmPassword.message}</p>}
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>커플 정보</h3>
            <div className={styles.field}>
              <label htmlFor="groomName" className={styles.label}>신랑 이름 <span className={styles.required}>*</span></label>
              <input {...register('groomName')} id="groomName" type="text" className={styles.input} placeholder="홍길동" />
              {errors.groomName && <p className={styles.fieldError}>{errors.groomName.message}</p>}
            </div>
            <div className={styles.field}>
              <label htmlFor="brideName" className={styles.label}>신부 이름 <span className={styles.required}>*</span></label>
              <input {...register('brideName')} id="brideName" type="text" className={styles.input} placeholder="김영희" />
              {errors.brideName && <p className={styles.fieldError}>{errors.brideName.message}</p>}
            </div>
            <div className={styles.field}>
              <label htmlFor="slug" className={styles.label}>청첩장 URL <span className={styles.required}>*</span></label>
              <input {...register('slug')} id="slug" type="text" className={styles.input} placeholder="our-wedding" />
              {slugValue && (
                <p className={styles.hint}>
                  청첩장 주소: <span className={styles.urlPreview}>{window.location.origin}/{slugValue}</span>
                </p>
              )}
              {errors.slug && <p className={styles.fieldError}>{errors.slug.message}</p>}
              <p className={styles.hint}>영문 소문자, 숫자, 하이픈(-)만 사용 가능</p>
            </div>
          </div>

          <button type="submit" disabled={isLoading} className={styles.submitButton}>
            {isLoading ? '등록 중...' : '등록하기'}
          </button>

          <div className={styles.footer}>
            <p className={styles.footerText}>
              이미 계정이 있으신가요?{' '}
              <Link to="/login" className={styles.link}>로그인</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
