/**
 * VR 예약주문 계단(ladder) 계획 — 순수함수.
 *
 * 매일 트레이딩 데이(KST 09:00~다음날 08:50) 동안 "1주씩 지정가 DAY" 예약주문을 매수·매도 각각
 * steps단계만큼 걸어두고, 체결돼서 상태가 바뀌면 5분 틱마다 부족한 단계만 채워 넣는다.
 * 매수 트리거가 = 최소밴드 ÷ 직전 보유수량, 매도 트리거가 = 최대밴드 ÷ 직전 보유수량 (ladder.ts와 동일 공식).
 * 밴드는 사이클 안에서 고정이라 한 단계가 체결돼도 나머지 단계 가격은 안 변한다 — 그래서 "없는 단계만 추가"로 충분하다.
 */

export interface LadderRung {
  side: 'BUY' | 'SELL';
  /** 체결 직전 보유수량 (clientOrderId 식별용) */
  prevQty: number;
  price: number;
}

export interface OpenOrderLite {
  side: 'BUY' | 'SELL';
  price: number;
  quantity: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** 반올림 방식 차이(예: 100.775 → 100.77/100.78)로 1센트 어긋난 같은 단계를 중복으로 안 걸도록 1센트까지 같은 가격으로 본다 */
const TICK_TOLERANCE = 0.011;

export function planLadder(params: {
  quantity: number;
  minBand: number;
  maxBand: number;
  pool: number;
  cyclePoolStart: number;
  poolLimitPct: number;
  steps: number;
}): { buys: LadderRung[]; sells: LadderRung[] } {
  const { quantity, minBand, maxBand, pool, cyclePoolStart, poolLimitPct, steps } = params;

  // decision.ts와 같은 Pool 사용한도: 사이클 시작 Pool의 (100-한도%) 밑으로는 못 내려간다
  const reserveFloor = round2((cyclePoolStart * (100 - poolLimitPct)) / 100);
  const usablePool = round2(pool - reserveFloor);

  const buys: LadderRung[] = [];
  let used = 0;
  for (let i = 0; i < steps; i++) {
    const prevQty = quantity + i;
    if (prevQty <= 0) break;
    const price = round2(minBand / prevQty);
    used = round2(used + price);
    if (used > usablePool) break;
    buys.push({ side: 'BUY', prevQty, price });
  }

  const sells: LadderRung[] = [];
  for (let i = 0; i < Math.min(steps, quantity); i++) {
    const prevQty = quantity - i;
    sells.push({ side: 'SELL', prevQty, price: round2(maxBand / prevQty) });
  }
  return { buys, sells };
}

/** 이미 걸려 있는 주문(같은 방향·같은 가격, 수량 1 기준)은 제외하고 새로 걸어야 할 단계만 남긴다 */
export function missingRungs(planned: LadderRung[], open: OpenOrderLite[]): LadderRung[] {
  const remaining = open.map((o) => ({ ...o }));
  return planned.filter((rung) => {
    const idx = remaining.findIndex(
      (o) => o.side === rung.side && Math.abs(o.price - rung.price) <= TICK_TOLERANCE && o.quantity >= 1,
    );
    if (idx < 0) return true;
    remaining.splice(idx, 1);
    return false;
  });
}

/** 현재가에서 지금 바로 체결될 주문(매수: 지정가 ≥ 현재가, 매도: 지정가 ≤ 현재가)의 수량 합 */
export function marketableQty(orders: OpenOrderLite[], side: 'BUY' | 'SELL', price: number): number {
  return orders
    .filter((o) => o.side === side && (side === 'BUY' ? o.price >= price : o.price <= price))
    .reduce((sum, o) => sum + o.quantity, 0);
}
