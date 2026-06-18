import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CoupleProvider, useCouple } from '@/lib/couple-context'
import { api } from '@/lib/api'
import styles from './AttendancePage.module.css'

const attendanceFormSchema = z.object({
  guestName: z.string().min(1, '이름을 입력해주세요').max(50),
  guestCount: z.number().int().min(1, '최소 1명').max(10, '최대 10명'),
  attendanceStatus: z.enum(['ATTENDING', 'NOT_ATTENDING', 'MAYBE']),
  message: z.string().max(500).optional(),
  phoneNumber: z.string().max(20).optional(),
})

type AttendanceFormData = z.infer<typeof attendanceFormSchema>

function AttendanceContent() {
  const { couple, isLoading, error } = useCouple()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<AttendanceFormData>({
    resolver: zodResolver(attendanceFormSchema),
    defaultValues: { guestCount: 1, attendanceStatus: 'ATTENDING' },
  })

  if (isLoading) return <div style={{ padding: '2rem' }}>로딩 중...</div>
  if (error || !couple) return <Navigate to="/login" replace />

  const onSubmit = async (data: AttendanceFormData) => {
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      await api.post('/attendance', { coupleId: couple.id, ...data })
      alert('참석 의사가 전달되었습니다. 감사합니다!')
      navigate(`/${couple.slug}`)
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || '참석 응답 제출에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>참석 의사 전달</h1>
        <p>{couple.groomName} ❤️ {couple.brideName}</p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        {submitError && <div className={styles.errorMessage}>{submitError}</div>}

        <div className={styles.formGroup}>
          <label htmlFor="guestName">성함 *</label>
          <input {...register('guestName')} id="guestName" type="text" placeholder="홍길동" />
          {errors.guestName && <span className={styles.fieldError}>{errors.guestName.message}</span>}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="attendanceStatus">참석 여부 *</label>
          <select {...register('attendanceStatus')} id="attendanceStatus">
            <option value="ATTENDING">참석</option>
            <option value="NOT_ATTENDING">불참</option>
            <option value="MAYBE">미정</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="guestCount">인원 수 *</label>
          <input {...register('guestCount', { valueAsNumber: true })} id="guestCount" type="number" min="1" max="10" />
          {errors.guestCount && <span className={styles.fieldError}>{errors.guestCount.message}</span>}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="phoneNumber">연락처</label>
          <input {...register('phoneNumber')} id="phoneNumber" type="tel" placeholder="010-1234-5678" />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="message">축하 메시지</label>
          <textarea {...register('message')} id="message" rows={4} placeholder="축하 메시지를 남겨주세요" />
        </div>

        <div className={styles.formActions}>
          <button type="button" onClick={() => navigate(-1)} disabled={isSubmitting}>취소</button>
          <button type="submit" disabled={isSubmitting}>{isSubmitting ? '전송 중...' : '전달하기'}</button>
        </div>
      </form>
    </div>
  )
}

export default function AttendancePage() {
  const { coupleSlug } = useParams<{ coupleSlug: string }>()
  if (!coupleSlug) return <Navigate to="/login" replace />
  return (
    <CoupleProvider slug={coupleSlug}>
      <AttendanceContent />
    </CoupleProvider>
  )
}
