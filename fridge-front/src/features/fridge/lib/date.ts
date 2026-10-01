const DAY = 86400000
export const DOW = ['일', '월', '화', '수', '목', '금', '토']

export function startOfToday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}
export function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
export function parseIso(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export function shift(s: string, n: number): string {
  const d = parseIso(s)
  d.setDate(d.getDate() + n)
  return iso(d)
}
export function todayIso(): string {
  return iso(startOfToday())
}
export function plus(n: number): string {
  return shift(todayIso(), n)
}
/** 오늘 기준 남은 일수 (지난 날짜는 음수) */
export function diffDays(s: string): number {
  return Math.round((parseIso(s).getTime() - startOfToday().getTime()) / DAY)
}
export function dLabel(d: number): string {
  if (d < 0) return `D+${-d}`
  if (d === 0) return 'D-day'
  return `D-${d}`
}
export function fmtDate(s: string): string {
  const d = parseIso(s)
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${DOW[d.getDay()]}요일`
}
export function hhmm(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
