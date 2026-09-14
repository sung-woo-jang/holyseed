import assert from 'node:assert/strict'
import { test } from 'node:test'
import { computeIndicators, decide, applyFill } from '../src/engine.ts'
import type { ImuState } from '../src/engine.ts'

test('지표 계산 — 20분할 기준 (별% 계수 2)', () => {
  const s: ImuState = { cycle: 1, T: 5, quantity: 8, avgPrice: 100, cash: 1500, principal: 2000 }
  const ind = computeIndicators(s)
  assert.equal(ind.starPct, 0.1)
  assert.equal(ind.starPrice, 110)
  assert.equal(ind.fullSellPrice, 120)
  assert.equal(ind.oneBuyAmount, 100)
})

test('전반전(T<10): P < 평단 → 전액 매수 T+1', () => {
  const s: ImuState = { cycle: 1, T: 5, quantity: 8, avgPrice: 100, cash: 1500, principal: 2000 }
  const d = decide(s, 90)
  assert.deepEqual(d, { action: 'BUY', amountUsd: 100, kind: '전액', tAfter: 6 })
})

test('전반전: 평단 ≤ P < 별지점 → 절반 매수 T+0.5', () => {
  const s: ImuState = { cycle: 1, T: 5, quantity: 8, avgPrice: 100, cash: 1500, principal: 2000 }
  const d = decide(s, 105)
  assert.deepEqual(d, { action: 'BUY', amountUsd: 50, kind: '절반', tAfter: 5.5 })
})

test('전반전: P = 평단 정확히 → 절반 (LOC 미체결 경계)', () => {
  const s: ImuState = { cycle: 1, T: 5, quantity: 8, avgPrice: 100, cash: 1500, principal: 2000 }
  const d = decide(s, 100)
  assert.deepEqual(d, { action: 'BUY', amountUsd: 50, kind: '절반', tAfter: 5.5 })
})

test('P ≥ 별지점 → 쿼터매도 T×0.75', () => {
  const s: ImuState = { cycle: 1, T: 5, quantity: 8, avgPrice: 100, cash: 1500, principal: 2000 }
  const d = decide(s, 110)
  assert.deepEqual(d, { action: 'SELL', quantity: 2, kind: '쿼터매도', tAfter: 3.75 })
})

test('P ≥ 평단×1.20 → 전량매도', () => {
  const s: ImuState = { cycle: 1, T: 5, quantity: 8, avgPrice: 100, cash: 1500, principal: 2000 }
  const d = decide(s, 120)
  assert.deepEqual(d, { action: 'SELL', quantity: 8, kind: '전량매도', tAfter: 0 })
})

test('후반전(T>=10): 별%가 마이너스로 전환, P < 별지점 → 전액 매수', () => {
  const s: ImuState = { cycle: 1, T: 12, quantity: 8, avgPrice: 100, cash: 800, principal: 2000 }
  const ind = computeIndicators(s)
  assert.equal(ind.starPct, -0.04)
  assert.equal(ind.starPrice, 96)
  const d = decide(s, 90)
  assert.deepEqual(d, { action: 'BUY', amountUsd: 100, kind: '전액', tAfter: 13 })
})

test('후반전: 평단보다도 별지점이 낮아짐 (T=11)', () => {
  const s: ImuState = { cycle: 1, T: 11, quantity: 8, avgPrice: 100, cash: 900, principal: 2000 }
  const ind = computeIndicators(s)
  assert.ok(ind.starPrice < s.avgPrice)
  assert.equal(ind.starPrice, 98)
})

test('T=0 → 사이클 시작 매수', () => {
  const s: ImuState = { cycle: 1, T: 0, quantity: 0, avgPrice: 0, cash: 2000, principal: 2000 }
  const d = decide(s, 0)
  assert.deepEqual(d, { action: 'BUY', amountUsd: 100, kind: '사이클시작', tAfter: 1 })
})

test('T > 19(=SPLITS-1) → 리버스모드 대상, 자동화 중단', () => {
  const s: ImuState = { cycle: 1, T: 19.5, quantity: 5, avgPrice: 100, cash: 100, principal: 2000 }
  const d = decide(s, 90)
  assert.equal(d.action, 'NONE')
  assert.match((d as { reason: string }).reason, /리버스모드/)
})

test('잔금 부족 → 매수 스킵', () => {
  const s: ImuState = { cycle: 1, T: 5, quantity: 8, avgPrice: 100, cash: 10, principal: 2000 }
  const d = decide(s, 90)
  assert.equal(d.action, 'NONE')
})

test('applyFill 매수: 평단·잔금·T 갱신', () => {
  const s: ImuState = { cycle: 1, T: 5, quantity: 8, avgPrice: 100, cash: 1500, principal: 2000 }
  const d = decide(s, 90) as { action: 'BUY'; amountUsd: number; kind: '전액'; tAfter: number }
  const next = applyFill(s, d, { quantity: 1, price: 90, amount: 90 })
  assert.equal(next.quantity, 9)
  assert.equal(next.avgPrice, round4((100 * 8 + 90 * 1) / 9))
  assert.equal(next.cash, 1410)
  assert.equal(next.T, 6)
})

test('applyFill 쿼터매도: 평단 유지, T×0.75', () => {
  const s: ImuState = { cycle: 1, T: 5, quantity: 8, avgPrice: 100, cash: 1500, principal: 2000 }
  const d = decide(s, 110) as { action: 'SELL'; quantity: number; kind: '쿼터매도'; tAfter: number }
  const next = applyFill(s, d, { quantity: 2, price: 110, amount: 220 })
  assert.equal(next.avgPrice, 100)
  assert.equal(next.quantity, 6)
  assert.equal(next.cash, 1720)
  assert.equal(next.T, 3.75)
})

test('applyFill 전량매도: 사이클 종료 → T=0, 수량 0', () => {
  const s: ImuState = { cycle: 1, T: 5, quantity: 8, avgPrice: 100, cash: 1500, principal: 2000 }
  const d = decide(s, 120) as { action: 'SELL'; quantity: number; kind: '전량매도'; tAfter: number }
  const next = applyFill(s, d, { quantity: 8, price: 120, amount: 960 })
  assert.equal(next.quantity, 0)
  assert.equal(next.T, 0)
  assert.equal(next.cash, 2460)
})

function round4(n: number): number {
  return Math.round(n * 1e4) / 1e4
}
