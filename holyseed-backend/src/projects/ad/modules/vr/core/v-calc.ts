import { computeV2, computeV2Skill } from './rollover';

const round2 = (n: number) => Math.round(n * 100) / 100;

export type VCalcSource = 'ROLLOVER' | 'MANUAL' | 'BACKFILL';
export type VFormula = 'BASIC' | 'SKILL';

export interface VCalcInput {
  vValue: number;
  depositAmount: number;
  prevVValue: number | null;
  poolInput: number | null;
  gFactor: number | null;
  evaluationInput?: number | null;
  calcSource: VCalcSource | null;
}

export interface VCalc {
  source: VCalcSource | null;
  /** 평가금(E)이 저장돼 있으면 실력공식, 없으면 기본공식으로 재계산 */
  formula: VFormula | null;
  prevV: number | null;
  poolInput: number | null;
  g: number | null;
  evaluation: number | null;
  deposit: number;
  poolTerm: number | null;
  /** (E − V₁)/(2√G) — 실력공식에서만 */
  evalTerm: number | null;
  result: number;
  recomputed: number | null;
  delta: number | null;
  matches: boolean | null;
  growth: number | null;
  growthPct: number | null;
}

/** 저장된 V 산출 입력으로 공식을 다시 계산해 기록된 V와 대조 (저장 X, 응답용) */
export function buildVCalc(c: VCalcInput): VCalc {
  const evaluation = c.evaluationInput ?? null;
  const complete = c.prevVValue != null && c.poolInput != null && c.gFactor != null && c.gFactor > 0;
  const base: VCalc = {
    source: c.calcSource,
    formula: null,
    prevV: c.prevVValue,
    poolInput: c.poolInput,
    g: c.gFactor,
    evaluation,
    deposit: c.depositAmount,
    poolTerm: null,
    evalTerm: null,
    result: c.vValue,
    recomputed: null,
    delta: null,
    matches: null,
    growth: null,
    growthPct: null,
  };
  if (!complete) return base;

  const prev = c.prevVValue as number;
  const pool = c.poolInput as number;
  const g = c.gFactor as number;
  const skill = evaluation !== null;
  const recomputed = skill
    ? computeV2Skill(prev, pool, g, evaluation, c.depositAmount)
    : computeV2(prev, pool, g, c.depositAmount);
  const delta = round2(c.vValue - recomputed);
  return {
    ...base,
    formula: skill ? 'SKILL' : 'BASIC',
    poolTerm: round2(pool / g),
    evalTerm: skill ? round2((evaluation - prev) / (2 * Math.sqrt(g))) : null,
    recomputed,
    delta,
    matches: Math.abs(delta) < 0.015,
    growth: round2(c.vValue - prev),
    growthPct: prev > 0 ? round2(((c.vValue - prev) / prev) * 100) : null,
  };
}
