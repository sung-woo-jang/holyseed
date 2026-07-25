/**
 * VR 매매 판단 — 순수함수 (API 클라이언트 비의존).
 *
 * 판단 기준: 평가금(보유수량 × 현재가) < 최소밴드 → 매수 / > 최대밴드 → 매도 / 그 외 홀딩.
 * 수량은 "공식(밴드 경계)에서 최대한 벗어나지 않는" 최소 정수 수량을 한 번에 계산한다
 * (기존 "1주씩 순차 사다리"는 참고용 시뮬레이션일 뿐, 실제 주문은 이 방식으로 하지 않는다).
 *
 * Pool 사용한도(75%) 정책: 매수 시점의 Pool 스냅샷 기준 `pool × poolLimitPct/100`을
 * "이번 매수에 쓸 수 있는 최대 금액"으로 보고, 그걸 넘으면 넘지 않는 최대 정수 수량으로
 * 클램프한다(전량 스킵 아님). 클램프해도 0주면 스킵.
 */
import { computeBand } from './band.ts'

export interface VrDecisionState {
  quantity: number
  vValue: number
  pool: number
}

export interface VrDecisionSettings {
  bandPct: number
  poolLimitPct: number
}

export type VrDecision =
  | { action: 'BUY'; quantity: number; estAmount: number; clamped: boolean }
  | { action: 'SELL'; quantity: number; estAmount: number }
  | { action: 'NONE'; reason: string }

const round2 = (n: number) => Math.round(n * 100) / 100

export function decide(state: VrDecisionState, price: number, settings: VrDecisionSettings): VrDecision {
  const { minBand, maxBand } = computeBand(state.vValue, settings.bandPct)
  const evalAmount = state.quantity * price

  if (evalAmount < minBand) {
    const rawQty = Math.ceil(minBand / price) - state.quantity
    if (rawQty < 1) return { action: 'NONE', reason: '밴드 이내' }

    const usablePool = round2((state.pool * settings.poolLimitPct) / 100)
    const maxQtyByPool = Math.floor(usablePool / price)
    if (maxQtyByPool < 1) {
      return { action: 'NONE', reason: `Pool 사용한도(${usablePool}) 부족으로 매수 불가` }
    }

    const qty = Math.min(rawQty, maxQtyByPool)
    return { action: 'BUY', quantity: qty, estAmount: round2(qty * price), clamped: qty < rawQty }
  }

  if (evalAmount > maxBand) {
    const qty = state.quantity - Math.floor(maxBand / price)
    if (qty < 1) return { action: 'NONE', reason: '밴드 이내' }
    return { action: 'SELL', quantity: qty, estAmount: round2(qty * price) }
  }

  return { action: 'NONE', reason: '밴드 이내' }
}
