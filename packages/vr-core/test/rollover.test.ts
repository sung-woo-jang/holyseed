import assert from 'node:assert/strict'
import { test } from 'node:test'
import { computeV2, nextMonday, fridayAfterTwoWeeks } from '../src/rollover.ts'

test('V2 = V1 + Pool/G + 적립금', () => {
  const v2 = computeV2(1322.96, 3941.74, 10, 200)
  assert.equal(v2, 1917.13)
})

test('다음 월요일 계산', () => {
  assert.equal(nextMonday('2026-07-17'), '2026-07-20') // 금요일 -> 다음주 월요일
})

test('2주차 금요일 계산', () => {
  assert.equal(fridayAfterTwoWeeks('2026-07-06'), '2026-07-17') // 월요일 시작 -> 2주 후 금요일
})
