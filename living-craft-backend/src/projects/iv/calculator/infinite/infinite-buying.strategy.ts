import { computeStarPct, computeStarPrice } from '../common/formulas'
import type { ApplyFillsResult, DailyPlanResult, FillInput, InfiniteState } from '../common/types'
import { applyFills, startNextCycleCompound, startNextCycleSimple } from './cycle-end'
import { computeCycleStartPlan } from './modes/cycle-start'
import { computeFirstHalfPlan } from './modes/first-half'
import { checkReverseExit, computeReversePlan } from './modes/reverse'
import { computeSecondHalfPlan } from './modes/second-half'

const LARGE_NUMBER_THRESHOLD = 0.15

export class InfiniteBuyingStrategy {
  computeDailyPlan(state: InfiniteState, isReverseFirstDay = false): DailyPlanResult {
    let plan: DailyPlanResult

    switch (state.mode) {
      case 'cycle_start':
        plan = computeCycleStartPlan(state)
        break
      case 'first_half':
        plan = computeFirstHalfPlan(state)
        break
      case 'second_half':
        plan = computeSecondHalfPlan(state)
        break
      case 'reverse':
        plan = computeReversePlan(state, isReverseFirstDay)
        break
      default:
        plan = computeCycleStartPlan(state)
    }

    // 큰수매수 경고 (일반 모드에서 별지점이 종가 대비 15% 이상 차이)
    if (state.mode !== 'cycle_start' && state.mode !== 'reverse' && state.lastClose > 0) {
      const pct = computeStarPct(state.ticker, state.division, state.tValue)
      const sp = computeStarPrice(state.avgPrice, pct)
      const gap = Math.abs(sp - state.lastClose) / state.lastClose
      if (gap >= LARGE_NUMBER_THRESHOLD) {
        plan.largeNumberBuy = {
          suggested: Math.round(state.lastClose * 1.15 * 100) / 100,
          label: `종가 × 1.15 = $${(state.lastClose * 1.15).toFixed(2)}`,
        }
      }
    }

    // 리버스 종료 조건 체크
    if (state.mode === 'reverse' && state.lastClose > 0) {
      const shouldExit = checkReverseExit(state.ticker, state.lastClose, state.avgPrice)
      if (shouldExit) {
        // 다음 호출에서 first_half로 자동 전환됨 (resolveMode에 의해)
        // 여기서는 plan에 메타 정보만 추가
      }
    }

    return plan
  }

  applyFills(state: InfiniteState, fills: FillInput[]): ApplyFillsResult {
    return applyFills(state, fills)
  }

  startNextCycle(state: InfiniteState, mode: 'compound' | 'simple'): InfiniteState {
    return mode === 'compound'
      ? startNextCycleCompound(state)
      : startNextCycleSimple(state)
  }
}
