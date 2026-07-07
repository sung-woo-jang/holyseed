import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { api } from '@/shared/api'
import { attendanceFormSchema } from './attendance-schema'
import type { AttendanceFormData } from './attendance-schema'
import styles from './AttendanceForm.module.css'

interface AttendanceFormProps {
  coupleId: string
  onSuccess: () => void
  onCancel: () => void
}

export default function AttendanceForm({ coupleId, onSuccess, onCancel }: AttendanceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AttendanceFormData>({
    resolver: zodResolver(attendanceFormSchema),
    defaultValues: { guestCount: 1, attendanceStatus: 'ATTENDING' },
  })

  const onSubmit = async (data: AttendanceFormData) => {
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      await api.post('/attendance', { coupleId, ...data })
      reset()
      onSuccess()
    } catch (err: any) {
      setSubmitError(err?.response?.data?.message || '참석 응답 제출에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      {submitError && <div className={styles.errorMessage}>{submitError}</div>}

      <div className={styles.formGroup}>
        <label htmlFor="guestName">성함 *</label>
        <input
          {...register('guestName')}
          id="guestName"
          type="text"
          placeholder="홍길동"
          className={errors.guestName ? styles.inputError : ''}
        />
        {errors.guestName && <span className={styles.fieldError}>{errors.guestName.message}</span>}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="attendanceStatus">참석 여부 *</label>
        <select
          {...register('attendanceStatus')}
          id="attendanceStatus"
          className={errors.attendanceStatus ? styles.inputError : ''}
        >
          <option value="ATTENDING">참석</option>
          <option value="NOT_ATTENDING">불참</option>
          <option value="MAYBE">미정</option>
        </select>
        {errors.attendanceStatus && <span className={styles.fieldError}>{errors.attendanceStatus.message}</span>}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="guestCount">인원 수 *</label>
        <input
          {...register('guestCount', { valueAsNumber: true })}
          id="guestCount"
          type="number"
          min="1"
          max="10"
          className={errors.guestCount ? styles.inputError : ''}
        />
        {errors.guestCount && <span className={styles.fieldError}>{errors.guestCount.message}</span>}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="phoneNumber">연락처</label>
        <input
          {...register('phoneNumber')}
          id="phoneNumber"
          type="tel"
          placeholder="010-1234-5678"
          className={errors.phoneNumber ? styles.inputError : ''}
        />
        {errors.phoneNumber && <span className={styles.fieldError}>{errors.phoneNumber.message}</span>}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="message">축하 메시지</label>
        <textarea
          {...register('message')}
          id="message"
          rows={4}
          placeholder="축하 메시지를 남겨주세요"
          className={errors.message ? styles.inputError : ''}
        />
        {errors.message && <span className={styles.fieldError}>{errors.message.message}</span>}
      </div>

      <div className={styles.formActions}>
        <button type="button" onClick={onCancel} disabled={isSubmitting} className={styles.cancelButton}>
          취소
        </button>
        <button type="submit" disabled={isSubmitting} className={styles.submitButton}>
          {isSubmitting ? '전송 중...' : '전달하기'}
        </button>
      </div>
    </form>
  )
}
