/**
 * 무한매수법 V4.0 일반모드 (SOXL 40분할) 판단 로직 — packages/laofus-core를 ad-native에 그대로 복제.
 * ad-native는 yarn workspace가 아니라 그 패키지를 직접 import할 수 없어서(Metro 번들러 별도 설정 필요),
 * 작은 순수 함수라 중복 비용이 낮다고 판단해 여기 복제(백엔드/lab-front와 로직은 100% 동일하게 유지).
 */

export interface ImuState {
  cycle: number;
  T: number;
  quantity: number;
  avgPrice: number;
  cash: number;
  principal: number;
}

export interface BuyDecision {
  action: 'BUY';
  amountUsd: number;
  kind: '전액' | '절반' | '사이클시작';
  tAfter: number;
}

export interface SellDecision {
  action: 'SELL';
  quantity: number;
  kind: '쿼터매도' | '전량매도';
  tAfter: number;
}

export interface NoActionDecision {
  action: 'NONE';
  reason: string;
}

export type Decision = BuyDecision | SellDecision | NoActionDecision;

export interface Indicators {
  starPct: number;
  starPrice: number;
  fullSellPrice: number;
  oneBuyAmount: number;
}

const SOXL_STAR_BASE = 20;
const FULL_SELL_PCT = 0.2;
const SPLITS = 40;

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function round6(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}

function round4(n: number): number {
  return Math.round(n * 1e4) / 1e4;
}

export function computeIndicators(s: ImuState): Indicators {
  const starPct = (SOXL_STAR_BASE - s.T) / 100;
  return {
    starPct,
    starPrice: round2(s.avgPrice * (1 + starPct)),
    fullSellPrice: round2(s.avgPrice * (1 + FULL_SELL_PCT)),
    oneBuyAmount: round2(s.cash / (SPLITS - s.T)),
  };
}

export function decide(s: ImuState, price: number): Decision {
  if (s.T > 39) {
    return { action: 'NONE', reason: `T=${s.T} > 39: 리버스모드 대상 — 자동화 미지원, 수동 확인 필요` };
  }

  const ind = computeIndicators(s);

  if (s.T === 0 || s.quantity <= 0) {
    if (s.cash < ind.oneBuyAmount) {
      return { action: 'NONE', reason: `잔금 부족: $${s.cash} < 1회매수금 $${ind.oneBuyAmount}` };
    }
    return { action: 'BUY', amountUsd: ind.oneBuyAmount, kind: '사이클시작', tAfter: 1 };
  }

  if (price >= ind.fullSellPrice) {
    return { action: 'SELL', quantity: round6(s.quantity), kind: '전량매도', tAfter: 0 };
  }
  if (price >= ind.starPrice) {
    const q = round6(s.quantity / 4);
    return { action: 'SELL', quantity: q, kind: '쿼터매도', tAfter: round4(s.T * 0.75) };
  }

  const firstHalf = s.T < 20;
  if (firstHalf) {
    if (price < s.avgPrice) {
      return buyOrSkip(s, ind.oneBuyAmount, '전액', s.T + 1);
    }
    return buyOrSkip(s, round2(ind.oneBuyAmount / 2), '절반', s.T + 0.5);
  }
  return buyOrSkip(s, ind.oneBuyAmount, '전액', s.T + 1);
}

function buyOrSkip(s: ImuState, amount: number, kind: '전액' | '절반', tAfter: number): Decision {
  if (amount < 1) {
    return { action: 'NONE', reason: `매수금 $${amount} < 최소 $1` };
  }
  if (s.cash < amount) {
    return { action: 'NONE', reason: `잔금 부족: $${s.cash} < 매수금 $${amount}` };
  }
  return { action: 'BUY', amountUsd: amount, kind, tAfter: round4(tAfter) };
}

export function applyFill(s: ImuState, d: Decision, fill: { quantity: number; price: number; amount: number }): ImuState {
  if (d.action === 'BUY') {
    const newQty = round6(s.quantity + fill.quantity);
    const newAvg = newQty > 0 ? round4((s.avgPrice * s.quantity + fill.price * fill.quantity) / newQty) : s.avgPrice;
    return { ...s, quantity: newQty, avgPrice: newAvg, cash: round2(s.cash - fill.amount), T: d.tAfter };
  }
  if (d.action === 'SELL') {
    const newQty = round6(s.quantity - fill.quantity);
    const cycleDone = newQty <= 0.000001;
    return { ...s, quantity: cycleDone ? 0 : newQty, cash: round2(s.cash + fill.amount), T: cycleDone ? 0 : d.tAfter };
  }
  return s;
}
