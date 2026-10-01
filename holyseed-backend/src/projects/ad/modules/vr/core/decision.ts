/**
 * VR 매매 판단 — 순수함수. packages/vr-core/src/decision.ts와 동일 로직의 백엔드 사본.
 *
 * 판단 기준: 평가금(보유수량 × 현재가) < 최소밴드 → 매수 / > 최대밴드 → 매도 / 그 외 홀딩.
 * 수량은 "공식(밴드 경계)에서 최대한 벗어나지 않는" 최소 정수 수량을 한 번에 계산한다.
 *
 * Pool 사용한도(예: 75%) 정책: "그 순간 Pool의 75%"를 매번 다시 계산하면 매수할수록 기준선
 * 자체가 줄어든 Pool로 다시 그어져 누적 지출이 사이클 시작 Pool의 100%에 근접할 수 있다
 * (등비급수 0.75+0.75×0.25+0.75×0.25²+...→1.0). 그래서 "Pool이 사이클 시작 Pool의
 * (100-한도%) 밑으로는 못 내려간다"는 하한선(reserveFloor)으로 계산한다 — 사이클 동안
 * reserveFloor는 고정, usablePool(오늘 더 쓸 수 있는 금액)만 실시간 Pool에 따라 움직인다.
 * 한도 초과 시 전량 스킵이 아니라 한도 안에서 최대 정수 수량으로 클램프한다.
 */
import { computeBand } from './band';

export interface VrDecisionState {
  quantity: number;
  vValue: number;
  pool: number;
  cyclePoolStart: number;
}

export interface VrDecisionSettings {
  bandPct: number;
  poolLimitPct: number;
}

export type VrDecision =
  | { action: 'BUY'; quantity: number; estAmount: number; clamped: boolean }
  | { action: 'SELL'; quantity: number; estAmount: number }
  | { action: 'NONE'; reason: string };

const round2 = (n: number) => Math.round(n * 100) / 100;

export function decide(state: VrDecisionState, price: number, settings: VrDecisionSettings): VrDecision {
  const { minBand, maxBand } = computeBand(state.vValue, settings.bandPct);
  const evalAmount = state.quantity * price;

  if (evalAmount < minBand) {
    const rawQty = Math.ceil(minBand / price) - state.quantity;
    if (rawQty < 1) return { action: 'NONE', reason: '밴드 이내' };

    const reserveFloor = round2((state.cyclePoolStart * (100 - settings.poolLimitPct)) / 100);
    const usablePool = round2(state.pool - reserveFloor);
    const maxQtyByPool = Math.floor(usablePool / price);
    if (maxQtyByPool < 1) {
      return { action: 'NONE', reason: `Pool 사용한도(${usablePool}) 부족으로 매수 불가` };
    }

    const qty = Math.min(rawQty, maxQtyByPool);
    return { action: 'BUY', quantity: qty, estAmount: round2(qty * price), clamped: qty < rawQty };
  }

  if (evalAmount > maxBand) {
    const qty = state.quantity - Math.floor(maxBand / price);
    if (qty < 1) return { action: 'NONE', reason: '밴드 이내' };
    return { action: 'SELL', quantity: qty, estAmount: round2(qty * price) };
  }

  return { action: 'NONE', reason: '밴드 이내' };
}
