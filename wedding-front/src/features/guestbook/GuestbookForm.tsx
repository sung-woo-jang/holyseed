import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { api } from '@/shared/api'
import type { Guestbook } from '@/shared/types'
import { guestbookFormSchema } from './guestbook-schema'
import type { GuestbookFormData } from './guestbook-schema'
import styles from './GuestbookForm.module.css'

interface GuestbookFormProps {
  coupleId: string
  onSuccess: (entry: Guestbook) => void
}

export default function GuestbookForm({ coupleId, onSuccess }: GuestbookFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<GuestbookFormData>({ resolver: zodResolver(guestbookFormSchema) })

  const onSubmit = async (data: GuestbookFormData) => {
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const res = await api.post('/guestbook', { coupleId, ...data })
      reset()
      onSuccess(res.data.data)
    } catch (err: any) {
      setSubmitError(err?.response?.data?.message || '방명록 등록에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      {submitError && <div className={styles.errorMessage}>{submitError}</div>}

      <div className={styles.row}>
        <input
          {...register('guestName')}
          type="text"
          placeholder="이름"
          className={errors.guestName ? styles.inputError : ''}
        />
        {errors.guestName && <span className={styles.fieldError}>{errors.guestName.message}</span>}
      </div>

      <div className={styles.row}>
        <textarea
          {...register('message')}
          rows={3}
          placeholder="따뜻한 축하 메시지를 남겨주세요"
          className={errors.message ? styles.inputError : ''}
        />
        {errors.message && <span className={styles.fieldError}>{errors.message.message}</span>}
      </div>

      <button type="submit" disabled={isSubmitting} className={styles.submitButton}>
        {isSubmitting ? '등록 중...' : '방명록 남기기'}
      </button>
    </form>
  )
}
