import { computeV2 } from './rollover';

const round2 = (n: number) => Math.round(n * 100) / 100;

export type VCalcSource = 'ROLLOVER' | 'MANUAL' | 'BACKFILL';

export interface VCalcInput {
  vValue: number;
  depositAmount: number;
  prevVValue: number | null;
  poolInput: number | null;
  gFactor: number | null;
  calcSource: VCalcSource | null;
}

export interface VCalc {
  source: VCalcSource | null;
  prevV: number | null;
  poolInput: number | null;
  g: number | null;
  deposit: number;
  poolTerm: number | null;
  result: number;
  recomputed: number | null;
  delta: number | null;
  matches: boolean | null;
  growth: number | null;
  growthPct: number | null;
}

/** 저장된 V 산출 입력으로 공식을 다시 계산해 기록된 V와 대조 (저장 X, 응답용) */
export function buildVCalc(c: VCalcInput): VCalc {
  const complete = c.prevVValue != null && c.poolInput != null && c.gFactor != null && c.gFactor > 0;
  const base: VCalc = {
    source: c.calcSource,
    prevV: c.prevVValue,
    poolInput: c.poolInput,
    g: c.gFactor,
    deposit: c.depositAmount,
    poolTerm: null,
    result: c.vValue,
    recomputed: null,
    delta: null,
    matches: null,
    growth: null,
    growthPct: null,
  };
  if (!complete) return base;

  const prev = c.prevVValue as number;
  const recomputed = computeV2(prev, c.poolInput as number, c.gFactor as number, c.depositAmount);
  const delta = round2(c.vValue - recomputed);
  return {
    ...base,
    poolTerm: round2((c.poolInput as number) / (c.gFactor as number)),
    recomputed,
    delta,
    matches: Math.abs(delta) < 0.015,
    growth: round2(c.vValue - prev),
    growthPct: prev > 0 ? round2(((c.vValue - prev) / prev) * 100) : null,
  };
}
