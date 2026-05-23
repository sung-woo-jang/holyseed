import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { useToastStore } from '@/stores/toast'
import type { QuoteRequest } from '@/types'
import SchedulePicker, { type SchedValue } from '@/components/common/SchedulePicker'

function fmtKRW(n: number | undefined) {
  if (n == null) return '—'
  return n.toLocaleString('ko-KR') + '원'
}

const STATUS_LABEL: Record<string, string> = {
  pending: '검토 대기', accepted: '수락됨', in_progress: '진행 중', done: '완료', cancelled: '취소됨',
}

const STATUS_NEXT: Record<string, { label: string; next: string }> = {
  pending: { label: '일정 확정', next: 'accepted' },
  accepted: { label: '시공 시작', next: 'in_progress' },
  in_progress: { label: '시공 완료', next: 'done' },
}

export default function AdminRequestDetail() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const showToast = useToastStore((s) => s.show)
  const [r, setR] = useState<QuoteRequest | null>(null)
  const [sched, setSched] = useState<SchedValue>({ date: '', time: null })
  const [savingSched, setSavingSched] = useState(false)

  useEffect(() => {
    if (!code) return
    api.get(`/requests/${code}`).then((res) => {
      const data: QuoteRequest = res.data.data
      setR(data)
      const m = data.prefTimeSlot?.match(/^(\d+)시 이후$/)
      setSched({ date: data.prefDate ?? '', time: m ? Number(m[1]) : null })
    })
  }, [code])

  const saveSchedule = async () => {
    setSavingSched(true)
    try {
      await api.post(`/requests/${code}/schedule`, {
        prefDate: sched.date || null,
        prefTimeSlot: sched.time != null ? `${sched.time}시 이후` : null,
      })
      setR((prev) => prev ? { ...prev, prefDate: sched.date || null, prefTimeSlot: sched.time != null ? `${sched.time}시 이후` : null } : prev)
      showToast('일정이 저장됐어요')
    } catch {
      showToast('저장 실패', 'error')
    } finally {
      setSavingSched(false)
    }
  }

  const updateStatus = async (status: string) => {
    try {
      await api.post(`/requests/${code}/status`, { status })
      setR((prev) => prev ? { ...prev, status: status as QuoteRequest['status'] } : prev)
      showToast('상태가 업데이트됐어요')
    } catch {
      showToast('업데이트 실패', 'error')
    }
  }

  if (!r) return <div className="empty mt-40">로딩 중...</div>

  const total = (r.itemsTotal ?? 0) + (r.visitFee ?? 0)
  const action = STATUS_NEXT[r.status]

  return (
    <>
      <div className="steps mb-16">
        <span className="link" onClick={() => navigate('/admin/requests')}>견적 요청</span>
        <span className="sep">›</span>
        <b className="mono">{r.code}</b>
      </div>

      <div className="spread mb-24" style={{ alignItems: 'end', flexWrap: 'wrap' }}>
        <h1 className="h2">{r.contactName} 고객</h1>
        <span className="tag">{STATUS_LABEL[r.status] ?? r.status}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24 }}>
        {/* 왼쪽 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="card card-pad">
            <h3 className="h3 mb-16">시공 내역</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {r.items?.map((it, i) => (
                <div key={i} className="spread" style={{ padding: '8px 0', borderBottom: '1px solid var(--line-soft)' }}>
                  <span>{it.nameSnapshot}</span>
                  <span className="mono">{fmtKRW(it.priceSnapshot)}</span>
                </div>
              ))}
              <div className="spread mt-8">
                <span className="muted">방문비</span>
                <span className="mono">{fmtKRW(r.visitFee)}</span>
              </div>
              <div className="spread" style={{ paddingTop: 16, borderTop: '1px solid var(--line)' }}>
                <span style={{ fontWeight: 600 }}>총액</span>
                <span className="mono" style={{ fontWeight: 700, fontSize: 18 }}>{fmtKRW(total)}</span>
              </div>
            </div>
          </div>

          {r.memo && (
            <div className="card card-pad">
              <h3 className="h3 mb-16">고객 메모</h3>
              <p style={{ margin: 0, lineHeight: 1.7 }}>{r.memo}</p>
            </div>
          )}

          {(r.photos?.length ?? 0) > 0 && (
            <div className="card card-pad">
              <h3 className="h3 mb-16">첨부 사진 ({r.photos!.length}장)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {r.photos!.map((p, i) => (
                  <div key={i} style={{ aspectRatio: '1', borderRadius: 8, overflow: 'hidden', background: 'var(--bg)' }}>
                    {p.fileUrl && <img src={p.fileUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 오른쪽 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="card card-pad">
            <h3 className="h3 mb-16">고객 정보</h3>
            <dl style={{ display: 'grid', gridTemplateColumns: '72px 1fr', gap: '8px 12px', fontSize: 14, margin: 0 }}>
              <dt className="muted">이름</dt><dd>{r.contactName}</dd>
              <dt className="muted">전화</dt><dd className="mono">{r.contactPhone}</dd>
              <dt className="muted">주소</dt><dd>{r.contactAddress}</dd>
              <dt className="muted">희망일</dt><dd>{r.prefDate ?? '—'} {r.prefTimeSlot ?? ''}</dd>
              <dt className="muted">접수</dt><dd className="mono">{new Date(r.createdAt).toLocaleDateString('ko-KR')}</dd>
            </dl>
            <a className="btn ink block mt-16" href={`tel:${r.contactPhone}`}>{r.contactPhone} 전화</a>
          </div>

          <div className="card card-pad">
            <h3 className="h3 mb-16">방문 일정</h3>
            <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
              {r.prefDate
                ? <>고객 희망: <b>{r.prefDate} {r.prefTimeSlot ?? ''}</b></>
                : '고객이 희망 일정을 남기지 않았어요.'}
            </p>
            <SchedulePicker value={sched} onChange={setSched} />
            <button
              className="btn primary block mt-16"
              onClick={saveSchedule}
              disabled={savingSched}
            >
              {savingSched ? '저장 중...' : '일정 저장'}
            </button>
          </div>

          <div className="card card-pad">
            <h3 className="h3 mb-16">상태 업데이트</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {action && (
                <button className="btn primary block" onClick={() => updateStatus(action.next)}>{action.label}</button>
              )}
              {r.status === 'pending' && (
                <button className="btn ghost block" onClick={() => updateStatus('cancelled')}>요청 거절</button>
              )}
              {(r.status === 'done' || r.status === 'cancelled') && (
                <div className="muted center" style={{ fontSize: 13 }}>마감된 요청입니다.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
