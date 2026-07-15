import assert from 'node:assert/strict'
import { test } from 'node:test'
import { computeIndicators, decide, applyFill } from '../src/engine.ts'
import type { ImuState } from '../src/engine.ts'

// 노션 7/13 확정 상태 그대로
const current: ImuState = {
  cycle: 1,
  T: 15,
  quantity: 3.570558,
  avgPrice: 211.44,
  cash: 1245.06,
  principal: 2000,
}

test('지표 계산 — 노션 기록과 일치', () => {
  const ind = computeIndicators(current)
  assert.equal(ind.starPct, 0.05) // (20-15)%
  assert.equal(ind.starPrice, 222.01) // 노션 별지점과 일치
  assert.equal(ind.oneBuyAmount, 49.8) // 1245.06/25
  assert.equal(ind.fullSellPrice, 253.73) // 211.44*1.2
})

test('전반전: P < 평단 → 전액 매수 T+1', () => {
  const d = decide(current, 188.08)
  assert.deepEqual(d, { action: 'BUY', amountUsd: 49.8, kind: '전액', tAfter: 16 })
})

test('전반전: 평단 ≤ P < 별지점 → 절반 매수 T+0.5', () => {
  const d = decide(current, 215.0)
  assert.deepEqual(d, { action: 'BUY', amountUsd: 24.9, kind: '절반', tAfter: 15.5 })
})

test('전반전: P = 평단 정확히 → 절반 (LOC 미체결 경계)', () => {
  const d = decide(current, 211.44)
  assert.equal(d.action, 'BUY')
  assert.equal((d as { kind: string }).kind, '절반')
})

test('P ≥ 별지점 → 쿼터매도 T×0.75', () => {
  const d = decide(current, 222.01)
  assert.deepEqual(d, { action: 'SELL', quantity: 0.89264, kind: '쿼터매도', tAfter: 11.25 })
})

test('P ≥ 평단×1.20 → 전량매도', () => {
  const d = decide(current, 253.73)
  assert.deepEqual(d, { action: 'SELL', quantity: 3.570558, kind: '전량매도', tAfter: 0 })
})

test('후반전 (T=25): P < 별지점 → 전액 매수', () => {
  const s: ImuState = { ...current, T: 25, cash: 700 }
  // 별% = -5% → 별지점 = 200.87
  const ind = computeIndicators(s)
  assert.equal(ind.starPrice, 200.87)
  const d = decide(s, 195.0)
  assert.deepEqual(d, { action: 'BUY', amountUsd: 46.67, kind: '전액', tAfter: 26 })
})

test('후반전: 평단 ≤ P < 별지점도 전액 (절반 없음)', () => {
  // T=21이면 별% = -1% → 별지점 209.33 < 평단. P가 별지점 위면 매도.
  // 별지점이 평단보다 낮아지는 구간: P < 별지점일 때만 매수
  const s: ImuState = { ...current, T: 21, cash: 900 }
  const ind = computeIndicators(s)
  assert.equal(ind.starPrice, 209.33)
  const d = decide(s, 205.0)
  assert.equal(d.action, 'BUY')
  assert.equal((d as { kind: string }).kind, '전액')
})

test('T=0 → 사이클 시작 매수', () => {
  const s: ImuState = { cycle: 2, T: 0, quantity: 0, avgPrice: 0, cash: 2000, principal: 2000 }
  const d = decide(s, 190.0)
  assert.deepEqual(d, { action: 'BUY', amountUsd: 50, kind: '사이클시작', tAfter: 1 })
})

test('T > 39 → 리버스모드 대상, 자동화 중단', () => {
  const s: ImuState = { ...current, T: 39.5 }
  const d = decide(s, 100.0)
  assert.equal(d.action, 'NONE')
})

test('잔금 부족 → 매수 스킵', () => {
  const s: ImuState = { ...current, cash: 10 }
  const d = decide(s, 188.0)
  assert.equal(d.action, 'NONE')
})

test('applyFill 매수: 평단·잔금·T 갱신', () => {
  const d = decide(current, 188.08)
  assert.equal(d.action, 'BUY')
  const filled = applyFill(current, d, { quantity: 0.264781, price: 188.08, amount: 49.8 })
  assert.equal(filled.T, 16)
  assert.equal(filled.quantity, 3.835339)
  assert.equal(filled.cash, 1195.26)
  // 평단: (211.44*3.570558 + 188.08*0.264781) / 3.835339 ≈ 209.83
  assert.ok(Math.abs(filled.avgPrice - 209.8272) < 0.01)
})

test('applyFill 쿼터매도: 평단 유지, T×0.75', () => {
  const d = decide(current, 222.01)
  assert.equal(d.action, 'SELL')
  const filled = applyFill(current, d, { quantity: 0.89264, price: 222.01, amount: 198.17 })
  assert.equal(filled.T, 11.25)
  assert.equal(filled.avgPrice, 211.44) // 매도 시 평단 불변
  assert.equal(filled.quantity, 2.677918)
  assert.equal(filled.cash, 1443.23)
})

test('applyFill 전량매도: 사이클 종료 → T=0, 수량 0', () => {
  const d = decide(current, 260.0)
  assert.equal(d.action, 'SELL')
  const filled = applyFill(current, d, { quantity: 3.570558, price: 260.0, amount: 928.35 })
  assert.equal(filled.T, 0)
  assert.equal(filled.quantity, 0)
})
