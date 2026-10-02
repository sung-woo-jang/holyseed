/**
 * VR 추이 화면용 순수 함수 — 평가금 이력 복원, 단순 매수 벤치마크, 낙폭, 밴드 위치·경계 가격, 사이클 요약.
 * 서버 데이터(wealth-history·fills·cycles·TQQQ 일봉)에서만 계산하고 새 API는 쓰지 않는다.
 */
import type { VrCandlesDto, VrCycle, VrFill, VrWealthHistoryPoint } from '../api/vr';

export interface TrendPoint {
  date: string;
  /** TQQQ 평가금 */
  val: number;
  /** VR Pool(현금) */
  pool: number;
  /** 계좌총액 = 평가금 + Pool */
  tot: number;
  /** 누적 투자원금(입금 합) */
  prin: number;
  /** 같은 입금을 입금일 종가에 전액 TQQQ로 샀다면의 평가금 — 일봉이 없으면 null */
  bench: number | null;
  /** 일봉으로 복원한 추정치(실제 스냅샷이 없는 날) */
  est: boolean;
  cycleNo: number | null;
  min: number | null;
  max: number | null;
}

type CandleRow = VrCandlesDto['candles'][number];

export function closesByDate(candles: CandleRow[]): Map<string, number> {
  return new Map(candles.map((c) => [c.timestamp.slice(0, 10), Number(c.closePrice)]));
}

/** 기준일 이전(포함 여부 선택)의 가장 가까운 종가 */
function closeAsOf(closes: Map<string, number>, dates: string[], date: string, inclusive: boolean): number | null {
  let found: string | null = null;
  for (const d of dates) {
    if (inclusive ? d <= date : d < date) found = d;
    else break;
  }
  return found ? closes.get(found)! : null;
}

function lastFillAtOrBefore(fills: VrFill[], date: string): VrFill | null {
  let r: VrFill | null = null;
  for (const f of fills) {
    if (f.fillDate > date) break;
    r = f;
  }
  return r;
}

function cycleAt(cycles: VrCycle[], date: string): VrCycle | null {
  let r: VrCycle | null = null;
  for (const c of cycles) if (c.startDate <= date && (!r || c.startDate >= r.startDate)) r = c;
  return r;
}

export function buildTrend(args: {
  fills: VrFill[];
  cycles: VrCycle[];
  wealth: VrWealthHistoryPoint[];
  candles: CandleRow[];
}): TrendPoint[] {
  const fills = [...args.fills].sort((a, b) => (a.fillDate === b.fillDate ? a.id - b.id : a.fillDate < b.fillDate ? -1 : 1));
  const closes = closesByDate(args.candles);
  const closeDates = [...closes.keys()].sort();
  const deposits = fills.filter((f) => f.kind === 'DEPOSIT');
  const haveCandles = closeDates.length > 0;

  // 입금마다 입금일 종가로 산 주수 — 일봉이 없으면 벤치마크는 만들지 않는다
  const depositShares = deposits.map((d) => {
    const p = closeAsOf(closes, closeDates, d.fillDate, true);
    return { date: d.fillDate, shares: p ? d.amount / p : null };
  });

  const principalAt = (date: string) => deposits.filter((d) => d.fillDate <= date).reduce((s, d) => s + d.amount, 0);
  const benchAt = (date: string, price: number | null): number | null => {
    if (!haveCandles || price == null) return null;
    let shares = 0;
    for (const d of depositShares) {
      if (d.date > date) break;
      if (d.shares == null) return null;
      shares += d.shares;
    }
    return shares * price;
  };
  const withCycle = (date: string) => {
    const c = cycleAt(args.cycles, date);
    return { cycleNo: c?.cycleNo ?? null, min: c?.minBand ?? null, max: c?.maxBand ?? null };
  };

  const points: TrendPoint[] = [];
  const firstSnapshot = args.wealth.length > 0 ? args.wealth[0]!.date : null;
  const firstFill = fills[0]?.fillDate ?? null;

  // 1) 스냅샷이 시작되기 전 거래일은 "그날 보유수량 × 종가"로 복원
  if (firstFill) {
    for (const date of closeDates) {
      if (date < firstFill) continue;
      if (firstSnapshot && date >= firstSnapshot) break;
      const f = lastFillAtOrBefore(fills, date);
      if (!f) continue;
      const price = closes.get(date)!;
      const val = f.qtyAfter * price;
      points.push({ date, val, pool: f.poolAfter, tot: val + f.poolAfter, prin: principalAt(date), bench: benchAt(date, price), est: true, ...withCycle(date) });
    }
  }
  // 2) 실제 스냅샷 값은 그대로 — 스냅샷은 마감 후 찍혀 날짜보다 직전 거래일 종가에 가깝다
  for (const w of args.wealth) {
    const price = closeAsOf(closes, closeDates, w.date, false);
    points.push({ date: w.date, val: w.tqqqValue, pool: w.pool, tot: w.totalAssets, prin: w.cumulativePrincipal, bench: benchAt(w.date, price), est: false, ...withCycle(w.date) });
  }
  return points;
}

/** 원금 대비 비율(계좌총액/누적 입금)의 고점 대비 최대 낙폭 % (음수) */
export function maxDrawdownPct(points: TrendPoint[], pick: (p: TrendPoint) => number | null): number | null {
  let peak = 0;
  let worst = 0;
  let any = false;
  for (const p of points) {
    const v = pick(p);
    if (v == null || p.prin <= 0) continue;
    any = true;
    const ratio = v / p.prin;
    peak = Math.max(peak, ratio);
    worst = Math.min(worst, ratio / peak - 1);
  }
  return any ? worst * 100 : null;
}

export function returnPct(value: number | null, principal: number): number | null {
  return value != null && principal > 0 ? (value / principal - 1) * 100 : null;
}

export type BandState = 'below' | 'inside' | 'above';

export function bandState(val: number, min: number, max: number): BandState {
  return val < min ? 'below' : val > max ? 'above' : 'inside';
}

/** 밴드 안 위치 0(최소)~1(최대) — 밖이면 0/1로 자른다 */
export function bandPosition(val: number, min: number, max: number): number {
  return Math.max(0, Math.min(1, (val - min) / (max - min || 1)));
}

export interface BandBoundaries {
  /** 평가금이 최소 밴드에 닿는 TQQQ 가격 (보유수량 유지 가정) */
  buyPrice: number;
  sellPrice: number;
  buyDistancePct: number;
  sellDistancePct: number;
}

export function bandBoundaries(args: { quantity: number; minBand: number; maxBand: number; price: number }): BandBoundaries | null {
  const { quantity, minBand, maxBand, price } = args;
  if (quantity <= 0 || price <= 0) return null;
  const buyPrice = minBand / quantity;
  const sellPrice = maxBand / quantity;
  return { buyPrice, sellPrice, buyDistancePct: (buyPrice / price - 1) * 100, sellDistancePct: (sellPrice / price - 1) * 100 };
}

export interface CycleSummary {
  cycle: VrCycle;
  endVal: number | null;
  endPool: number | null;
  state: BandState | null;
  position: number | null;
  buyCount: number;
  outDays: number;
  /** 이 사이클 구간에 복원값이 섞여 있음 */
  hasEstimate: boolean;
}

export function summarizeCycles(cycles: VrCycle[], fills: VrFill[], points: TrendPoint[]): CycleSummary[] {
  return [...cycles]
    .sort((a, b) => b.cycleNo - a.cycleNo)
    .map((cycle) => {
      const pts = points.filter((p) => p.cycleNo === cycle.cycleNo);
      const end = pts[pts.length - 1] ?? null;
      const outDays = pts.filter((p) => p.val < cycle.minBand || p.val > cycle.maxBand).length;
      return {
        cycle,
        endVal: end?.val ?? null,
        endPool: end?.pool ?? null,
        state: end ? bandState(end.val, cycle.minBand, cycle.maxBand) : null,
        position: end ? bandPosition(end.val, cycle.minBand, cycle.maxBand) : null,
        buyCount: fills.filter((f) => f.cycleNo === cycle.cycleNo && f.kind === 'BUY').length,
        outDays,
        hasEstimate: pts.some((p) => p.est),
      };
    });
}
