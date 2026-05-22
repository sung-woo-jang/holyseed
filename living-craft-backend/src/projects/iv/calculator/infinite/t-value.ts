import type { Division, ExecType } from '../common/types'

/**
 * T값 갱신 매트릭스 (무한매수법 V4.0)
 *
 * 일반 모드:
 *   buy_full           T += 1
 *   buy_half_*         T += 0.5
 *   sell_quarter       T = T × 0.75
 *   sell_fixed (이후 buy_full)  T = T × 0.25 + 1
 *   sell_fixed (이후 buy_half)  T = T × 0.25 + 0.5
 *
 * 리버스 모드 (40분할):
 *   매도   T = T × 0.95
 *   매수   T = T + (40 - T) × 0.25
 *
 * 리버스 모드 (20분할):
 *   매도   T = T × 0.9
 *   매수   T = T + (20 - T) × 0.25
 */

export function applyTValueNormal(
  prevT: number,
  execType: ExecType,
  followUpBuyType?: 'full' | 'half',
): number {
  switch (execType) {
    case 'buy_full':
      return prevT + 1
    case 'buy_half_star':
    case 'buy_half_avg':
      return prevT + 0.5
    case 'sell_quarter':
      return prevT * 0.75
    case 'sell_fixed':
    case 'sell_moc':
      // 지정가/MOC 매도 후 당일 LOC 매수가 체결되었을 때 별도 호출
      return prevT
    case 'no_exec':
      return prevT
    default:
      return prevT
  }
}

/** 지정가 매도 후 LOC 매수 체결 시 T 갱신 */
export function applyTValueAfterFixedSell(prevT: number, buyType: 'full' | 'half'): number {
  if (buyType === 'full') return prevT * 0.25 + 1
  return prevT * 0.25 + 0.5
}

/** 리버스 모드 매도 시 T 갱신 */
export function applyTValueReverseSell(prevT: number, division: Division): number {
  return prevT * (division === 40 ? 0.95 : 0.9)
}

/** 리버스 모드 매수 시 T 갱신 */
export function applyTValueReverseBuy(prevT: number, division: Division): number {
  return prevT + (division - prevT) * 0.25
}

/** 현재 T와 분할수 기준으로 모드 결정 */
export function resolveMode(
  t: number,
  division: Division,
  quantity: number,
): 'cycle_start' | 'first_half' | 'second_half' | 'reverse' {
  if (t === 0 && quantity === 0) return 'cycle_start'
  if (t > division - 1) return 'reverse'
  if (t < division / 2) return 'first_half'
  return 'second_half'
}
