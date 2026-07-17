/**
 * 계단식 예약 매수/매도표 (docs/labs/TQQQ_VR.md §4)
 * 1주씩 순차 체결 가정, 매 단계 트리거가 재계산.
 * 매수 트리거가 = 최소밴드 ÷ (매수 직전 보유수량)
 * 매도 트리거가 = 최대밴드 ÷ (매도 직전 보유수량)
 */

export interface LadderRow {
  /** 체결 후 보유수량 */
  qtyAfter: number
  /** 트리거가 */
  triggerPrice: number
  /** 누적 반영 후 Pool */
  poolAfter: number
  /** 매수 시: 사용가능 Pool(75%) 초과 여부 */
  exceedsLimit: boolean
}

const round2 = (n: number) => Math.round(n * 100) / 100

export function buildBuyLadder(params: {
  quantity: number
  minBand: number
  pool: number
  usablePool: number
  steps?: number
}): LadderRow[] {
  const { quantity, minBand, pool, usablePool, steps = 15 } = params
  const rows: LadderRow[] = []
  let poolLeft = pool
  let used = 0

  for (let i = 1; i <= steps; i++) {
    const prevQty = quantity + i - 1
    if (prevQty <= 0) break
    const trigger = round2(minBand / prevQty)
    poolLeft = round2(poolLeft - trigger)
    used = round2(used + trigger)
    rows.push({
      qtyAfter: prevQty + 1,
      triggerPrice: trigger,
      poolAfter: poolLeft,
      exceedsLimit: used > usablePool,
    })
  }
  return rows
}

export function buildSellLadder(params: { quantity: number; maxBand: number; pool: number; steps?: number }): LadderRow[] {
  const { quantity, maxBand, pool, steps = 15 } = params
  const rows: LadderRow[] = []
  let poolAfter = pool

  for (let i = 1; i <= Math.min(steps, quantity); i++) {
    const prevQty = quantity - i + 1
    const trigger = round2(maxBand / prevQty)
    poolAfter = round2(poolAfter + trigger)
    rows.push({
      qtyAfter: prevQty - 1,
      triggerPrice: trigger,
      poolAfter,
      exceedsLimit: false,
    })
  }
  return rows
}
