import assert from 'node:assert/strict'
import { test } from 'node:test'
import { computeSellLocLegs } from '../src/engine.ts'
import type { ImuState } from '../src/engine.ts'

test('실운용 케이스 — 1/4 별지점가 + 3/4 평단×1.2가, 정수부만', () => {
  const s: ImuState = { cycle: 1, T: 15.4688, quantity: 10.966685, avgPrice: 138.0128, cash: 389.67, principal: 2000 }
  assert.deepEqual(computeSellLocLegs(s), [
    { price: 122.92, quantity: 2, kind: '쿼터매도' },
    { price: 165.62, quantity: 8, kind: '전량매도' },
  ])
})

test('두 leg 합이 정확히 보유수량(정수부)과 같음 — 오버셀 없음', () => {
  const s: ImuState = { cycle: 1, T: 5, quantity: 8, avgPrice: 50, cash: 100, principal: 2000 }
  const legs = computeSellLocLegs(s)
  const total = legs.reduce((a, l) => a + l.quantity, 0)
  assert.equal(total, 8)
})

test('리버스모드(T>19) → 빈 배열', () => {
  const s: ImuState = { cycle: 1, T: 19.5, quantity: 5, avgPrice: 50, cash: 100, principal: 2000 }
  assert.deepEqual(computeSellLocLegs(s), [])
})

test('보유수량 0 → 빈 배열', () => {
  const s: ImuState = { cycle: 1, T: 5, quantity: 0, avgPrice: 0, cash: 100, principal: 2000 }
  assert.deepEqual(computeSellLocLegs(s), [])
})

test('1/4가 0주로 내림되면 쿼터매도 leg 없이 전량매도 leg 하나로 합쳐짐', () => {
  const s: ImuState = { cycle: 1, T: 5, quantity: 3, avgPrice: 50, cash: 100, principal: 2000 }
  assert.deepEqual(computeSellLocLegs(s), [{ price: 60, quantity: 3, kind: '전량매도' }])
})
