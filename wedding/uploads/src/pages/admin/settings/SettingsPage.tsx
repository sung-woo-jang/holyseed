import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api, TOKEN_KEY } from '@/shared/api'
import styles from './settingsPage.module.css'
import adminStyles from '../admin-page.module.css'

const settingsSchema = z.object({
  groomName: z.string().min(1, '신랑 이름을 입력하세요'),
  brideName: z.string().min(1, '신부 이름을 입력하세요'),
  weddingDate: z.string().optional(),
  venueName: z.string().optional(),
  venueAddress: z.string().optional(),
  venueHall: z.string().optional(),
  venueFloor: z.string().optional(),
})

type SettingsFormData = z.infer<typeof settingsSchema>

export default function AdminSettingsPage() {
  const [coupleId, setCoupleId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<SettingsFormData>({ resolver: zodResolver(settingsSchema) })

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) return
    api.post('/auth/me')
      .then(async (meRes) => {
        const id = meRes.data.data?.coupleId
        setCoupleId(id)
        const coupleRes = await api.get(`/couples/${id}`)
        const c = coupleRes.data.data
        reset({
          groomName: c.groomName,
          brideName: c.brideName,
          weddingDate: c.weddingDate ? new Date(c.weddingDate).toISOString().split('T')[0] : '',
          venueName: c.weddingVenue?.name ?? '',
          venueAddress: c.weddingVenue?.address ?? '',
          venueHall: c.weddingVenue?.hall ?? '',
          venueFloor: c.weddingVenue?.floor ?? '',
        })
      })
      .catch(() => setMessage({ type: 'error', text: '데이터를 불러오는데 실패했습니다.' }))
      .finally(() => setIsLoading(false))
  }, [reset])

  const onSubmit = async (data: SettingsFormData) => {
    if (!coupleId) return
    setIsSaving(true); setMessage(null)
    try {
      await api.post(`/couples/${coupleId}/update`, {
        groomName: data.groomName,
        brideName: data.brideName,
        weddingDate: data.weddingDate ? new Date(data.weddingDate).toISOString() : undefined,
        weddingVenue: data.venueName ? { name: data.venueName, address: data.venueAddress ?? '', hall: data.venueHall ?? '', floor: data.venueFloor ?? '' } : undefined,
      })
      setMessage({ type: 'success', text: '저장되었습니다.' })
    } catch {
      setMessage({ type: 'error', text: '저장에 실패했습니다.' })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return <div className={adminStyles.loading}>로딩 중...</div>

  return (
    <div className={adminStyles.pageContainer}>
      <div className={styles.container}>
        <div className={adminStyles.pageHeader}>
          <h1 className={adminStyles.title}>청첩장 설정</h1>
          <p className={adminStyles.description}>청첩장에 표시될 정보를 관리합니다.</p>
        </div>

        {message && <div className={`${styles.statusMessage} ${styles[message.type]}`}>{message.text}</div>}

        <form onSubmit={handleSubmit(onSubmit)}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>기본 정보</h2>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label htmlFor="groomName" className={styles.label}>신랑 이름 *</label>
                <input {...register('groomName')} type="text" id="groomName" className={styles.input} />
                {errors.groomName && <p className={styles.error}>{errors.groomName.message}</p>}
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="brideName" className={styles.label}>신부 이름 *</label>
                <input {...register('brideName')} type="text" id="brideName" className={styles.input} />
                {errors.brideName && <p className={styles.error}>{errors.brideName.message}</p>}
              </div>
              <div className={styles.formGroupFull}>
                <label htmlFor="weddingDate" className={styles.label}>결혼식 날짜</label>
                <input {...register('weddingDate')} type="date" id="weddingDate" className={styles.input} />
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>예식장 정보</h2>
            <div className={styles.formGrid}>
              <div className={styles.formGroupFull}><label htmlFor="venueName" className={styles.label}>예식장 이름</label><input {...register('venueName')} type="text" id="venueName" className={styles.input} /></div>
              <div className={styles.formGroupFull}><label htmlFor="venueAddress" className={styles.label}>주소</label><input {...register('venueAddress')} type="text" id="venueAddress" className={styles.input} /></div>
              <div className={styles.formGroup}><label htmlFor="venueHall" className={styles.label}>홀 이름</label><input {...register('venueHall')} type="text" id="venueHall" className={styles.input} /></div>
              <div className={styles.formGroup}><label htmlFor="venueFloor" className={styles.label}>층</label><input {...register('venueFloor')} type="text" id="venueFloor" className={styles.input} /></div>
            </div>
          </section>

          <div className={styles.actions}>
            <button type="submit" disabled={isSaving} className={styles.buttonSave}>{isSaving ? '저장 중...' : '설정 저장하기'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
