import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import SchedulePicker, { type SchedValue } from '@/components/common/SchedulePicker'
import { api } from '@/lib/api'
import { useCartStore } from '@/stores/cart'
import { useToastStore } from '@/stores/toast'

function fmtKRW(n: number) {
  return n.toLocaleString('ko-KR') + '원'
}

const VISIT_FEE = 20000

const STEPS = ['서비스 선택', '견적함', '요청 보내기']
function Steps({ current }: { current: number }) {
  return (
    <div className="steps mb-24">
      {STEPS.map((it, i) => (
        <span key={i} style={{ display: 'contents' }}>
          {i > 0 && <span className="sep">·</span>}
          {i === current ? (
            <b>
              0{i + 1} {it}
            </b>
          ) : (
            <span>
              0{i + 1} {it}
            </span>
          )}
        </span>
      ))}
    </div>
  )
}

interface FormValues {
  contactName: string
  contactPhone: string
  contactAddress: string
  memo: string
}

export default function RequestPage() {
  const navigate = useNavigate()
  const { items } = useCartStore()
  const showToast = useToastStore((s) => s.show)
  const [submitting, setSubmitting] = useState(false)
  const [photoUrls, setPhotoUrls] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [pref, setPref] = useState<SchedValue>({ date: '', time: null })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>()

  const itemsTotal = items.reduce((s, i) => s + i.serviceItemPrice + i.productPrice, 0)
  const total = itemsTotal + VISIT_FEE

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

  if (items.length === 0) {
    return (
      <section className="section">
        <div className="container">
          <div className="empty">
            <h3 className="h3">견적함이 비어있어요</h3>
            <button className="btn primary mt-24" onClick={() => navigate('/services')}>
              서비스 담으러 가기
            </button>
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
        prefDate: pref.date || null,
        prefTimeSlot: pref.time != null ? `${pref.time}시 이후` : null,
        items: items.map((i) => ({
          itemCode: i.serviceItemCode,
          nameSnapshot: i.serviceItemName,
          unitSnapshot: i.serviceItemUnit,
          priceSnapshot: i.serviceItemPrice,
          productCode: i.productCode,
          productSnapshot: i.productCode
            ? {
                name: i.productName,
                brand: i.productBrand,
                price: i.productPrice,
              }
            : null,
        })),
        visitFee: VISIT_FEE,
        itemsTotal,
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
        <Steps current={2} />
        <h1 className="h2">견적 요청</h1>
        <p className="lead mt-16">전화번호와 주소만 남겨주세요. 회원가입은 없습니다.</p>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="cart-grid mt-40">
            {/* 왼쪽 — 폼 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* 연락처 */}
              <div className="card card-pad">
                <h3 className="h3 mb-20">연락처</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="field">
                      <label className="field-label">이름 *</label>
                      <input className="input" placeholder="홍길동" {...register('contactName', { required: true })} />
                      {errors.contactName && <span className="form-error">이름을 입력해주세요</span>}
                    </div>
                    <div className="field">
                      <label className="field-label">전화번호 *</label>
                      <input
                        className="input"
                        placeholder="010-0000-0000"
                        {...register('contactPhone', { required: true })}
                      />
                      {errors.contactPhone && <span className="form-error">전화번호를 입력해주세요</span>}
                    </div>
                  </div>
                  <div className="field">
                    <label className="field-label">시공 주소 *</label>
                    <input
                      className="input"
                      placeholder="서울 ○○구 ○○로 00, 동·호수"
                      {...register('contactAddress', { required: true })}
                    />
                    <span className="field-hint">정확한 동·호수까지 적어주세요. 방문 일정 잡을 때 필요합니다.</span>
                    {errors.contactAddress && <span className="form-error">주소를 입력해주세요</span>}
                  </div>
                </div>
              </div>

              {/* 희망 일정 */}
              <div className="card card-pad">
                <div className="spread mb-20" style={{ flexWrap: 'wrap', gap: 8 }}>
                  <h3 className="h3">희망 일정</h3>
                  {pref.date && pref.time != null ? (
                    <span className="tag orange">
                      {new Date(pref.date + 'T00:00:00').toLocaleDateString('ko-KR', {
                        month: 'long',
                        day: 'numeric',
                        weekday: 'short',
                      })}{' '}
                      · {pref.time}시 이후
                    </span>
                  ) : (
                    <span className="muted" style={{ fontSize: 13 }}>
                      날짜를 골라주세요 (선택)
                    </span>
                  )}
                </div>
                <SchedulePicker value={pref} onChange={setPref} />
                <p className="field-hint mt-16">
                  김장인 일정 캘린더와 연동돼 있어요. 가능한 시간만 선택할 수 있고, 확정은 통화 후 결정됩니다.
                </p>
              </div>

              {/* 사진 + 메모 */}
              <div className="card card-pad">
                <h3 className="h3 mb-20">
                  사진 · 메모
                  <span className="muted" style={{ fontSize: 13, fontWeight: 400, marginLeft: 8 }}>
                    (선택)
                  </span>
                </h3>

                <div className="field">
                  <label className="field-label">시공 부위 사진</label>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
                    {photoUrls.map((url, i) => (
                      <div key={i} style={{ position: 'relative' }}>
                        <img
                          src={url}
                          alt=""
                          style={{
                            width: 88,
                            height: 88,
                            objectFit: 'cover',
                            borderRadius: 10,
                            border: '1px solid var(--line)',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(i)}
                          style={{
                            position: 'absolute',
                            top: -6,
                            right: -6,
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            background: '#EF4444',
                            color: '#fff',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: 11,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    {photoUrls.length < 4 && (
                      <label
                        style={{
                          width: 88,
                          height: 88,
                          borderRadius: 10,
                          background: 'var(--bg-deep)',
                          border: '1px dashed var(--line)',
                          cursor: uploading ? 'wait' : 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 4,
                          color: 'var(--ink-4)',
                          fontSize: 12,
                        }}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          style={{ display: 'none' }}
                          onChange={handlePhotoSelect}
                          disabled={uploading}
                        />
                        <span style={{ fontSize: 22, lineHeight: 1 }}>+</span>
                        <span>{uploading ? '...' : '사진 추가'}</span>
                      </label>
                    )}
                  </div>
                  <span className="field-hint">최대 4장. 정확한 견적에 도움이 됩니다.</span>
                </div>

                <div className="field" style={{ marginTop: 16 }}>
                  <label className="field-label">메모</label>
                  <textarea
                    className="textarea"
                    rows={4}
                    placeholder="어떤 증상이 있는지, 원하는 자재가 있는지 자유롭게 적어주세요."
                    {...register('memo')}
                  />
                </div>
              </div>
            </div>

            {/* 오른쪽 — 요청 요약 */}
            <aside className="summary">
              <h3 className="h3 mb-16">요청 내용</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {items.map((item, i) => (
                  <div key={i} style={{ fontSize: 14 }}>
                    <div className="spread">
                      <span style={{ fontWeight: 600 }}>{item.serviceItemName}</span>
                      <span>{fmtKRW(item.serviceItemPrice + item.productPrice)}</span>
                    </div>
                    {item.productName && (
                      <div style={{ fontSize: 12, color: 'var(--ink-4)', marginTop: 2 }}>
                        {item.productBrand} {item.productName} · 자재 {fmtKRW(item.productPrice)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="summary-row">
                <span className="label">방문비</span>
                <span>{fmtKRW(VISIT_FEE)}</span>
              </div>
              <div className="summary-row big">
                <span>예상 총액</span>
                <span className="num">{fmtKRW(total)}</span>
              </div>
              <p className="muted" style={{ fontSize: 12, marginTop: 12 }}>
                실제 금액은 현장 확인 후 확정됩니다. 시공 완료 후 결제.
              </p>
              <button type="submit" className="btn primary lg mt-24 block" disabled={submitting}>
                {submitting ? '전송 중...' : '견적 요청 보내기'}
              </button>
              {!pref.date && (
                <p className="muted" style={{ fontSize: 12, marginTop: 8, textAlign: 'center' }}>
                  일정은 선택 사항이에요
                </p>
              )}
            </aside>
          </div>
        </form>
      </div>
    </section>
  )
}
