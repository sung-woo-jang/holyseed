/**
 * 무한매수법 V4.0 일반모드 (SOXL 20분할, 온주 LOC) 판단 로직 — packages/laofus-core를 ad-native에 그대로 복제.
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
const SPLITS = 20;

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
  // 별% 계수는 분할수에 따라 달라진다: 40분할은 (20-T)%, 20분할은 (20-2T)% — 계수 = 40/SPLITS
  const starPct = (SOXL_STAR_BASE - (40 / SPLITS) * s.T) / 100;
  return {
    starPct,
    starPrice: round2(s.avgPrice * (1 + starPct)),
    fullSellPrice: round2(s.avgPrice * (1 + FULL_SELL_PCT)),
    oneBuyAmount: round2(s.cash / (SPLITS - s.T)),
  };
}

export function decide(s: ImuState, price: number): Decision {
  if (s.T > SPLITS - 1) {
    return { action: 'NONE', reason: `T=${s.T} > ${SPLITS - 1}: 리버스모드 대상 — 자동화 미지원, 수동 확인 필요` };
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

  const firstHalf = s.T < SPLITS / 2;
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

export interface BuyLocLeg {
  price: number; // LOC 지정가
  quantity: number; // 온주(정수) 수량
  halfStep: boolean; // true=T+0.5 단위(전반전 2-leg 중 하나), false=T+1 단위(후반전 단일 leg)
}

export interface SellLocLeg {
  price: number;
  quantity: number;
  kind: '쿼터매도' | '전량매도';
}

/**
 * 온주(정수) LOC 매수 — 그날 현재가를 관찰하지 않고 engine_state만으로 미리 걸어둘 매수 주문을 계산한다.
 * 전반전(T<SPLITS/2): 별지점가에 절반, 평단가에 나머지 절반. 후반전: 별지점가에 전액 1건.
 */
export function computeBuyLocLegs(s: ImuState): BuyLocLeg[] {
  if (s.T > SPLITS - 1) return [];
  if (s.T === 0 || s.quantity <= 0) return [];

  const ind = computeIndicators(s);
  // 방법론 3-(5): 별지점이 매수·매도에서 겹치는 걸 막기 위해 매수 쪽 별지점만 0.01 낮춘다(매도는 그대로).
  const buyStarPrice = round2(ind.starPrice - 0.01);
  const firstHalf = s.T < SPLITS / 2;
  const raw = firstHalf
    ? [
        { price: buyStarPrice, amount: round2(ind.oneBuyAmount / 2), halfStep: true },
        { price: s.avgPrice, amount: round2(ind.oneBuyAmount / 2), halfStep: true },
      ]
    : [{ price: buyStarPrice, amount: ind.oneBuyAmount, halfStep: false }];

  // 온주 매수는 "정수 구매"가 원칙 — 분할 배정 금액(전략에 배정된 가상 예산)이 1주 값보다 작아도
  // 최소 1주는 산다. s.cash는 이 사이클에 배정된 가상 잔금일 뿐 계좌 전체 매수가능금액이 아니라서
  // 여기서 이걸 기준으로 leg를 미리 걸러내면 실제로는 충분히 살 수 있는 주문까지 스킵해버린다.
  return raw
    .filter((r) => r.amount >= 1)
    .map((r) => ({ price: r.price, quantity: Math.max(Math.floor(r.amount / r.price), 1), halfStep: r.halfStep }));
}

/**
 * 온주(정수) LOC 매도 — 보유수량을 1/4(별지점가) + 나머지(평단×1.2가)로 미리 쪼개 동시에 걸어둔다.
 * 두 leg를 더하면 정확히 보유수량(정수부)이라 오버셀 없음.
 */
export function computeSellLocLegs(s: ImuState): SellLocLeg[] {
  if (s.T > SPLITS - 1) return [];
  if (s.quantity <= 0) return [];

  const ind = computeIndicators(s);
  const wholeQty = Math.floor(s.quantity);
  const quarterQty = Math.floor(s.quantity / 4);
  const restQty = wholeQty - quarterQty;

  const legs: SellLocLeg[] = [];
  if (quarterQty > 0) legs.push({ price: ind.starPrice, quantity: quarterQty, kind: '쿼터매도' });
  if (restQty > 0) legs.push({ price: ind.fullSellPrice, quantity: restQty, kind: '전량매도' });
  return legs;
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
