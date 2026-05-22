import type { ApplyFillsResult, ExecType, FillInput, InfiniteState } from '../common/types'
import { recalcAvg } from '../common/formulas'
import {
  applyTValueAfterFixedSell,
  applyTValueNormal,
  applyTValueReverseBuy,
  applyTValueReverseSell,
  resolveMode,
} from './t-value'

/**
 * 체결 내역을 적용해 새로운 state를 계산한다.
 * fills 배열에서 sell_fixed + buy_* 연속이면 지정가매도 후 LOC매수 규칙 적용.
 */
export function applyFills(state: InfiniteState, fills: FillInput[]): ApplyFillsResult {
  let { quantity, cash, avgPrice, tValue } = state
  const { ticker, division, principal } = state
  const isReverse = state.mode === 'reverse'

  let prevWasFixedSell = false

  for (const fill of fills) {
    const { execType, price, qty } = fill

    if (execType === 'no_exec') continue

    if (isBuyType(execType)) {
      if (prevWasFixedSell) {
        // 지정가매도 후 LOC 매수
        const buyType = execType === 'buy_full' ? 'full' : 'half'
        tValue = applyTValueAfterFixedSell(tValue, buyType)
        prevWasFixedSell = false
      } else if (isReverse) {
        tValue = applyTValueReverseBuy(tValue, division)
      } else {
        tValue = applyTValueNormal(tValue, execType)
      }
      avgPrice = recalcAvg(avgPrice, quantity, price, qty)
      quantity += qty
      cash -= price * qty
    } else if (isSellType(execType)) {
      if (execType === 'sell_fixed' || execType === 'sell_moc') {
        prevWasFixedSell = true
        if (isReverse) {
          tValue = applyTValueReverseSell(tValue, division)
        } else {
          tValue = applyTValueNormal(tValue, execType)
        }
      } else {
        // sell_quarter
        if (isReverse) {
          tValue = applyTValueReverseSell(tValue, division)
        } else {
          tValue = applyTValueNormal(tValue, execType)
        }
        prevWasFixedSell = false
      }
      quantity -= qty
      cash += price * qty
    }
  }

  const newMode = resolveMode(tValue, division, quantity)

  const newState: InfiniteState = {
    ...state,
    quantity,
    cash,
    avgPrice: quantity === 0 ? 0 : avgPrice,
    tValue,
    mode: newMode,
  }

  const cycleEnded = quantity === 0

  if (cycleEnded) {
    const profit = cash - principal
    const profitPct = (profit / principal) * 100
    return { newState, cycleEnded: true, profit, profitPct }
  }

  return { newState, cycleEnded: false }
}

/** 복리: 잔금을 새 원금으로 → 새 사이클 초기 state */
export function startNextCycleCompound(state: InfiniteState): InfiniteState {
  return {
    ...state,
    cycleNo: state.cycleNo + 1,
    principal: state.cash,
    cash: state.cash,
    quantity: 0,
    avgPrice: 0,
    tValue: 0,
    mode: 'cycle_start',
    recentCloses: [],
  }
}

/** 단리: 원금 그대로 → 새 사이클 초기 state */
export function startNextCycleSimple(state: InfiniteState): InfiniteState {
  return {
    ...state,
    cycleNo: state.cycleNo + 1,
    cash: state.principal,
    quantity: 0,
    avgPrice: 0,
    tValue: 0,
    mode: 'cycle_start',
    recentCloses: [],
  }
}

function isBuyType(t: ExecType): boolean {
  return t === 'buy_full' || t === 'buy_half_star' || t === 'buy_half_avg'
}

function isSellType(t: ExecType): boolean {
  return t === 'sell_quarter' || t === 'sell_fixed' || t === 'sell_moc'
}
