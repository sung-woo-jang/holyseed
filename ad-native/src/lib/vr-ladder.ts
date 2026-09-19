/**
 * packages/vr-core/src/ladder.ts 로컬 미러 — ad-native(Expo/Metro)는 모노레포 패키지를 직접
 * import할 수 없어(laofus-core.ts와 동일한 이유) 순수함수를 그대로 복제해둔다.
 *
 * 계단식 예약 매수/매도표 (참고/시뮬레이션 용도).
 * 1주씩 순차 체결 가정, 매 단계 트리거가 재계산.
 * 매수 트리거가 = 최소밴드 ÷ (매수 직전 보유수량)
 * 매도 트리거가 = 최대밴드 ÷ (매도 직전 보유수량)
 */

export interface LadderRow {
  qtyAfter: number;
  triggerPrice: number;
  poolAfter: number;
  exceedsLimit: boolean;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function buildBuyLadder(params: { quantity: number; minBand: number; pool: number; usablePool: number; steps?: number }): LadderRow[] {
  const { quantity, minBand, pool, usablePool, steps } = params;
  // steps를 안 넘기면 매수한도(usablePool)를 넘어서는 첫 단계까지 자동으로 늘어남(그 지점까지가
  // "지금 사이클에서 최대로 살 수 있는 범위") — steps를 명시하면 기존처럼 고정 길이로 동작.
  const autoStop = steps === undefined;
  const maxSteps = steps ?? 500; // 무한루프 방지용 상한(정상 범위에선 절대 안 닿음)
  const rows: LadderRow[] = [];
  let poolLeft = pool;
  let used = 0;

  for (let i = 1; i <= maxSteps; i++) {
    const prevQty = quantity + i - 1;
    if (prevQty <= 0) break;
    const trigger = round2(minBand / prevQty);
    poolLeft = round2(poolLeft - trigger);
    used = round2(used + trigger);
    const exceedsLimit = used > usablePool;
    rows.push({
      qtyAfter: prevQty + 1,
      triggerPrice: trigger,
      poolAfter: poolLeft,
      exceedsLimit,
    });
    if (autoStop && exceedsLimit) break;
  }
  return rows;
}

export function buildSellLadder(params: { quantity: number; maxBand: number; pool: number; steps?: number }): LadderRow[] {
  const { quantity, maxBand, pool, steps = 15 } = params;
  const rows: LadderRow[] = [];
  let poolAfter = pool;

  for (let i = 1; i <= Math.min(steps, quantity); i++) {
    const prevQty = quantity - i + 1;
    const trigger = round2(maxBand / prevQty);
    poolAfter = round2(poolAfter + trigger);
    rows.push({
      qtyAfter: prevQty - 1,
      triggerPrice: trigger,
      poolAfter,
      exceedsLimit: false,
    });
  }
  return rows;
}
