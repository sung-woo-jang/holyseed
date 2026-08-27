export interface LadderRow {
  qtyAfter: number;
  triggerPrice: number;
  poolAfter: number;
  exceedsLimit: boolean;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function buildBuyLadder(params: { quantity: number; minBand: number; pool: number; usablePool: number; steps?: number }): LadderRow[] {
  const { quantity, minBand, pool, usablePool, steps = 15 } = params;
  const rows: LadderRow[] = [];
  let poolLeft = pool;
  let used = 0;

  for (let i = 1; i <= steps; i++) {
    const prevQty = quantity + i - 1;
    if (prevQty <= 0) break;
    const trigger = round2(minBand / prevQty);
    poolLeft = round2(poolLeft - trigger);
    used = round2(used + trigger);
    rows.push({
      qtyAfter: prevQty + 1,
      triggerPrice: trigger,
      poolAfter: poolLeft,
      exceedsLimit: used > usablePool,
    });
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
