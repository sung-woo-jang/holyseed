import assert from 'node:assert/strict'
import { test } from 'node:test'
import { checkWindow } from '../src/marketTime.ts'
import type { UsMarketCalendar } from '../src/marketTime.ts'

// 2026-07-15 새벽 실제 응답 재현: today는 KST 날짜 기준이라
// 진행 중인 세션(05:00 마감)이 previousBusinessDay에 있음
const calendar: UsMarketCalendar = {
  previousBusinessDay: {
    date: '2026-07-14',
    dayMarket: null,
    preMarket: null,
    regularMarket: { startTime: '2026-07-14T22:30:00+09:00', endTime: '2026-07-15T05:00:00+09:00' },
    afterMarket: null,
  },
  today: {
    date: '2026-07-15',
    dayMarket: null,
    preMarket: null,
    regularMarket: { startTime: '2026-07-15T22:30:00+09:00', endTime: '2026-07-16T05:00:00+09:00' },
    afterMarket: null,
  },
  nextBusinessDay: {
    date: '2026-07-16',
    dayMarket: null,
    preMarket: null,
    regularMarket: { startTime: '2026-07-16T22:30:00+09:00', endTime: '2026-07-17T05:00:00+09:00' },
    afterMarket: null,
  },
}

test('회귀: KST 04:30 — previousBusinessDay 세션 마감 30분 전 → 실행 창', () => {
  const win = checkWindow(calendar, new Date('2026-07-15T04:30:00+09:00'))
  assert.equal(win.ok, true)
  assert.equal(win.usDate, '2026-07-14')
})

test('KST 05:30 — 이미 마감 지남, 다음 세션은 멀었음 → 스킵', () => {
  const win = checkWindow(calendar, new Date('2026-07-15T05:30:00+09:00'))
  assert.equal(win.ok, false)
})

test('EST 기간: KST 05:30 실행이 06:00 마감 창에 듦', () => {
  const estCal = structuredClone(calendar)
  estCal.previousBusinessDay.regularMarket = {
    startTime: '2026-01-13T23:30:00+09:00',
    endTime: '2026-01-14T06:00:00+09:00',
  }
  const win = checkWindow(estCal, new Date('2026-01-14T05:30:00+09:00'))
  assert.equal(win.ok, true)
})

test('휴장일 (regularMarket 전부 null) → 스킵', () => {
  const holiday: UsMarketCalendar = {
    previousBusinessDay: { ...calendar.previousBusinessDay, regularMarket: null },
    today: { ...calendar.today, regularMarket: null },
    nextBusinessDay: { ...calendar.nextBusinessDay, regularMarket: null },
  }
  const win = checkWindow(holiday, new Date('2026-07-15T04:30:00+09:00'))
  assert.equal(win.ok, false)
})

test('마감 10분 전 (창 지남) → 스킵', () => {
  const win = checkWindow(calendar, new Date('2026-07-15T04:50:00+09:00'))
  assert.equal(win.ok, false)
})
