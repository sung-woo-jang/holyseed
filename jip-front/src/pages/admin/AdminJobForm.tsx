import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { api } from '@/lib/api'
import { useToastStore } from '@/stores/toast'
import { JIcon, JPhoto, JPubToggle } from '@/components/common/JobsShared'
import type { Job, JobStatus } from '@/types'

const PUBLIC_FIELDS = [
  { key: 'customer_name', label: '고객명', defaultPublic: true },
  { key: 'phone', label: '전화번호', defaultPublic: false },
  { key: 'address_full', label: '상세주소', defaultPublic: false },
  { key: 'address_short', label: '간이주소', defaultPublic: true },
  { key: 'inquiry_date', label: '문의일', defaultPublic: false },
  { key: 'work_date', label: '시공일', defaultPublic: true },
  { key: 'status', label: '진행상황', defaultPublic: true },
  { key: 'product_name', label: '제품명', defaultPublic: true },
  { key: 'brand', label: '브랜드', defaultPublic: true },
  { key: 'model', label: '모델명', defaultPublic: false },
  { key: 'request_note', label: '요청사항', defaultPublic: true },
  { key: 'work_summary', label: '작업요약', defaultPublic: true },
  { key: 'before_photos', label: '시공 전 사진', defaultPublic: true },
  { key: 'after_photos', label: '시공 후 사진', defaultPublic: true },
]

interface FormValues {
  customerName: string; phone: string; addressFull: string; addressShort: string
  inquiryDate: string; workDate: string; status: JobStatus; productName: string
  brand: string; model: string; requestNote: string; workSummary: string
  sellingPrice: string; costPrice: string; materialSource: string
  paid: boolean; paidDate: string; internalMemo: string
  isPublished: boolean
}

interface PhotoEntry { role: 'before' | 'after'; label: string; fileUrl: string }

export default function AdminJobForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const showToast = useToastStore((s) => s.show)
  const isEdit = !!id
  const [publicFields, setPublicFields] = useState<string[]>(
    PUBLIC_FIELDS.filter((f) => f.defaultPublic).map((f) => f.key)
  )
  const [saving, setSaving] = useState(false)
  const [photos, setPhotos] = useState<PhotoEntry[]>([])
  const [uploadingRole, setUploadingRole] = useState<'before' | 'after' | null>(null)
  const [isPublished, setIsPublished] = useState(false)

  const { register, handleSubmit, reset, watch } = useForm<FormValues>({
    defaultValues: { status: '문의접수', isPublished: false, paid: false },
  })

  useEffect(() => {
    if (!isEdit) return
    api.post('/jobs/admin/list', {}).then((r) => {
      const job: Job = r.data.data.find((j: Job) => j.id === id)
      if (!job) return
      reset({
        customerName: job.customerName ?? '',
        phone: job.phone ?? '',
        addressFull: job.addressFull ?? '',
        addressShort: job.addressShort ?? '',
        inquiryDate: job.inquiryDate ?? '',
        workDate: job.workDate ?? '',
        status: job.status ?? '문의접수',
        productName: job.productName ?? '',
        brand: job.brand ?? '',
        model: job.model ?? '',
        requestNote: job.requestNote ?? '',
        workSummary: job.workSummary ?? '',
        sellingPrice: String(job.sellingPrice ?? ''),
        costPrice: String(job.costPrice ?? ''),
        materialSource: job.materialSource ?? '',
        paid: job.paid ?? false,
        paidDate: job.paidDate ?? '',
        internalMemo: job.internalMemo ?? '',
        isPublished: job.isPublished ?? false,
      })
      setIsPublished(job.isPublished ?? false)
      if (job.publicFields) setPublicFields(job.publicFields)
      if (job.beforePhotos || job.afterPhotos) {
        const before = (job.beforePhotos ?? []).map((p) => ({ role: 'before' as const, label: p.label ?? '', fileUrl: p.fileUrl ?? '' }))
        const after = (job.afterPhotos ?? []).map((p) => ({ role: 'after' as const, label: p.label ?? '', fileUrl: p.fileUrl ?? '' }))
        setPhotos([...before, ...after])
      }
    })
  }, [id, isEdit, reset])

  const togglePublicField = (key: string) => {
    setPublicFields((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key])
  }

  const uploadPhoto = async (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    const res = await api.post('/uploads/job-photo', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    return res.data.data.url as string
  }

  const handlePhotoAdd = async (e: React.ChangeEvent<HTMLInputElement>, role: 'before' | 'after') => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploadingRole(role)
    try {
      for (const file of files) {
        const fileUrl = await uploadPhoto(file)
        setPhotos((prev) => [...prev, { role, label: '', fileUrl }])
      }
    } catch {
      showToast('사진 업로드 실패', 'error')
    } finally {
      setUploadingRole(null)
      e.target.value = ''
    }
  }

  const removePhoto = (idx: number) => setPhotos((prev) => prev.filter((_, i) => i !== idx))
  const updatePhotoLabel = (idx: number, label: string) =>
    setPhotos((prev) => prev.map((p, i) => i === idx ? { ...p, label } : p))

  const onSubmit = async (form: FormValues) => {
    setSaving(true)
    try {
      const payload = {
        ...form,
        isPublished,
        sellingPrice: form.sellingPrice ? Number(form.sellingPrice) : null,
        costPrice: form.costPrice ? Number(form.costPrice) : null,
        publicFields,
        photos: photos.filter((p) => p.fileUrl),
      }
      if (isEdit) {
        await api.post(`/jobs/admin/${id}/update`, payload)
        showToast('일지가 수정됐어요')
      } else {
        await api.post('/jobs/admin', payload)
        showToast('일지가 생성됐어요')
      }
      navigate('/admin/jobs')
    } catch {
      showToast('저장 실패', 'error')
    } finally {
      setSaving(false)
    }
  }

  const PUBLIC_FIELD_INPUTS: { fkey: string; key: keyof FormValues; label: string; type: string; options?: string[] }[] = [
    { fkey: 'customer_name', key: 'customerName', label: '고객명', type: 'text' },
    { fkey: 'phone', key: 'phone', label: '전화번호', type: 'text' },
    { fkey: 'address_short', key: 'addressShort', label: '간이주소', type: 'text' },
    { fkey: 'address_full', key: 'addressFull', label: '상세주소', type: 'text' },
    { fkey: 'inquiry_date', key: 'inquiryDate', label: '문의일', type: 'date' },
    { fkey: 'work_date', key: 'workDate', label: '시공일', type: 'date' },
    { fkey: 'product_name', key: 'productName', label: '제품명', type: 'text' },
    { fkey: 'brand', key: 'brand', label: '브랜드', type: 'text' },
    { fkey: 'model', key: 'model', label: '모델명', type: 'text' },
    { fkey: 'status', key: 'status', label: '진행상황', type: 'select', options: ['문의접수', '시공대기', '시공완료'] },
    { fkey: 'request_note', key: 'requestNote', label: '요청사항', type: 'textarea' },
    { fkey: 'work_summary', key: 'workSummary', label: '작업요약', type: 'textarea' },
  ]

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="steps mb-16">
        <span className="link" onClick={() => navigate('/admin/jobs')}>시공 일지</span>
        <span className="sep">›</span>
        <b>{isEdit ? '수정' : '새 일지'}</b>
      </div>
      <h1 className="h2 mb-24">{isEdit ? '일지 수정' : '새 일지 작성'}</h1>

      {/* 마스터 공개 스위치 */}
      <div className={`jobs-master-row mb-24 ${isPublished ? 'on' : ''}`}>
        <div className="ico">
          {isPublished ? <JIcon.Globe s={20} /> : <JIcon.Lock s={18} />}
        </div>
        <div className="copy">
          <div className="ttl">{isPublished ? '고객 공유 켜짐' : '고객 공유 꺼짐'}</div>
          <div className="sub">
            {isPublished
              ? 'URL 받은 사람이라면 누구나 공개 항목을 볼 수 있어요.'
              : '현재는 사장님만 볼 수 있어요. 켜야 고객에게 URL을 보낼 수 있습니다.'}
          </div>
        </div>
        <button
          type="button"
          className={`jobs-switch ${isPublished ? 'on' : ''}`}
          onClick={() => setIsPublished((v) => !v)}
          aria-label="마스터 공개 스위치"
        />
      </div>

      <div className="card card-pad">
        {/* 공개 가능 필드 */}
        <div className="jobs-form-sect">
          <JIcon.Eye s={13} /> 공개 가능 필드
        </div>
        <p className="jobs-form-help">
          오른쪽 <b>공개</b> 체크박스로 일지별 공개 여부를 결정할 수 있어요.
        </p>

        {PUBLIC_FIELD_INPUTS.map(({ fkey, key, label, type, options }) => (
          <div key={fkey} className="jobs-fld-row">
            <div className="field">
              <label className="field-label">{label}</label>
              {type === 'textarea' ? (
                <textarea className="textarea" {...register(key)} />
              ) : type === 'select' ? (
                <select className="input" {...register(key)}>
                  {options?.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input className="input" type={type} {...register(key)} />
              )}
            </div>
            <div className="pub-cell">
              <JPubToggle on={publicFields.includes(fkey)} onClick={() => togglePublicField(fkey)} />
            </div>
          </div>
        ))}

        {/* 사진 — before */}
        {(['before', 'after'] as const).map((role) => {
          const fkey = role === 'before' ? 'before_photos' : 'after_photos'
          const roleLabel = role === 'before' ? '시공 전 사진' : '시공 후 사진'
          const roleIndices = photos.reduce<number[]>((acc, p, i) => { if (p.role === role) acc.push(i); return acc }, [])
          return (
            <div key={role} className="jobs-fld-row">
              <div className="field">
                <label className="field-label">{roleLabel}</label>
                <div className="jobs-photo-grid">
                  {roleIndices.map((gi) => {
                    const p = photos[gi]
                    return (
                      <div key={gi} className="cell" style={{ position: 'relative' }}>
                        <JPhoto fileUrl={p.fileUrl || null} role={role} label={p.label} />
                        <button
                          type="button"
                          onClick={() => removePhoto(gi)}
                          style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >✕</button>
                      </div>
                    )
                  })}
                  <label className="cell add">
                    <input type="file" accept="image/*" multiple style={{ display: 'none' }} disabled={uploadingRole !== null} onChange={(e) => handlePhotoAdd(e, role)} />
                    <JIcon.Plus s={18} />
                    <span>{uploadingRole === role ? '업로드 중...' : '사진 추가'}</span>
                  </label>
                </div>
                {roleIndices.length > 0 && (
                  <div className="jobs-photo-foot">{roleIndices.length}장 업로드됨</div>
                )}
              </div>
              <div className="pub-cell">
                <JPubToggle on={publicFields.includes(fkey)} onClick={() => togglePublicField(fkey)} />
              </div>
            </div>
          )
        })}

        {/* 내부 전용 */}
        <div className="jobs-form-sect lock" style={{ paddingTop: 32 }}>
          <JIcon.Lock s={13} /> 내부 전용 — 고객 절대 안 보임
        </div>
        <div className="jobs-locked-banner">
          <div className="ico"><JIcon.Lock s={14} /></div>
          <div className="txt">
            아래 <b>6개 필드</b>는 서버 화이트리스트로 차단되어 있어 절대 응답에 포함되지 않습니다.
          </div>
        </div>

        <div className="jobs-locked-grid">
          {[
            { key: 'sellingPrice', label: '시공비', type: 'money' },
            { key: 'costPrice', label: '자재원가', type: 'money' },
            { key: 'materialSource', label: '자재 구매처', type: 'text' },
            { key: 'paidDate', label: '입금일', type: 'date' },
          ].map(({ key, label, type }) => (
            <div key={key} className="jobs-locked-fld">
              <label><JIcon.Lock s={12} /> {label}</label>
              <input className="input" type={type === 'money' ? 'number' : type} {...register(key as keyof FormValues)} />
            </div>
          ))}
          <div className="jobs-locked-fld bool-row">
            <label><JIcon.Lock s={12} /> 입금 완료</label>
            <button
              type="button"
              className={`jobs-switch sm ${watch('paid') ? 'on' : ''}`}
              onClick={() => {
                const el = document.querySelector('input[name="paid"]') as HTMLInputElement | null
                if (el) el.click()
              }}
            />
            <input type="checkbox" {...register('paid')} style={{ display: 'none' }} />
          </div>
          <div className="jobs-locked-fld wide">
            <label><JIcon.Lock s={12} /> 내부 메모</label>
            <textarea className="textarea" {...register('internalMemo')} />
          </div>
        </div>

        <div className="jobs-form-footer">
          <button type="button" className="btn ghost" onClick={() => navigate('/admin/jobs')}>취소</button>
          <div className="grow" />
          <button type="submit" className="btn primary" disabled={saving}>
            {saving ? '저장 중...' : isPublished ? '저장 · 공유' : '저장'}
          </button>
        </div>
      </div>
    </form>
  )
}
