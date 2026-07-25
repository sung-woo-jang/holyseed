import assert from 'node:assert/strict'
import { test } from 'node:test'
import { activeSession } from '../src/session.ts'
import type { UsMarketCalendar } from '../src/session.ts'

const calendar: UsMarketCalendar = {
  previousBusinessDay: {
    date: '2026-07-14',
    dayMarket: null,
    preMarket: { startTime: '2026-07-14T18:00:00+09:00', endTime: '2026-07-14T22:30:00+09:00' },
    regularMarket: { startTime: '2026-07-14T22:30:00+09:00', endTime: '2026-07-15T05:00:00+09:00' },
    afterMarket: { startTime: '2026-07-15T05:00:00+09:00', endTime: '2026-07-15T09:00:00+09:00' },
  },
  today: {
    date: '2026-07-15',
    dayMarket: null,
    preMarket: { startTime: '2026-07-15T18:00:00+09:00', endTime: '2026-07-15T22:30:00+09:00' },
    regularMarket: { startTime: '2026-07-15T22:30:00+09:00', endTime: '2026-07-16T05:00:00+09:00' },
    afterMarket: { startTime: '2026-07-16T05:00:00+09:00', endTime: '2026-07-16T09:00:00+09:00' },
  },
  nextBusinessDay: {
    date: '2026-07-16',
    dayMarket: null,
    preMarket: null,
    regularMarket: null,
    afterMarket: null,
  },
}

test('정규장 시간대 (전일 세션, KST 자정 넘어감) — REGULAR', () => {
  assert.equal(activeSession(calendar, new Date('2026-07-15T04:30:00+09:00')), 'REGULAR')
})

test('애프터마켓 시간대 (전일 세션) — AFTER', () => {
  assert.equal(activeSession(calendar, new Date('2026-07-15T06:00:00+09:00')), 'AFTER')
})

test('프리마켓 시간대 (당일 세션) — PRE', () => {
  assert.equal(activeSession(calendar, new Date('2026-07-15T19:00:00+09:00')), 'PRE')
})

test('아무 세션도 아님 — null', () => {
  assert.equal(activeSession(calendar, new Date('2026-07-15T12:00:00+09:00')), null)
})
