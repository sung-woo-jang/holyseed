import {
  computeLadderPrice,
  computeLargeNumberPrice,
  computeOnceAmount,
} from '../../common/formulas'
import type { DailyPlanResult, InfiniteState, PlanRow } from '../../common/types'

const MAX_LADDER_ROWS = 8

/**
 * 사이클 시작 모드 (T=0, 보유수량=0)
 *
 * 매수점:
 *   ① 큰수 LOC = 전날종가 × 1.10, 수량 = floor(1회매수액 / 큰수LOC)
 *   ② 이하 분할 LOC: 큰수 가격 × (1-0.07)^n, 1주씩
 *
 * 매도점: 없음
 */
export function computeCycleStartPlan(state: InfiniteState): DailyPlanResult {
  const { cash, division, lastClose } = state
  const onceAmount = computeOnceAmount(cash, division, 0)
  const largePrice = computeLargeNumberPrice(lastClose)
  const largeQty = Math.max(1, Math.floor(onceAmount / largePrice))

  const buyRows: PlanRow[] = [
    {
      label: '큰수 LOC',
      price: largePrice,
      qty: largeQty,
      side: 'buy',
      execType: 'buy_full',
    },
  ]

  for (let i = 1; i <= MAX_LADDER_ROWS; i++) {
    const price = computeLadderPrice(largePrice, i)
    if (price < 0.01) break
    buyRows.push({
      label: `분할${i + 1} LOC`,
      price: Math.round(price * 100) / 100,
      qty: 1,
      side: 'buy',
      execType: 'buy_full',
    })
  }

  return {
    buyRows,
    sellRows: [],
    metrics: {
      starPct: 0,
      starPrice: 0,
      locBuyPrice: 0,
      locSellPrice: 0,
      onceAmount,
      quarterSellQty: 0,
      fixedSellPrice: 0,
    },
    largeNumberBuy: null,
  }
}
