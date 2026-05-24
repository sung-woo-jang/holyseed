import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import type { ScheduleDay, SlotStatus } from '@/types'

type SlotId = 'am' | 'noon' | 'pm' | 'eve'
type DayStatus = 'open' | 'busy' | 'full' | 'off' | 'none'

export interface SchedValue {
  date: string
  time: number | null // 가능한 가장 이른 시각 (9~18)
}

interface Props {
  value: SchedValue
  onChange: (v: SchedValue) => void
}

const AVAIL_HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18]
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

function ymd(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function isPast(d: Date, today: Date) {
  return d < today
}

function dayStatus(slots: Record<SlotId, SlotStatus> | undefined): DayStatus {
  if (!slots) return 'none'
  const vals = Object.values(slots) as SlotStatus[]
  if (vals.every((v) => v === 'off')) return 'off'
  const openCount = vals.filter((v) => v === 'open').length
  if (openCount === 0) return 'full'
  if (vals.filter((v) => v === 'busy').length > 0) return 'busy'
  return 'open'
}

export default function SchedulePicker({ value, onChange }: Props) {
  const [schedMap, setSchedMap] = useState<Record<string, Record<SlotId, SlotStatus>>>({})

  useEffect(() => {
    api
      .get('/schedule')
      .then((r) => {
        const days: ScheduleDay[] = Array.isArray(r.data.data) ? r.data.data : []
        const map: Record<string, Record<SlotId, SlotStatus>> = {}
        days.forEach((d) => {
          map[d.date] = { am: d.am, noon: d.noon, pm: d.pm, eve: d.eve }
        })
        setSchedMap(map)
      })
      .catch(() => {})
  }, [])

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayKey = ymd(today)
  const maxDate = new Date(today)
  maxDate.setDate(today.getDate() + 60)

  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const canGoPrev = cursor > thisMonthStart
  const canGoNext = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1) <= maxDate

  const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
  const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0)
  const cells: (Date | null)[] = []
  for (let i = 0; i < monthStart.getDay(); i++) cells.push(null)
  for (let d = 1; d <= monthEnd.getDate(); d++) cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), d))
  while (cells.length < 42) cells.push(null)

  const selectedDateObj = value.date ? new Date(value.date + 'T00:00:00') : null

  return (
    <div className="sched-picker">
      {/* 월 네비게이션 */}
      <div className="sched-head">
        <div className="sched-month">
          {cursor.getFullYear()}년 {cursor.getMonth() + 1}월
        </div>
        <div className="sched-nav">
          <button
            type="button"
            className="sched-nav-btn"
            disabled={!canGoPrev}
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            type="button"
            className="sched-nav-btn"
            disabled={!canGoNext}
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* 범례 */}
      <div className="sched-legend">
        <span className="sched-legend-item">
          <span className="sched-dot open" />
          가능
        </span>
        <span className="sched-legend-item">
          <span className="sched-dot busy" />
          일부 가능
        </span>
        <span className="sched-legend-item">
          <span className="sched-dot full" />
          마감
        </span>
        <span className="sched-legend-item">
          <span className="sched-dot off" />
          휴무
        </span>
      </div>

      {/* 요일 헤더 */}
      <div className="sched-grid sched-weekdays">
        {WEEKDAYS.map((w, i) => (
          <div key={w} className={`sched-weekday${i === 0 ? 'sun' : i === 6 ? 'sat' : ''}`}>
            {w}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="sched-grid sched-days">
        {cells.map((d, i) => {
          if (!d) return <div key={i} className="sched-cell empty" />
          const key = ymd(d)
          const past = isPast(d, today)
          const beyond = (d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24) > 60
          const disabled = past || beyond
          const status = dayStatus(schedMap[key])
          const canSelect = !disabled && status !== 'off' && status !== 'full'
          const dow = d.getDay()
          return (
            <button
              key={key}
              type="button"
              disabled={!canSelect}
              className={[
                'sched-cell',
                key === value.date ? 'on' : '',
                key === todayKey ? 'today' : '',
                disabled ? 'past' : '',
                status !== 'none' ? `st-${status}` : '',
                dow === 0 ? 'sun' : '',
                dow === 6 ? 'sat' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onChange({ date: key, time: value.time })}
            >
              <span className="sched-cell-day">{d.getDate()}</span>
              {!disabled && status !== 'none' && status !== 'off' && (
                <span className="sched-cell-meta">
                  <span className={`sched-dot ${status === 'full' ? 'full' : status === 'busy' ? 'busy' : 'open'}`} />
                </span>
              )}
              {!disabled && status === 'off' && <span className="sched-cell-meta off-label">휴무</span>}
            </button>
          )
        })}
      </div>

      {/* 날짜 선택 후 — 시간 pill */}
      {value.date && selectedDateObj && (
        <div className="sched-slots">
          <div className="sched-slots-head">
            <div>
              <div className="sched-slots-label">선택한 날짜</div>
              <div className="sched-slots-date">
                {selectedDateObj.getMonth() + 1}월 {selectedDateObj.getDate()}일 ({WEEKDAYS[selectedDateObj.getDay()]})
              </div>
            </div>
            <div className="muted" style={{ fontSize: 13 }}>
              가능한 가장 이른 시간
            </div>
          </div>
          <div className="filter-row" style={{ flexWrap: 'wrap' }}>
            {AVAIL_HOURS.map((h) => (
              <button
                key={h}
                type="button"
                className={`pill${value.time === h ? 'on' : ''}`}
                onClick={() => onChange({ date: value.date, time: value.time === h ? null : h })}
              >
                {h}시~
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
