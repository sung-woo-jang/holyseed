import { computeLocBuy, computeLocSell } from '../../common/formulas'
import type { DailyPlanResult, InfiniteState, PlanRow } from '../../common/types'

/**
 * 리버스 모드 (T > division-1)
 *
 * 별지점 = 직전 5거래일 종가의 단순평균
 *
 * 매도 (무한매도):
 *   첫날  MOC, 수량 = floor(보유 / (division/2))
 *   이후  별지점 위 LOC, 수량 = floor(직전보유 / (division/2)), 매일 재계산
 *
 * 매수 (쿼터매수):
 *   첫날 없음
 *   이후 잔금/4, 별LOC 아래에서 매수 시도
 *
 * 종료: TQQQ 종가 > 평단 × 0.85 / SOXL 종가 > 평단 × 0.80 → first_half 복귀
 */

function mean5(closes: number[]): number {
  const last5 = closes.slice(-5)
  if (last5.length === 0) return 0
  return last5.reduce((s, v) => s + v, 0) / last5.length
}

export function computeReversePlan(state: InfiniteState, isFirstDay: boolean): DailyPlanResult {
  const { ticker, division, cash, quantity, recentCloses } = state

  const sp = mean5(recentCloses)
  const locBuy = computeLocBuy(sp)
  const locSell = computeLocSell(sp)

  const sells = Math.floor(division / 2)
  const sellQty = Math.max(1, Math.floor(quantity / sells))

  const buyRows: PlanRow[] = []
  if (!isFirstDay && cash > 0) {
    const buyAmt = cash / 4
    const buyQty = Math.max(1, Math.floor(buyAmt / locBuy))
    buyRows.push({
      label: '쿼터매수 LOC',
      price: locBuy,
      qty: buyQty,
      side: 'buy',
      execType: 'buy_full',
    })
  }

  const sellRows: PlanRow[] = [
    {
      label: isFirstDay ? '무한매도 MOC (첫날)' : '무한매도 LOC',
      price: isFirstDay ? 0 : locSell,
      qty: sellQty,
      side: 'sell',
      execType: isFirstDay ? 'sell_moc' : 'sell_quarter',
    },
  ]

  return {
    buyRows,
    sellRows,
    metrics: {
      starPct: 0,
      starPrice: sp,
      locBuyPrice: locBuy,
      locSellPrice: locSell,
      onceAmount: 0,
      quarterSellQty: sellQty,
      fixedSellPrice: 0,
    },
    largeNumberBuy: null,
  }
}

/** 리버스 종료 조건 체크 */
export function checkReverseExit(ticker: string, lastClose: number, avgPrice: number): boolean {
  const threshold = ticker === 'TQQQ' ? 0.85 : 0.80
  return lastClose > avgPrice * threshold
}
