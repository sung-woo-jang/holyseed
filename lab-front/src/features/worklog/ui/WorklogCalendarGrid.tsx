import { useMemo } from 'react'
import type { Worklog } from '@/features/worklog/api/types'
import { cn } from '@/shared/lib/utils'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

interface WorklogCalendarGridProps {
  year: number
  month: number
  records: Worklog[]
  onDayClick: (date: string, existing: Worklog | null) => void
}

/** 월간 캘린더 — 날짜 아래에 그날 체크한 업무를 ● 목록으로 간단히 표시 */
export function WorklogCalendarGrid({ year, month, records, onDayClick }: WorklogCalendarGridProps) {
  const recordsByDate = useMemo(() => {
    const map = new Map<string, Worklog>()
    for (const r of records) map.set(r.workDate, r)
    return map
  }, [records])

  const cells = useMemo(() => {
    const startWeekday = new Date(year, month - 1, 1).getDay()
    const daysInMonth = new Date(year, month, 0).getDate()
    const list: (string | null)[] = Array(startWeekday).fill(null)
    for (let day = 1; day <= daysInMonth; day++) {
      list.push(`${year}-${pad(month)}-${pad(day)}`)
    }
    while (list.length % 7 !== 0) list.push(null)
    return list
  }, [year, month])

  const todayStr = new Date().toISOString().slice(0, 10)

  return (
    <div className="overflow-x-auto">
      <div className="bg-border grid min-w-[560px] grid-cols-7 gap-px overflow-hidden rounded-lg border text-sm">
        {WEEKDAYS.map((d) => (
          <div key={d} className="bg-muted text-muted-foreground p-2 text-center text-xs font-medium">
            {d}
          </div>
        ))}
        {cells.map((date, i) => {
          if (!date) return <div key={i} className="bg-background min-h-24" />

          const record = recordsByDate.get(date) ?? null
          const dayNum = Number(date.slice(-2))
          const isToday = date === todayStr
          const jobs = record?.jobs.length ? record.jobs : record ? [record.title] : []

          return (
            <button
              key={date}
              type="button"
              onClick={() => onDayClick(date, record)}
              className={cn(
                'bg-background hover:bg-accent min-h-24 p-1.5 text-left align-top transition-colors',
                isToday && 'ring-primary ring-2 ring-inset'
              )}
            >
              <div className="text-muted-foreground text-xs">{dayNum}</div>
              {record?.payStatus === 'DAYOFF' ? (
                <div className="text-muted-foreground mt-1 text-xs">(휴무)</div>
              ) : (
                <div className="mt-1 space-y-0.5">
                  {jobs.map((j, idx) => (
                    <div key={`${j}-${idx}`} className="truncate text-xs">
                      ● {j}
                    </div>
                  ))}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
