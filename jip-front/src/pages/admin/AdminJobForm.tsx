import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { api } from '@/lib/api'
import { useToastStore } from '@/stores/toast'
import type { Job, JobStatus } from '@/types'

// 공개 가능 필드
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

  const uploadPhoto = async (file: File, role: 'before' | 'after') => {
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
        const fileUrl = await uploadPhoto(file, role)
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

  const { register, handleSubmit, reset } = useForm<FormValues>({
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
      if (job.publicFields) setPublicFields(job.publicFields)
      if (job.beforePhotos || job.afterPhotos) {
        const before = (job.beforePhotos ?? []).map((p) => ({ role: 'before' as const, label: p.label ?? '', fileUrl: p.fileUrl ?? '' }))
        const after = (job.afterPhotos ?? []).map((p) => ({ role: 'after' as const, label: p.label ?? '', fileUrl: p.fileUrl ?? '' }))
        setPhotos([...before, ...after])
      }
    })
  }, [id, isEdit, reset])

  const togglePublicField = (key: string) => {
    setPublicFields((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const onSubmit = async (form: FormValues) => {
    setSaving(true)
    try {
      const payload = {
        ...form,
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

  return (
    <section className="section admin-page">
      <div className="container">
        <div className="steps mb-24">
          <button className="link" onClick={() => navigate('/admin/jobs')}>시공 일지</button>
          <span className="sep">›</span>
          <b>{isEdit ? '수정' : '새 일지'}</b>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>

          {/* 공개 스위치 */}
          <div className="form-card mb-24" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
              <input type="checkbox" {...register('isPublished')} style={{ width: 20, height: 20 }} />
              <span style={{ fontWeight: 700 }}>공개 (URL로 공유 가능)</span>
            </label>
          </div>

          <div className="admin-detail-layout">
            <div>
              {/* 공개 가능 필드 */}
              <div className="form-card mb-24">
                <h3 className="h3 mb-20">시공 정보</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {[
                    { key: 'customerName', fkey: 'customer_name', label: '고객명', type: 'text' },
                    { key: 'phone', fkey: 'phone', label: '전화번호', type: 'text' },
                    { key: 'addressShort', fkey: 'address_short', label: '간이주소', type: 'text' },
                    { key: 'addressFull', fkey: 'address_full', label: '상세주소', type: 'text' },
                    { key: 'inquiryDate', fkey: 'inquiry_date', label: '문의일', type: 'date' },
                    { key: 'workDate', fkey: 'work_date', label: '시공일', type: 'date' },
                    { key: 'productName', fkey: 'product_name', label: '제품명', type: 'text' },
                    { key: 'brand', fkey: 'brand', label: '브랜드', type: 'text' },
                    { key: 'model', fkey: 'model', label: '모델명', type: 'text' },
                  ].map(({ key, fkey, label, type }) => (
                    <div key={key}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <label style={{ fontSize: 13, fontWeight: 600 }}>{label}</label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 12 }}>
                          <input type="checkbox" checked={publicFields.includes(fkey)} onChange={() => togglePublicField(fkey)} />
                          공개
                        </label>
                      </div>
                      <input type={type} {...register(key as keyof FormValues)} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 14 }} />
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <label style={{ fontSize: 13, fontWeight: 600 }}>진행상황</label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 12 }}>
                      <input type="checkbox" checked={publicFields.includes('status')} onChange={() => togglePublicField('status')} />
                      공개
                    </label>
                  </div>
                  <select {...register('status')} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 14 }}>
                    <option value="문의접수">문의접수</option>
                    <option value="시공대기">시공대기</option>
                    <option value="시공완료">시공완료</option>
                  </select>
                </div>

                {[
                  { key: 'requestNote', fkey: 'request_note', label: '요청사항' },
                  { key: 'workSummary', fkey: 'work_summary', label: '작업요약' },
                ].map(({ key, fkey, label }) => (
                  <div key={key} style={{ marginTop: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <label style={{ fontSize: 13, fontWeight: 600 }}>{label}</label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 12 }}>
                        <input type="checkbox" checked={publicFields.includes(fkey)} onChange={() => togglePublicField(fkey)} />
                        공개
                      </label>
                    </div>
                    <textarea {...register(key as keyof FormValues)} rows={3} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 14 }} />
                  </div>
                ))}
              </div>
            </div>

            {/* 내부 전용 */}
            <div>
              <div className="form-card" style={{ borderLeft: '4px solid var(--ink)' }}>
                <h3 className="h3 mb-16">🔒 내부 전용</h3>
                {[
                  { key: 'sellingPrice', label: '시공비', type: 'number' },
                  { key: 'costPrice', label: '자재원가', type: 'number' },
                  { key: 'materialSource', label: '자재 구매처', type: 'text' },
                  { key: 'paidDate', label: '입금일', type: 'date' },
                ].map(({ key, label, type }) => (
                  <div key={key} style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>{label}</label>
                    <input type={type} {...register(key as keyof FormValues)} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 14 }} />
                  </div>
                ))}
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 12 }}>
                  <input type="checkbox" {...register('paid')} />
                  <span style={{ fontWeight: 600 }}>입금 완료</span>
                </label>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>내부 메모</label>
                  <textarea {...register('internalMemo')} rows={4} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 14 }} />
                </div>
              </div>
            </div>
          </div>

          {/* 사진 업로드 */}
          <div className="form-card mt-24">
            <h3 className="h3 mb-20">사진</h3>
            {(['before', 'after'] as const).map((role) => {
              const roleName = role === 'before' ? '시공 전' : '시공 후'
              const roleIndices = photos.reduce<number[]>((acc, p, i) => { if (p.role === role) acc.push(i); return acc }, [])
              return (
                <div key={role} style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{roleName}</span>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 6, border: '1px dashed var(--border)', cursor: uploadingRole === role ? 'wait' : 'pointer', fontSize: 13, color: 'var(--ink-muted)' }}>
                      <input type="file" accept="image/*" multiple style={{ display: 'none' }} disabled={uploadingRole !== null} onChange={(e) => handlePhotoAdd(e, role)} />
                      {uploadingRole === role ? '업로드 중...' : '+ 추가'}
                    </label>
                  </div>
                  {roleIndices.length > 0 ? (
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      {roleIndices.map((gi) => {
                        const p = photos[gi]
                        return (
                          <div key={gi} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <div style={{ position: 'relative', width: 120, height: 90 }}>
                              {p.fileUrl ? (
                                <img src={p.fileUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} />
                              ) : (
                                <div style={{ width: '100%', height: '100%', borderRadius: 8, background: 'var(--gray)', border: '1px solid var(--border)' }} />
                              )}
                              <button type="button" onClick={() => removePhoto(gi)} style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: '#EF4444', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                            </div>
                            <input value={p.label} onChange={(e) => updatePhotoLabel(gi, e.target.value)} placeholder="설명 (선택)" style={{ width: 120, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 12 }} />
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="muted" style={{ fontSize: 13 }}>아직 {roleName} 사진이 없어요.</div>
                  )}
                </div>
              )
            })}
          </div>

          <div style={{ marginTop: 32, display: 'flex', gap: 12 }}>
            <button type="submit" className="btn primary xl" disabled={saving}>{saving ? '저장 중...' : '저장'}</button>
            <button type="button" className="btn ghost xl" onClick={() => navigate('/admin/jobs')}>취소</button>
          </div>
        </form>
      </div>
    </section>
  )
}
