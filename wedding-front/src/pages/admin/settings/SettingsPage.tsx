import { useEffect, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api, TOKEN_KEY } from '@/shared/api'
import NaverMapScript from '@/shared/ui/NaverMapScript'
import VenueAddressPicker from '@/shared/ui/VenueAddressPicker'
import { useToast } from '@/shared/ui/toast'
import type { Media } from '@/shared/types'
import styles from './SettingsPage.module.css'
import adminStyles from '../admin-page.module.css'

const accountSchema = z.object({
  relation: z.string().optional(),
  holder: z.string().optional(),
  bank: z.string().optional(),
  account: z.string().optional(),
})

const settingsSchema = z.object({
  groomName: z.string().min(1, '신랑 이름을 입력하세요'),
  brideName: z.string().min(1, '신부 이름을 입력하세요'),
  weddingDate: z.string().optional(),
  venueName: z.string().optional(),
  venueAddress: z.string().optional(),
  venueHall: z.string().optional(),
  venueFloor: z.string().optional(),
  venueLat: z.number().optional(),
  venueLng: z.number().optional(),
  accountInfo: z.array(accountSchema).optional(),
})

type SettingsFormData = z.infer<typeof settingsSchema>

export default function AdminSettingsPage() {
  const toast = useToast()
  const [coupleId, setCoupleId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const { register, handleSubmit, reset, control, setValue, watch, formState: { errors } } = useForm<SettingsFormData>({ resolver: zodResolver(settingsSchema) })
  const { fields, append, remove } = useFieldArray({ control, name: 'accountInfo' })
  const [venueExtra, setVenueExtra] = useState<Record<string, any>>({})
  const [ogImageMediaId, setOgImageMediaId] = useState<string | null>(null)
  const [approvedMedia, setApprovedMedia] = useState<Media[]>([])

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) return
    api.post('/auth/me')
      .then(async (meRes) => {
        const id = meRes.data.data?.coupleId
        setCoupleId(id)
        const coupleRes = await api.get(`/couples/${id}`)
        const c = coupleRes.data.data
        // 폼에 입력란이 없는 나머지 venue 필드(예: transportation)는 저장 시 유실되지 않도록 보존
        const { name, address, hall, floor, lat, lng, ...rest } = c.weddingVenue ?? {}
        setVenueExtra(rest)
        setOgImageMediaId(c.ogImageMediaId ?? null)
        api.post('/media/search', { coupleId: id, moderationStatus: 'APPROVED', limit: 100 })
          .then((res) => setApprovedMedia(res.data.data?.media ?? []))
          .catch(() => {})
        reset({
          groomName: c.groomName,
          brideName: c.brideName,
          weddingDate: c.weddingDate ? new Date(c.weddingDate).toISOString().split('T')[0] : '',
          venueName: c.weddingVenue?.name ?? '',
          venueAddress: c.weddingVenue?.address ?? '',
          venueHall: c.weddingVenue?.hall ?? '',
          venueFloor: c.weddingVenue?.floor ?? '',
          venueLat: c.weddingVenue?.lat,
          venueLng: c.weddingVenue?.lng,
          accountInfo: Array.isArray(c.accountInfo) ? c.accountInfo : [],
        })
      })
      .catch(() => setMessage({ type: 'error', text: '데이터를 불러오는데 실패했습니다.' }))
      .finally(() => setIsLoading(false))
  }, [reset])

  const onSubmit = async (data: SettingsFormData) => {
    if (!coupleId) return
    setIsSaving(true); setMessage(null)
    try {
      // 빈 계좌(은행·번호 모두 공백) 제외
      const accounts = (data.accountInfo ?? []).filter((a) => a.bank?.trim() || a.account?.trim() || a.holder?.trim())
      await api.post(`/couples/${coupleId}/update`, {
        groomName: data.groomName,
        brideName: data.brideName,
        weddingDate: data.weddingDate ? new Date(data.weddingDate).toISOString() : undefined,
        weddingVenue: data.venueName ? { ...venueExtra, name: data.venueName, address: data.venueAddress ?? '', hall: data.venueHall ?? '', floor: data.venueFloor ?? '', lat: data.venueLat, lng: data.venueLng } : undefined,
        accountInfo: accounts,
        ogImageMediaId,
      })
      setMessage({ type: 'success', text: '저장되었습니다.' })
      toast.success('저장되었습니다.')
    } catch {
      setMessage({ type: 'error', text: '저장에 실패했습니다.' })
      toast.error('저장에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return <div className={adminStyles.loading}>로딩 중...</div>

  return (
    <div className={adminStyles.pageContainer}>
      <NaverMapScript />
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
              <div className={styles.formGroupFull}>
                <label className={styles.label}>지도에서 위치 찾기</label>
                <VenueAddressPicker
                  initialAddress={watch('venueAddress')}
                  initialLat={watch('venueLat')}
                  initialLng={watch('venueLng')}
                  onChange={({ address, lat, lng }) => {
                    setValue('venueAddress', address)
                    setValue('venueLat', lat)
                    setValue('venueLng', lng)
                  }}
                />
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>카카오톡 공유 썸네일</h2>
            <p className={styles.ogHint}>카카오톡 등에 청첩장 링크를 공유할 때 보여줄 사진을 골라주세요. 고르지 않으면 최신 승인 사진이 자동으로 쓰입니다.</p>
            {approvedMedia.length === 0 ? (
              <p className={styles.accountEmpty}>승인된 사진이 아직 없습니다. 미디어 관리에서 사진을 승인해주세요.</p>
            ) : (
              <div className={styles.ogPickerGrid}>
                <button
                  type="button"
                  className={`${styles.ogPickerNone} ${ogImageMediaId === null ? styles.ogPickerSelected : ''}`}
                  onClick={() => setOgImageMediaId(null)}
                >
                  자동 선택
                </button>
                {approvedMedia.map((m) => (
                  <button
                    type="button"
                    key={m.id}
                    className={`${styles.ogPickerItem} ${ogImageMediaId === m.id ? styles.ogPickerSelected : ''}`}
                    onClick={() => setOgImageMediaId(m.id)}
                  >
                    <img src={`/api/wedding/media/${m.id}/thumbnail`} alt={m.uploaderName || 'photo'} className={styles.ogPickerImage} />
                    {ogImageMediaId === m.id && <span className={styles.ogPickerCheck}>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>축의금 계좌</h2>
              <button
                type="button"
                className={styles.addAccountButton}
                onClick={() => append({ relation: '', holder: '', bank: '', account: '' })}
              >
                + 계좌 추가
              </button>
            </div>

            {fields.length === 0 && (
              <p className={styles.accountEmpty}>등록된 계좌가 없습니다. "+ 계좌 추가"로 신랑/신부측 계좌를 입력하세요.</p>
            )}

            {fields.map((field, index) => (
              <div key={field.id} className={styles.accountRow}>
                <div className={styles.accountGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>구분</label>
                    <input {...register(`accountInfo.${index}.relation`)} type="text" placeholder="신랑측 / 신부측" className={styles.input} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>예금주</label>
                    <input {...register(`accountInfo.${index}.holder`)} type="text" placeholder="홍길동" className={styles.input} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>은행</label>
                    <input {...register(`accountInfo.${index}.bank`)} type="text" placeholder="국민은행" className={styles.input} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>계좌번호</label>
                    <input {...register(`accountInfo.${index}.account`)} type="text" placeholder="123-456-789012" className={styles.input} />
                  </div>
                </div>
                <button type="button" className={styles.removeAccountButton} onClick={() => remove(index)} title="삭제">✕</button>
              </div>
            ))}
          </section>

          <div className={styles.actions}>
            <button type="submit" disabled={isSaving} className={styles.buttonSave}>{isSaving ? '저장 중...' : '설정 저장하기'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
