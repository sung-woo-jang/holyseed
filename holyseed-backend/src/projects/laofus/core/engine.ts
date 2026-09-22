/**
 * 무한매수법 V4.0 일반모드 (SOXL 20분할, 온주 LOC) 판단 로직.
 *
 * 규칙 (방법론 원형):
 * - 별% = (20 - (40/SPLITS)×T)%, 별지점 = 평단 × (1 + 별%)
 * - 1회매수금 = 잔금 / (SPLITS - T)
 * - 전반전 (0 < T < SPLITS/2): P < 평단 → 전액 매수(T+1) / 평단 ≤ P < 별지점 → 절반(T+0.5) / P ≥ 별지점 → 매수 없음
 * - 후반전 (SPLITS/2 ≤ T < SPLITS): P < 별지점 → 전액 매수(T+1)
 * - 매도 (전/후반 공통): P ≥ 별지점 → 보유/4 쿼터매도(T×0.75) / P ≥ 평단×1.20 → 잔량 전량 매도
 * - T = 0: 사이클 시작, 1회매수금 전액 매수
 * - 매도·매수 동시 충족 시 매도 우선
 */

export interface ImuState {
  cycle: number;
  T: number;
  quantity: number; // 보유수량 (소수점 6자리)
  avgPrice: number; // 평단
  cash: number; // 무매 잔금 (계좌잔고 아님)
  principal: number; // 총원금
}

export interface BuyDecision {
  action: 'BUY';
  amountUsd: number; // orderAmount
  kind: '전액' | '절반' | '사이클시작';
  tAfter: number;
}

export interface SellDecision {
  action: 'SELL';
  quantity: number; // 소수점 6자리
  kind: '쿼터매도' | '전량매도';
  tAfter: number;
}

export interface NoActionDecision {
  action: 'NONE';
  reason: string;
}

export type Decision = BuyDecision | SellDecision | NoActionDecision;

export interface Indicators {
  starPct: number; // 별% (소수, 예: 0.05 = 5%)
  starPrice: number; // 별지점
  fullSellPrice: number; // 평단 × 1.20
  oneBuyAmount: number; // 1회매수금
}

const SOXL_STAR_BASE = 20; // 별% = (20 - T)%
const FULL_SELL_PCT = 0.2; // SOXL 20% 지정가 대체
const SPLITS = 20;

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function round6(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}

export function round4(n: number): number {
  return Math.round(n * 1e4) / 1e4;
}

export function computeIndicators(s: ImuState): Indicators {
  const starPct = (SOXL_STAR_BASE - (40 / SPLITS) * s.T) / 100;
  return {
    starPct,
    starPrice: round2(s.avgPrice * (1 + starPct)),
    fullSellPrice: round2(s.avgPrice * (1 + FULL_SELL_PCT)),
    oneBuyAmount: round2(s.cash / (SPLITS - s.T)),
  };
}

/** 장마감 30분 전 가격 P 기준 주문 결정 — 매수 분기는 이제 computeBuyLocLegs가 담당, 여기는 매도 판단 전용으로 축소 */
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
  price: number;
  quantity: number;
  halfStep: boolean;
}

export function computeBuyLocLegs(s: ImuState): BuyLocLeg[] {
  if (s.T > SPLITS - 1) return [];
  if (s.T === 0 || s.quantity <= 0) return [];

  const ind = computeIndicators(s);
  const buyStarPrice = round2(ind.starPrice - 0.01);
  const firstHalf = s.T < SPLITS / 2;
  const raw = firstHalf
    ? [
        { price: buyStarPrice, amount: round2(ind.oneBuyAmount / 2), halfStep: true },
        { price: s.avgPrice, amount: round2(ind.oneBuyAmount / 2), halfStep: true },
      ]
    : [{ price: buyStarPrice, amount: ind.oneBuyAmount, halfStep: false }];

  // amount(가상 잔금 기준 배정액)가 0 이하여도(급락으로 최소 1주 매수를 계속 강행하면서 가상
  // 잔금이 마이너스로 몰릴 수 있음) leg 자체를 걸러내지 않는다 — 정수 매수 원칙상 항상 최소 1주는
  // 시도하고, 실제 매수 가능 여부는 engine.service.ts의 실계좌 buying power 체크가 담당한다.
  return raw.map((r) => ({ price: r.price, quantity: Math.max(Math.floor(r.amount / r.price), 1), halfStep: r.halfStep }));
}

export interface SellLocLeg {
  price: number;
  quantity: number;
  kind: '쿼터매도' | '전량매도';
}

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

export function applyFill(
  s: ImuState,
  d: Decision,
  fill: { quantity: number; price: number; amount: number },
): ImuState {
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

/**
 * LOC 매수 leg 가격이 기준가(현재가)에서 너무 멀면 증권사가 "전일 종가와 괴리가 크다"며
 * 주문 자체를 거부한다 — <큰수 매수> 문서(원래 키움 기준)와 동일한 현상이 토스에서도 실제
 * 발생함(2026-09-15, 사이클 초반 평단 고정 상태로 며칠 급락하자 평단 leg가 매일 REJECTED).
 * 문서 원칙대로 leg 가격을 기준가 근처로 눌러서 반드시 체결되게 하되, 수량은 그대로 둔다
 * (매수 의도·수량은 안 바뀌고 가격만 보정). 정확한 토스 임계값은 확인된 바 없어 문서 권장
 * 범위(10~20%) 중 여유 있게 20%로 시작 — 실제 REJECTED 로그가 더 보이면(임계값이 이보다
 * 낮다는 뜻) 더 줄이고, 정상적인 변동에도 자주 클램프되면(너무 타이트하다는 뜻) 늘릴 것.
 * TODO: 이 값은 추정치 — 실거래 로그(REJECTED 발생 여부·클램프 발동 빈도) 몇 사이클 지켜보고
 * 조정 필요.
 */
const MAX_PRICE_DEVIATION_PCT = 20;

export function capLegPriceForDeviation(
  legPrice: number,
  refPrice: number,
  maxDeviationPct: number = MAX_PRICE_DEVIATION_PCT,
): { price: number; capped: boolean } {
  const upper = round2(refPrice * (1 + maxDeviationPct / 100));
  const lower = round2(refPrice * (1 - maxDeviationPct / 100));
  if (legPrice > upper) return { price: upper, capped: true };
  if (legPrice < lower) return { price: lower, capped: true };
  return { price: legPrice, capped: false };
}
