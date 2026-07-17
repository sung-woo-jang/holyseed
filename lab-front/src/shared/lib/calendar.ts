/** 월 캘린더 매트릭스 — 일요일 시작, 6주(42칸) 고정 */
export interface CalendarCell {
  date: Date
  /** YYYY-MM-DD */
  key: string
  inMonth: boolean
  isToday: boolean
}

export function toDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function getMonthMatrix(year: number, month: number): CalendarCell[] {
  const first = new Date(year, month - 1, 1)
  const start = new Date(first)
  start.setDate(1 - first.getDay())

  const todayKey = toDateKey(new Date())
  const cells: CalendarCell[] = []
  for (let i = 0; i < 42; i++) {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    const key = toDateKey(date)
    cells.push({
      date,
      key,
      inMonth: date.getMonth() === month - 1,
      isToday: key === todayKey,
    })
  }
  return cells
}
