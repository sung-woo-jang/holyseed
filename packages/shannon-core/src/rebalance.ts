/**
 * 섀넌의 도깨비(Shannon's Demon) — 주식:현금을 고정 목표 비율로 유지하다가,
 * 주식 비중이 목표에서 ±thresholdPct(%p) 벗어나면 그날 종가로 목표 비율까지 리밸런싱.
 * 거래(최초 매수 + 매 리밸런싱)마다 거래대금 기준 feePct%를 수수료로 차감. 세금/슬리피지는 미반영.
 */

export interface PricePoint {
  date: string
  close: number
}

export interface DayResult {
  date: string
  close: number
  totalValue: number
  stockValue: number
  cashValue: number
  stockPct: number
  rebalanced: boolean
  feePaid: number
}

export interface ShannonOptions {
  /** 목표 주식 비중 (0~100) */
  targetStockPct: number
  /** 리밸런싱 임계값 (%p) — 주식비중이 목표 ± 이 값을 벗어나면 리밸런싱 */
  thresholdPct: number
  initialCapital: number
  /** 거래대금 대비 수수료율 (%). 기본 0 */
  feePct?: number
}

export interface ShannonSimResult {
  timeline: DayResult[]
  rebalanceCount: number
  finalValue: number
  totalReturnPct: number
  totalFeesPaid: number
}

export function simulateShannonDemon(prices: PricePoint[], opts: ShannonOptions): ShannonSimResult {
  if (prices.length === 0) {
    return { timeline: [], rebalanceCount: 0, finalValue: opts.initialCapital, totalReturnPct: 0, totalFeesPaid: 0 }
  }

  const feeFrac = (opts.feePct ?? 0) / 100
  const targetFrac = opts.targetStockPct / 100

  const initialStockValue = opts.initialCapital * targetFrac
  const initialFee = initialStockValue * feeFrac
  let shares = initialStockValue / prices[0].close
  let cash = opts.initialCapital - initialStockValue - initialFee

  const timeline: DayResult[] = []
  let rebalanceCount = 0
  let totalFeesPaid = initialFee

  prices.forEach((p, i) => {
    const stockValueBefore = shares * p.close
    const totalValueBefore = stockValueBefore + cash
    const stockPctBefore = totalValueBefore > 0 ? (stockValueBefore / totalValueBefore) * 100 : 0
    let rebalanced = false
    let feePaid = 0

    if (Math.abs(stockPctBefore - opts.targetStockPct) >= opts.thresholdPct) {
      const targetStockValue = totalValueBefore * targetFrac
      const tradeAmount = Math.abs(targetStockValue - stockValueBefore)
      feePaid = tradeAmount * feeFrac
      shares = targetStockValue / p.close
      cash = totalValueBefore - targetStockValue - feePaid
      rebalanced = true
      rebalanceCount++
      totalFeesPaid += feePaid
    }

    const totalValue = shares * p.close + cash

    timeline.push({
      date: p.date,
      close: p.close,
      totalValue,
      stockValue: shares * p.close,
      cashValue: cash,
      stockPct: rebalanced ? opts.targetStockPct : stockPctBefore,
      rebalanced,
      feePaid: i === 0 ? initialFee + feePaid : feePaid,
    })
  })

  const finalValue = timeline[timeline.length - 1].totalValue
  const totalReturnPct = ((finalValue - opts.initialCapital) / opts.initialCapital) * 100

  return { timeline, rebalanceCount, finalValue, totalReturnPct, totalFeesPaid }
}

/** 비교선: 첫날 전액 매수(수수료 1회 차감) 후 그대로 보유 */
export function computeBuyAndHold(
  prices: PricePoint[],
  initialCapital: number,
  feePct = 0
): Array<{ date: string; totalValue: number }> {
  if (prices.length === 0) return []
  const fee = initialCapital * (feePct / 100)
  const shares = (initialCapital - fee) / prices[0].close
  return prices.map((p) => ({ date: p.date, totalValue: shares * p.close }))
}
