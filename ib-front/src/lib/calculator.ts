/** 프론트엔드 체결 미리보기용 계산기 (백엔드 calculator 미러) */

export interface PreviewState {
  quantity: number
  cash: number
  avgPrice: number
  tValue: number
  mode: string
}

export interface FillPreview {
  execType: string
  price: number
  qty: number
}

function recalcAvg(prevAvg: number, prevQty: number, price: number, qty: number): number {
  if (prevQty + qty === 0) return 0
  return (prevAvg * prevQty + price * qty) / (prevQty + qty)
}

function applyTNormal(t: number, execType: string): number {
  switch (execType) {
    case 'buy_full':
      return t + 1
    case 'buy_half_star':
    case 'buy_half_avg':
      return t + 0.5
    case 'sell_quarter':
      return t * 0.75
    default:
      return t
  }
}

function applyTAfterFixedSell(t: number, buyType: 'full' | 'half'): number {
  return buyType === 'full' ? t * 0.25 + 1 : t * 0.25 + 0.5
}

function applyTReverseSell(t: number, division: number): number {
  return division === 40 ? t * 0.95 : t * 0.9
}

function applyTReverseBuy(t: number, division: number): number {
  return t + (division - t) * 0.25
}

function resolveMode(t: number, division: number, quantity: number): string {
  if (quantity === 0 || t <= 0) return 'cycle_start'
  if (t >= division - 1) return 'reverse'
  if (t >= division / 2) return 'second_half'
  return 'first_half'
}

export function computePreview(
  state: { quantity: number; cash: number; avgPrice: number; tValue: number; mode: string; division: number },
  fills: FillPreview[]
): PreviewState {
  let { quantity, cash, avgPrice, tValue } = state
  const isReverse = state.mode === 'reverse'
  const { division } = state
  let prevWasFixedSell = false

  for (const fill of fills) {
    if (fill.execType === 'no_exec') continue

    const isBuy = ['buy_full', 'buy_half_star', 'buy_half_avg'].includes(fill.execType)
    const isSell = ['sell_quarter', 'sell_fixed', 'sell_moc'].includes(fill.execType)

    if (isBuy) {
      if (prevWasFixedSell) {
        tValue = applyTAfterFixedSell(tValue, fill.execType === 'buy_full' ? 'full' : 'half')
        prevWasFixedSell = false
      } else if (isReverse) {
        tValue = applyTReverseBuy(tValue, division)
      } else {
        tValue = applyTNormal(tValue, fill.execType)
      }
      avgPrice = recalcAvg(avgPrice, quantity, fill.price, fill.qty)
      quantity += fill.qty
      cash -= fill.price * fill.qty
    } else if (isSell) {
      if (fill.execType === 'sell_fixed') {
        prevWasFixedSell = true
        if (isReverse) tValue = applyTReverseSell(tValue, division)
        else tValue = applyTNormal(tValue, fill.execType)
      } else if (fill.execType === 'sell_moc') {
        if (isReverse) tValue = applyTReverseSell(tValue, division)
        else tValue = applyTNormal(tValue, fill.execType)
      } else {
        // sell_quarter
        if (isReverse) tValue = applyTReverseSell(tValue, division)
        else tValue = applyTNormal(tValue, fill.execType)
        prevWasFixedSell = false
      }
      quantity -= fill.qty
      cash += fill.price * fill.qty
    }
  }

  return {
    quantity,
    cash,
    avgPrice: quantity === 0 ? 0 : avgPrice,
    tValue,
    mode: resolveMode(tValue, division, quantity),
  }
}
