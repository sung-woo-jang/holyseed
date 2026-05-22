/**
 * 무한매수법 V4.0 핵심 공식 모음 (순수 함수, DB 접근 X)
 */

/** 매수 체결 시 평단가 재계산. 매도 시에는 호출하지 않음. */
export function recalcAvg(prevAvg: number, prevQty: number, fillPrice: number, fillQty: number): number {
  if (prevQty + fillQty === 0) return 0
  return (prevAvg * prevQty + fillPrice * fillQty) / (prevQty + fillQty)
}

/**
 * 별% 공식.
 * TQQQ 40분할: (15 - 0.75 * T) %   → 15 - (30/40)*T
 * TQQQ 20분할: (15 - 1.5 * T) %    → 15 - (30/20)*T
 * SOXL 40분할: (20 - T) %           → 20 - (40/40)*T
 * SOXL 20분할: (20 - 2 * T) %      → 20 - (40/20)*T
 */
export function computeStarPct(ticker: string, division: number, t: number): number {
  if (ticker === 'TQQQ') {
    return 15 - (30 / division) * t
  }
  // SOXL
  return 20 - (40 / division) * t
}

/** 별지점 = 평단 × (1 + 별% / 100) */
export function computeStarPrice(avgPrice: number, starPct: number): number {
  return avgPrice * (1 + starPct / 100)
}

/** LOC 매수가 = 별지점 - 0.01 */
export function computeLocBuy(starPrice: number): number {
  return Math.max(0.01, starPrice - 0.01)
}

/** LOC 매도가 = 별지점 */
export function computeLocSell(starPrice: number): number {
  return starPrice
}

/** 1회 매수액 = 잔금 / (분할수 - T) */
export function computeOnceAmount(cash: number, division: number, t: number): number {
  const remaining = division - t
  if (remaining <= 0) return 0
  return cash / remaining
}

/** 쿼터매도 수량 = floor(보유수량 / 4) */
export function computeQuarterSellQty(qty: number): number {
  return Math.floor(qty / 4)
}

/** 익절 지정가: TQQQ = 평단 × 1.15, SOXL = 평단 × 1.20 */
export function computeFixedSellPrice(ticker: string, avgPrice: number): number {
  const multiplier = ticker === 'TQQQ' ? 1.15 : 1.20
  return avgPrice * multiplier
}

/** 분할 LOC 사다리 가격: n번째 = 기준가 × (1 - 0.07)^n */
export function computeLadderPrice(basePrice: number, step: number): number {
  return basePrice * Math.pow(1 - 0.07, step)
}

/** 큰수매수 가격: 종가 × 1.10 (사이클 시작 기본) */
export function computeLargeNumberPrice(lastClose: number, pct = 0.10): number {
  return lastClose * (1 + pct)
}
