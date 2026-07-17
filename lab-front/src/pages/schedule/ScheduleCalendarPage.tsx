import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { PageHeader } from '@/widgets/page-header'
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/lib/utils'
import { getMonthMatrix, toDateKey } from '@/shared/lib/calendar'
import { useSchedulesRange } from '@/features/schedule/api/hooks'
import type { Schedule } from '@/features/schedule/api/types'
import { ScheduleDialog } from '@/features/schedule/ui/ScheduleDialog'
import { tagColor } from '@/features/schedule/lib/tag-colors'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

export default function ScheduleCalendarPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Schedule | null>(null)
  const [defaultDate, setDefaultDate] = useState(toDateKey(now))

  const cells = useMemo(() => getMonthMatrix(year, month), [year, month])
  const from = `${cells[0].key}T00:00:00+09:00`
  const to = `${cells[41].key}T23:59:59+09:00`
  const { data: res } = useSchedulesRange(from, to)
  const schedules = res?.data ?? []

  /** 날짜키 → 해당 일자에 걸치는 일정 목록 */
  const byDay = useMemo(() => {
    const map = new Map<string, Schedule[]>()
    for (const s of schedules) {
      const start = new Date(s.startAt)
      const end = s.endAt ? new Date(s.endAt) : start
      const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate())
      const last = new Date(end.getFullYear(), end.getMonth(), end.getDate())
      while (cursor <= last) {
        const key = toDateKey(cursor)
        if (!map.has(key)) map.set(key, [])
        map.get(key)!.push(s)
        cursor.setDate(cursor.getDate() + 1)
      }
    }
    return map
  }, [schedules])

  function moveMonth(delta: number) {
    const d = new Date(year, month - 1 + delta, 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth() + 1)
  }

  function openCreate(dateKey: string) {
    setEditing(null)
    setDefaultDate(dateKey)
    setDialogOpen(true)
  }

  function openEdit(schedule: Schedule, e: React.MouseEvent) {
    e.stopPropagation()
    setEditing(schedule)
    setDialogOpen(true)
  }

  return (
    <div className="p-6">
      <PageHeader
        title="일정 캘린더"
        description="셀 클릭 = 해당 날짜에 일정 등록, 일정 클릭 = 수정"
        action={
          <Button onClick={() => openCreate(toDateKey(new Date()))}>
            <Plus className="mr-1 size-4" /> 일정 등록
          </Button>
        }
      />

      <div className="mt-6 flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => moveMonth(-1)}>
          <ChevronLeft className="size-4" />
        </Button>
        <span className="w-28 text-center text-sm font-semibold">
          {year}년 {month}월
        </span>
        <Button variant="outline" size="icon" onClick={() => moveMonth(1)}>
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border bg-card">
        <div className="grid grid-cols-7 border-b bg-muted/40">
          {WEEKDAYS.map((d, i) => (
            <div
              key={d}
              className={cn(
                'px-2 py-1.5 text-center text-xs font-medium text-muted-foreground',
                i === 0 && 'text-red-500',
                i === 6 && 'text-blue-500',
              )}
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((cell, i) => {
            const daySchedules = byDay.get(cell.key) ?? []
            return (
              <div
                key={cell.key}
                className={cn(
                  'min-h-24 cursor-pointer border-b border-r p-1.5 transition-colors hover:bg-accent/50',
                  i % 7 === 6 && 'border-r-0',
                  i >= 35 && 'border-b-0',
                  !cell.inMonth && 'bg-muted/30 text-muted-foreground',
                )}
                onClick={() => openCreate(cell.key)}
              >
                <span
                  className={cn(
                    'inline-flex size-6 items-center justify-center rounded-full text-xs',
                    cell.isToday && 'bg-primary font-semibold text-primary-foreground',
                    !cell.isToday && cell.date.getDay() === 0 && 'text-red-500',
                    !cell.isToday && cell.date.getDay() === 6 && 'text-blue-500',
                  )}
                >
                  {cell.date.getDate()}
                </span>
                <div className="mt-1 space-y-0.5">
                  {daySchedules.slice(0, 3).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={(e) => openEdit(s, e)}
                      className={cn('block w-full truncate rounded px-1 py-0.5 text-left text-[11px]', tagColor(s.tags[0] ?? '기타'))}
                      title={s.title}
                    >
                      {!s.allDay && (
                        <span className="mr-0.5 opacity-70">
                          {new Date(s.startAt).toTimeString().slice(0, 5)}
                        </span>
                      )}
                      {s.title}
                    </button>
                  ))}
                  {daySchedules.length > 3 && (
                    <p className="px-1 text-[10px] text-muted-foreground">+{daySchedules.length - 3}개 더</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <ScheduleDialog open={dialogOpen} onClose={() => setDialogOpen(false)} editing={editing} defaultDate={defaultDate} />
    </div>
  )
}
