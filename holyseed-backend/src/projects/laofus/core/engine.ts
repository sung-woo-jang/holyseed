/**
 * 무한매수법 V4.0 일반모드 (SOXL 40분할) — 소수점 금액기준 판단 로직.
 * LOC 에뮬레이션: 장마감 30분 전 현재가로 LOC 체결 조건을 시뮬레이션한다.
 *
 * 규칙 (방법론 원형):
 * - 별% = (20 - T)%, 별지점 = 평단 × (1 + 별%)
 * - 1회매수금 = 잔금 / (40 - T)
 * - 전반전 (0 < T < 20): P < 평단 → 전액 매수(T+1) / 평단 ≤ P < 별지점 → 절반(T+0.5) / P ≥ 별지점 → 매수 없음
 * - 후반전 (20 ≤ T < 40): P < 별지점 → 전액 매수(T+1)
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
const SPLITS = 40;

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function round6(n: number): number {
  return Math.round(n * 1e6) / 1e6;
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

/** 장마감 30분 전 가격 P 기준 주문 결정 */
export function decide(s: ImuState, price: number): Decision {
  if (s.T > 39) {
    return { action: 'NONE', reason: `T=${s.T} > 39: 리버스모드 대상 — 자동화 미지원, 수동 확인 필요` };
  }

  const ind = computeIndicators(s);

  // 사이클 시작
  if (s.T === 0 || s.quantity <= 0) {
    if (s.cash < ind.oneBuyAmount) {
      return { action: 'NONE', reason: `잔금 부족: $${s.cash} < 1회매수금 $${ind.oneBuyAmount}` };
    }
    return { action: 'BUY', amountUsd: ind.oneBuyAmount, kind: '사이클시작', tAfter: 1 };
  }

  // 매도 우선
  if (price >= ind.fullSellPrice) {
    return { action: 'SELL', quantity: round6(s.quantity), kind: '전량매도', tAfter: 0 };
  }
  if (price >= ind.starPrice) {
    const q = round6(s.quantity / 4);
    return { action: 'SELL', quantity: q, kind: '쿼터매도', tAfter: round4(s.T * 0.75) };
  }

  // 매수
  const firstHalf = s.T < 20;
  if (firstHalf) {
    if (price < s.avgPrice) {
      return buyOrSkip(s, ind.oneBuyAmount, '전액', s.T + 1);
    }
    // 평단 ≤ P < 별지점
    return buyOrSkip(s, round2(ind.oneBuyAmount / 2), '절반', s.T + 0.5);
  }
  // 후반전: P < 별지점 (별지점 이상은 위 매도 분기에서 걸러짐)
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

function round4(n: number): number {
  return Math.round(n * 1e4) / 1e4;
}

/** 체결 결과를 상태에 반영 */
export function applyFill(
  s: ImuState,
  d: Decision,
  fill: { quantity: number; price: number; amount: number },
): ImuState {
  if (d.action === 'BUY') {
    const newQty = round6(s.quantity + fill.quantity);
    const newAvg = newQty > 0 ? round4((s.avgPrice * s.quantity + fill.price * fill.quantity) / newQty) : s.avgPrice;
    return {
      ...s,
      quantity: newQty,
      avgPrice: newAvg,
      cash: round2(s.cash - fill.amount),
      T: d.tAfter,
    };
  }
  if (d.action === 'SELL') {
    const newQty = round6(s.quantity - fill.quantity);
    const cycleDone = newQty <= 0.000001;
    return {
      ...s,
      quantity: cycleDone ? 0 : newQty,
      cash: round2(s.cash + fill.amount),
      T: cycleDone ? 0 : d.tAfter,
      // 평단은 매도 시 변동 없음. 사이클 종료 시 다음 시작은 수동 확인 (복리 여부).
    };
  }
  return s;
}
