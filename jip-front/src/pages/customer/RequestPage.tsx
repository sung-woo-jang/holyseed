import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { api } from '@/lib/api'
import { useCartStore } from '@/stores/cart'
import { useToastStore } from '@/stores/toast'

function fmtKRW(n: number) { return n.toLocaleString('ko-KR') + '원' }

const VISIT_FEE = 20000
const TIME_SLOTS = [
  { id: 'am', label: '오전 9–12시' },
  { id: 'noon', label: '낮 1–3시' },
  { id: 'pm', label: '오후 3–6시' },
  { id: 'eve', label: '저녁 6시 이후' },
]

interface FormValues {
  contactName: string
  contactPhone: string
  contactAddress: string
  prefDate: string
  prefTimeSlot: string
  memo: string
}

export default function RequestPage() {
  const navigate = useNavigate()
  const { items } = useCartStore()
  const showToast = useToastStore((s) => s.show)
  const [submitting, setSubmitting] = useState(false)
  const [photoUrls, setPhotoUrls] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (photoUrls.length + files.length > 4) {
      showToast('사진은 최대 4장까지 가능해요', 'error')
      return
    }
    setUploading(true)
    try {
      const urls: string[] = []
      for (const file of files) {
        const fd = new FormData()
        fd.append('file', file)
        const res = await api.post('/uploads/request-photo', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        urls.push(res.data.data.url)
      }
      setPhotoUrls((prev) => [...prev, ...urls])
    } catch {
      showToast('사진 업로드 실패', 'error')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const removePhoto = (idx: number) => setPhotoUrls((prev) => prev.filter((_, i) => i !== idx))

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues: { prefTimeSlot: 'am' },
  })

  const serviceTotal = items.reduce((s, i) => s + i.serviceItemPrice, 0)
  const productTotal = items.reduce((s, i) => s + i.productPrice, 0)
  const total = serviceTotal + productTotal + VISIT_FEE

  if (items.length === 0) {
    return (
      <section className="section">
        <div className="container">
          <div className="empty">
            <h3 className="h3">견적함이 비어있어요</h3>
            <button className="btn primary mt-24" onClick={() => navigate('/services')}>서비스 담으러 가기</button>
          </div>
        </div>
      </section>
    )
  }

  const onSubmit = async (form: FormValues) => {
    setSubmitting(true)
    try {
      const payload = {
        ...form,
        items: items.map((i) => ({
          itemCode: i.serviceItemCode,
          nameSnapshot: i.serviceItemName,
          unitSnapshot: i.serviceItemUnit,
          priceSnapshot: i.serviceItemPrice,
          productCode: i.productCode,
          productSnapshot: i.productCode ? {
            name: i.productName, brand: i.productBrand, price: i.productPrice,
          } : null,
        })),
        visitFee: VISIT_FEE,
        itemsTotal: serviceTotal + productTotal,
        photoUrls,
      }
      const res = await api.post('/requests', payload)
      const code = res.data.data.code
      navigate(`/request-done/${code}`)
    } catch {
      showToast('요청 실패. 다시 시도해주세요.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="section">
      <div className="container">
        <h1 className="h2">견적 요청</h1>
        <p className="lead mt-12">연락처와 희망 일정을 알려주세요.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="request-form mt-40">
          <div className="request-form-main">

            {/* 연락처 */}
            <div className="form-card">
              <h3 className="h3 mb-24">연락처</h3>
              <div className="form-row">
                <label>이름 *</label>
                <input {...register('contactName', { required: true })} placeholder="홍길동" />
                {errors.contactName && <span className="form-error">이름을 입력해주세요</span>}
              </div>
              <div className="form-row mt-16">
                <label>전화번호 *</label>
                <input {...register('contactPhone', { required: true })} placeholder="010-0000-0000" />
                {errors.contactPhone && <span className="form-error">전화번호를 입력해주세요</span>}
              </div>
              <div className="form-row mt-16">
                <label>주소 *</label>
                <input {...register('contactAddress', { required: true })} placeholder="서울 강남구 역삼동..." />
                {errors.contactAddress && <span className="form-error">주소를 입력해주세요</span>}
              </div>
            </div>

            {/* 희망 일정 */}
            <div className="form-card mt-24">
              <h3 className="h3 mb-24">희망 일정</h3>
              <div className="form-row">
                <label>희망 날짜</label>
                <input type="date" {...register('prefDate')} min={new Date().toISOString().slice(0, 10)} />
              </div>
              <div className="form-row mt-16">
                <label>희망 시간대</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {TIME_SLOTS.map((s) => (
                    <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <input type="radio" value={s.id} {...register('prefTimeSlot')} />
                      {s.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* 메모 */}
            <div className="form-card mt-24">
              <h3 className="h3 mb-16">메모 (선택)</h3>
              <textarea {...register('memo')} placeholder="추가로 알려주실 내용이 있으면 적어주세요." rows={4} style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid var(--border)', fontSize: 14 }} />
            </div>

            {/* 사진 첨부 */}
            <div className="form-card mt-24">
              <h3 className="h3 mb-8">사진 첨부 (선택)</h3>
              <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>현재 상태 사진을 최대 4장 보내주시면 더 정확한 견적을 드릴 수 있어요.</p>
              {photoUrls.length > 0 && (
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
                  {photoUrls.map((url, i) => (
                    <div key={i} style={{ position: 'relative' }}>
                      <img src={url} alt="" style={{ width: 100, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} />
                      <button type="button" onClick={() => removePhoto(i)} style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: '#EF4444', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                    </div>
                  ))}
                </div>
              )}
              {photoUrls.length < 4 && (
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 8, border: '1px dashed var(--border)', cursor: uploading ? 'wait' : 'pointer', fontSize: 14, color: 'var(--ink-muted)' }}>
                  <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handlePhotoSelect} disabled={uploading} />
                  {uploading ? '업로드 중...' : '+ 사진 추가'}
                </label>
              )}
            </div>

          </div>

          {/* 요약 사이드 */}
          <div className="cart-summary">
            <h3 className="h3 mb-24">요청 요약</h3>
            {items.map((item, i) => (
              <div key={i} className="summary-row" style={{ flexDirection: 'column', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{item.serviceItemName}</div>
                {item.productName && <div className="muted" style={{ fontSize: 13 }}>{item.productBrand} {item.productName}</div>}
                <div className="muted" style={{ fontSize: 13 }}>{fmtKRW(item.serviceItemPrice + item.productPrice)}</div>
              </div>
            ))}
            <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid var(--border)' }} />
            <div className="summary-row">
              <span>시공비</span><span>{fmtKRW(serviceTotal)}</span>
            </div>
            {productTotal > 0 && (
              <div className="summary-row">
                <span>자재비</span><span>{fmtKRW(productTotal)}</span>
              </div>
            )}
            <div className="summary-row">
              <span>방문비</span><span>{fmtKRW(VISIT_FEE)}</span>
            </div>
            <div className="summary-total">
              <span>예상 총액</span><span>{fmtKRW(total)}</span>
            </div>
            <button type="submit" className="btn primary xl mt-24 w-full" disabled={submitting}>
              {submitting ? '전송 중...' : '견적 요청 보내기 →'}
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}
