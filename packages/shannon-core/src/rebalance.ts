/**
 * 섀넌의 도깨비(Shannon's Demon) — 주식:현금을 고정 목표 비율로 유지하다가,
 * 주식 비중이 목표에서 ±thresholdPct(%p) 벗어나면 그날 종가로 목표 비율까지 리밸런싱.
 * 수수료/세금/슬리피지는 가정하지 않음 (순수 비교용 시뮬레이션).
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
}

export interface ShannonOptions {
  /** 목표 주식 비중 (0~100) */
  targetStockPct: number
  /** 리밸런싱 임계값 (%p) — 주식비중이 목표 ± 이 값을 벗어나면 리밸런싱 */
  thresholdPct: number
  initialCapital: number
}

export interface ShannonSimResult {
  timeline: DayResult[]
  rebalanceCount: number
  finalValue: number
  totalReturnPct: number
}

export function simulateShannonDemon(prices: PricePoint[], opts: ShannonOptions): ShannonSimResult {
  if (prices.length === 0) {
    return { timeline: [], rebalanceCount: 0, finalValue: opts.initialCapital, totalReturnPct: 0 }
  }

  const targetFrac = opts.targetStockPct / 100
  let shares = (opts.initialCapital * targetFrac) / prices[0].close
  let cash = opts.initialCapital * (1 - targetFrac)

  const timeline: DayResult[] = []
  let rebalanceCount = 0

  for (const p of prices) {
    const stockValueBefore = shares * p.close
    const totalValue = stockValueBefore + cash
    const stockPctBefore = totalValue > 0 ? (stockValueBefore / totalValue) * 100 : 0
    let rebalanced = false

    if (Math.abs(stockPctBefore - opts.targetStockPct) >= opts.thresholdPct) {
      const targetStockValue = totalValue * targetFrac
      shares = targetStockValue / p.close
      cash = totalValue - targetStockValue
      rebalanced = true
      rebalanceCount++
    }

    timeline.push({
      date: p.date,
      close: p.close,
      totalValue,
      stockValue: shares * p.close,
      cashValue: cash,
      stockPct: rebalanced ? opts.targetStockPct : stockPctBefore,
      rebalanced,
    })
  }

  const finalValue = timeline[timeline.length - 1].totalValue
  const totalReturnPct = ((finalValue - opts.initialCapital) / opts.initialCapital) * 100

  return { timeline, rebalanceCount, finalValue, totalReturnPct }
}

/** 비교선: 첫날 전액 매수 후 그대로 보유 */
export function computeBuyAndHold(
  prices: PricePoint[],
  initialCapital: number
): Array<{ date: string; totalValue: number }> {
  if (prices.length === 0) return []
  const shares = initialCapital / prices[0].close
  return prices.map((p) => ({ date: p.date, totalValue: shares * p.close }))
}
