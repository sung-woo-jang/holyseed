import assert from 'node:assert/strict'
import { test } from 'node:test'
import { decide } from '../src/decision.ts'

const settings = { bandPct: 15, poolLimitPct: 75 }

test('평가금이 최소밴드 미만 — 매수, 밴드 경계 근처까지 최소 정수 수량', () => {
  // V=2432.71 -> minBand=2067.80, maxBand=2797.62 (round2)
  const d = decide({ quantity: 20, vValue: 2432.71, pool: 3810.93 }, 90, settings)
  assert.equal(d.action, 'BUY')
  if (d.action === 'BUY') {
    // 20주*90=1800 < 2067.80 -> ceil(2067.80/90)=23, qty=3
    assert.equal(d.quantity, 3)
    assert.equal(d.clamped, false)
  }
})

test('평가금이 최대밴드 초과 — 매도, 밴드 경계 근처까지 최소 정수 수량', () => {
  const d = decide({ quantity: 30, vValue: 2432.71, pool: 3810.93 }, 100, settings)
  // 30*100=3000 > 2797.62 -> floor(2797.62/100)=27, qty=3
  assert.equal(d.action, 'SELL')
  if (d.action === 'SELL') assert.equal(d.quantity, 3)
})

test('밴드 이내 — 홀딩', () => {
  const d = decide({ quantity: 26, vValue: 2432.71, pool: 3810.93 }, 90, settings)
  assert.equal(d.action, 'NONE')
})

test('Pool 75% 한도 초과 시 최대 수량으로 클램프', () => {
  // pool=100 -> usablePool=75, price=10 -> maxQtyByPool=7
  const d = decide({ quantity: 0, vValue: 1000, pool: 100 }, 10, settings)
  assert.equal(d.action, 'BUY')
  if (d.action === 'BUY') {
    assert.equal(d.quantity, 7)
    assert.equal(d.clamped, true)
  }
})

test('Pool 한도 부족으로 1주도 못 사면 스킵', () => {
  const d = decide({ quantity: 0, vValue: 1000, pool: 1 }, 10, settings)
  assert.equal(d.action, 'NONE')
})
