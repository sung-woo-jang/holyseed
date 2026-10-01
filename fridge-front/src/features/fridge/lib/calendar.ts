import type { FridgeEvent } from '@/api/types'
import { iso, parseIso, startOfToday } from './date'

/** 해당 날짜(key)에 일정이 나타나는지 — 매주 반복은 시작일 이후 같은 요일에 표시 */
export function occurs(e: FridgeEvent, key: string): boolean {
  if (e.date === key) return true
  return e.repeat === 'weekly' && key > e.date && parseIso(key).getDay() === parseIso(e.date).getDay()
}

export function eventsOn(events: FridgeEvent[], key: string, who: 'all' | number, multi: boolean): FridgeEvent[] {
  return events
    .filter((e) => occurs(e, key) && (!multi || who === 'all' || e.personId === who || e.personId === null))
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''))
}

export function weekStart(offset: number): Date {
  const mon = startOfToday()
  mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7) + offset * 7)
  return mon
}

export function weekDates(offset: number): Date[] {
  const mon = weekStart(offset)
  return [...Array(7)].map((_, i) => {
    const d = new Date(mon)
    d.setDate(mon.getDate() + i)
    return d
  })
}

export function weekLabel(offset: number): string {
  const days = weekDates(offset)
  const a = days[0]
  const b = days[6]
  return `${a.getMonth() + 1}월 ${a.getDate()}일 – ${b.getMonth() + 1}월 ${b.getDate()}일`
}

export function monthFirst(offset: number): Date {
  const first = startOfToday()
  first.setDate(1)
  first.setMonth(first.getMonth() + offset)
  return first
}

export function monthLabel(offset: number): string {
  const f = monthFirst(offset)
  return `${f.getFullYear()}년 ${f.getMonth() + 1}월`
}

/** 월간 6주(42칸) 그리드 — 월요일 시작 */
export function monthCells(offset: number): { key: string; date: Date; inMonth: boolean }[] {
  const first = monthFirst(offset)
  const start = new Date(first)
  start.setDate(1 - ((first.getDay() + 6) % 7))
  return [...Array(42)].map((_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return { key: iso(d), date: d, inMonth: d.getMonth() === first.getMonth() }
  })
}
