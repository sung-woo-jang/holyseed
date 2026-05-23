import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { useToastStore } from '@/stores/toast'
import type { ScheduleDay, SlotStatus } from '@/types'

const SLOTS = [
  { id: 'am', label: '오전', range: '9–12시' },
  { id: 'noon', label: '낮', range: '1–3시' },
  { id: 'pm', label: '오후', range: '3–6시' },
  { id: 'eve', label: '저녁', range: '6시 이후' },
] as const

const STATUS_CYCLE: SlotStatus[] = ['open', 'busy', 'off']
const STATUS_COLOR: Record<SlotStatus, string> = {
  open: '#10B981', busy: '#F59E0B', off: '#9CA3AF',
}
const STATUS_LABEL: Record<SlotStatus, string> = {
  open: '가능', busy: '예약', off: '닫힘',
}

type SlotId = 'am' | 'noon' | 'pm' | 'eve'

export default function AdminSchedule() {
  const showToast = useToastStore((s) => s.show)
  const [days, setDays] = useState<ScheduleDay[]>([])

  useEffect(() => {
    api.get('/schedule').then((r) => setDays(r.data.data))
  }, [])

  const toggleSlot = async (date: string, slot: SlotId, current: SlotStatus) => {
    const nextIdx = (STATUS_CYCLE.indexOf(current) + 1) % STATUS_CYCLE.length
    const next = STATUS_CYCLE[nextIdx]
    try {
      await api.post(`/schedule/admin/${date}`, { [slot]: next })
      setDays((prev) => prev.map((d) => d.date === date ? { ...d, [slot]: next } : d))
    } catch {
      showToast('업데이트 실패', 'error')
    }
  }

  const DAYS_KO = ['일', '월', '화', '수', '목', '금', '토']

  return (
    <section className="section admin-page">
      <div className="container">
        <h1 className="h2">일정 관리</h1>
        <p className="lead mt-8">슬롯을 클릭해 상태를 변경하세요.</p>

        <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
          {Object.entries(STATUS_COLOR).map(([s, c]) => (
            <span key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: c, display: 'inline-block' }} />
              {STATUS_LABEL[s as SlotStatus]}
            </span>
          ))}
        </div>

        <div style={{ overflowX: 'auto', marginTop: 32 }}>
          <table className="admin-table schedule-table">
            <thead>
              <tr>
                <th>날짜</th>
                {SLOTS.map((s) => (
                  <th key={s.id}>{s.label}<div style={{ fontWeight: 400, fontSize: 11 }}>{s.range}</div></th>
                ))}
                <th>메모</th>
              </tr>
            </thead>
            <tbody>
              {days.map((d) => {
                const date = new Date(d.date + 'T00:00:00')
                const dow = DAYS_KO[date.getDay()]
                const isSun = date.getDay() === 0
                return (
                  <tr key={d.date} style={{ color: isSun ? '#EF4444' : undefined }}>
                    <td style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>
                      {d.date.slice(5)} ({dow})
                    </td>
                    {SLOTS.map((s) => {
                      const val = d[s.id as SlotId] as SlotStatus
                      return (
                        <td key={s.id}>
                          <button
                            onClick={() => toggleSlot(d.date, s.id as SlotId, val)}
                            style={{
                              padding: '4px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
                              background: STATUS_COLOR[val] + '20', color: STATUS_COLOR[val],
                              fontWeight: 700, fontSize: 12,
                            }}
                          >
                            {STATUS_LABEL[val]}
                          </button>
                        </td>
                      )
                    })}
                    <td className="muted" style={{ fontSize: 12 }}>{d.note ?? ''}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
