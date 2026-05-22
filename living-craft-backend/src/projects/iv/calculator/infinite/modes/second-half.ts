import {
  computeFixedSellPrice,
  computeLadderPrice,
  computeLocBuy,
  computeLocSell,
  computeOnceAmount,
  computeQuarterSellQty,
  computeStarPct,
  computeStarPrice,
} from '../../common/formulas'
import type { DailyPlanResult, InfiniteState, PlanRow } from '../../common/types'

const MAX_LADDER_ROWS = 6

/**
 * 일반 모드 — 후반전 (division/2 ≤ T < division-1)
 *
 * 매수: 1회매수액 전체를 별LOC (별% < 0 → 별지점이 평단 아래)
 * 매도: 전반전과 동일
 */
export function computeSecondHalfPlan(state: InfiniteState): DailyPlanResult {
  const { ticker, division, cash, avgPrice, tValue: t, quantity } = state

  const pct = computeStarPct(ticker, division, t)
  const sp = computeStarPrice(avgPrice, pct)
  const locBuy = computeLocBuy(sp)
  const locSell = computeLocSell(sp)
  const once = computeOnceAmount(cash, division, t)

  const starQty = Math.max(1, Math.floor(once / locBuy))

  const buyRows: PlanRow[] = [
    { label: '★ LOC', price: locBuy, qty: starQty, side: 'buy', execType: 'buy_full' },
  ]

  for (let i = 1; i <= MAX_LADDER_ROWS; i++) {
    const price = Math.round(computeLadderPrice(locBuy, i) * 100) / 100
    if (price < 0.01) break
    buyRows.push({ label: `분할${i + 1} LOC`, price, qty: 1, side: 'buy', execType: 'buy_full' })
  }

  const quarterQty = computeQuarterSellQty(quantity)
  const fixedPrice = computeFixedSellPrice(ticker, avgPrice)
  const fixedQty = quantity - quarterQty

  const sellRows: PlanRow[] = [
    { label: `★% LOC (쿼터)`, price: locSell, qty: quarterQty, side: 'sell', execType: 'sell_quarter' },
    { label: `${ticker === 'TQQQ' ? '15' : '20'}% 지정가`, price: fixedPrice, qty: Math.max(0, fixedQty), side: 'sell', execType: 'sell_fixed' },
  ]

  return {
    buyRows,
    sellRows,
    metrics: {
      starPct: pct,
      starPrice: sp,
      locBuyPrice: locBuy,
      locSellPrice: locSell,
      onceAmount: once,
      quarterSellQty: quarterQty,
      fixedSellPrice: fixedPrice,
    },
    largeNumberBuy: null,
  }
}
