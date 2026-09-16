import assert from 'node:assert/strict'
import { test } from 'node:test'
import { computeBuyLocLegs } from '../src/engine.ts'
import type { ImuState } from '../src/engine.ts'

test('전반전: 별지점가(-0.01) + 평단가 2-leg', () => {
  const s: ImuState = { cycle: 1, T: 5, quantity: 10, avgPrice: 50, cash: 3000, principal: 4000 }
  const legs = computeBuyLocLegs(s)
  assert.deepEqual(legs, [
    { price: 54.99, quantity: 1, halfStep: true },
    { price: 50, quantity: 2, halfStep: true },
  ])
})

test('후반전: 별지점가(-0.01) 1-leg (halfStep=false)', () => {
  const s: ImuState = { cycle: 1, T: 12, quantity: 10, avgPrice: 50, cash: 3000, principal: 4000 }
  const legs = computeBuyLocLegs(s)
  assert.deepEqual(legs, [{ price: 47.99, quantity: 7, halfStep: false }])
})

test('리버스모드(T>19) → 빈 배열', () => {
  const s: ImuState = { cycle: 1, T: 19.5, quantity: 10, avgPrice: 50, cash: 100, principal: 4000 }
  assert.deepEqual(computeBuyLocLegs(s), [])
})

test('T=0(사이클시작) → 빈 배열 (기존 즉시판단 경로가 담당)', () => {
  const s: ImuState = { cycle: 1, T: 0, quantity: 0, avgPrice: 0, cash: 2000, principal: 2000 }
  assert.deepEqual(computeBuyLocLegs(s), [])
})

test('배정 금액이 1주 값보다 작아도 잔금으로 살 수 있으면 최소 1주는 산다', () => {
  const s: ImuState = { cycle: 1, T: 5, quantity: 10, avgPrice: 211.44, cash: 1245.06, principal: 2000 }
  assert.deepEqual(computeBuyLocLegs(s), [
    { price: 232.57, quantity: 1, halfStep: true },
    { price: 211.44, quantity: 1, halfStep: true },
  ])
})

test('실운용 케이스(20분할 전환 직후, 후반전 1-leg도 최소 1주 보장)', () => {
  const s: ImuState = { cycle: 1, T: 15.4688, quantity: 10.966685, avgPrice: 138.0128, cash: 389.67, principal: 2000 }
  assert.deepEqual(computeBuyLocLegs(s), [{ price: 122.91, quantity: 1, halfStep: false }])
})

test('전략 배정 잔금(s.cash)이 1주 값보다 훨씬 작아도 최소 1주는 산다 — 실제 매수가능금액은 engine.service.ts가 별도 검증', () => {
  const s: ImuState = { cycle: 1, T: 5, quantity: 10, avgPrice: 211.44, cash: 50, principal: 2000 }
  assert.deepEqual(computeBuyLocLegs(s), [
    { price: 232.57, quantity: 1, halfStep: true },
    { price: 211.44, quantity: 1, halfStep: true },
  ])
})

test('배정 금액이 $1 미만이어도 leg를 걸러내지 않고 최소 1주씩 만든다', () => {
  const s: ImuState = { cycle: 1, T: 5, quantity: 10, avgPrice: 211.44, cash: 1, principal: 2000 }
  assert.deepEqual(computeBuyLocLegs(s), [
    { price: 232.57, quantity: 1, halfStep: true },
    { price: 211.44, quantity: 1, halfStep: true },
  ])
})

test('가상 잔금(s.cash)이 마이너스라 배정 금액이 음수여도 leg를 걸러내지 않고 최소 1주씩 만든다', () => {
  const s: ImuState = { cycle: 1, T: 5, quantity: 10, avgPrice: 211.44, cash: -57.42, principal: 2000 }
  assert.deepEqual(computeBuyLocLegs(s), [
    { price: 232.57, quantity: 1, halfStep: true },
    { price: 211.44, quantity: 1, halfStep: true },
  ])
})
