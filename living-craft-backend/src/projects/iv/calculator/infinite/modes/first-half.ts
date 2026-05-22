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

// 실제로 computeHalfAmountQty는 formulas.ts에 없으므로 직접 inline으로 처리
const MAX_LADDER_ROWS = 6

/**
 * 일반 모드 — 전반전 (0 < T < division/2)
 *
 * 매수:
 *   ① ★LOC: 1회매수액의 절반 / LOC 매수가, floor → 0주면 1주
 *   ② 평단LOC: 1회매수액의 절반 / 평단가, floor → 0주면 1주
 *   ③+ 분할 LOC: 아래로 7% 할인씩, 1주씩
 *
 * 매도:
 *   ① ★% LOC (쿼터매도): floor(보유/4)
 *   ② 지정가: 평단×1.15(TQQQ) 나머지 수량
 */
export function computeFirstHalfPlan(state: InfiniteState): DailyPlanResult {
  const { ticker, division, cash, avgPrice, tValue: t, quantity } = state

  const pct = computeStarPct(ticker, division, t)
  const sp = computeStarPrice(avgPrice, pct)
  const locBuy = computeLocBuy(sp)
  const locSell = computeLocSell(sp)
  const once = computeOnceAmount(cash, division, t)
  const half = once / 2

  const starQty = Math.max(1, Math.floor(half / locBuy))
  const avgQty = Math.max(1, Math.floor(half / avgPrice))

  const buyRows: PlanRow[] = [
    { label: '★ LOC', price: locBuy, qty: starQty, side: 'buy', execType: 'buy_half_star' },
    { label: '평단 LOC', price: avgPrice, qty: avgQty, side: 'buy', execType: 'buy_half_avg' },
  ]

  for (let i = 1; i <= MAX_LADDER_ROWS; i++) {
    const price = Math.round(computeLadderPrice(locBuy, i) * 100) / 100
    if (price < 0.01) break
    buyRows.push({ label: `분할${i + 2} LOC`, price, qty: 1, side: 'buy', execType: 'buy_half_star' })
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
