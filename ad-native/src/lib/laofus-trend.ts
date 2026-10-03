import type { AssetTrendPoint } from '../api/laofus';

export type Ccy = 'krw' | 'usd';

/** 데이터가 그 기간보다 충분히 길 때만 노출 — 51일치뿐일 때 3달·1년이 전체와 같은 그래프가 되지 않게 */
export function availablePeriods(len: number): { value: number; label: string }[] {
  const out: { value: number; label: string }[] = [];
  for (const [p, label] of [[7, '1주'], [30, '1달'], [90, '3달'], [365, '1년']] as const) {
    if (len > p + 1) out.push({ value: p, label });
  }
  out.push({ value: 0, label: `전체 ${len}일` });
  return out;
}

/** period=0이면 전체, 아니면 최근 period일(구간 시작점 포함 period+1개 행) */
export function sliceRows(series: AssetTrendPoint[], period: number): AssetTrendPoint[] {
  return period > 0 && series.length > period + 1 ? series.slice(-(period + 1)) : series;
}

export function stockOf(r: AssetTrendPoint, ccy: Ccy): number {
  return ccy === 'usd' ? r.stockUsd : r.stockUsd * r.fx;
}
export function principalOf(r: AssetTrendPoint, ccy: Ccy): number {
  return ccy === 'usd' ? r.principalUsd : r.principalUsd * r.fx;
}
export function tqqqOf(r: AssetTrendPoint, ccy: Ccy): number {
  return ccy === 'usd' ? r.tqqqValueUsd : r.tqqqValueUsd * r.fx;
}
export function soxlOf(r: AssetTrendPoint, ccy: Ccy): number {
  return ccy === 'usd' ? r.soxlValueUsd : r.soxlValueUsd * r.fx;
}

export interface Returns {
  tqqq: number;
  soxl: number;
  all: number;
}
/** 각 전략의 (평가금 ÷ 원금 − 1) — 입금·매수 시점에 영향받지 않는다. 원금이 0이면 0 */
export function returnsOf(r: AssetTrendPoint): Returns {
  const f = (v: number, p: number) => (p > 0 ? (v / p - 1) * 100 : 0);
  return { tqqq: f(r.tqqqValueUsd, r.tqqqPrincipalUsd), soxl: f(r.soxlValueUsd, r.soxlPrincipalUsd), all: f(r.stockUsd, r.principalUsd) };
}

/** 같은 기간 환율 변화가 현재 보유(달러)의 원화 평가금에 준 영향 = 끝 평가금(USD) × (끝 환율 − 시작 환율) */
export function fxEffectKrw(a: AssetTrendPoint, z: AssetTrendPoint): number {
  return z.stockUsd * (z.fx - a.fx);
}

export interface CompositionPart {
  key: 'tqqq' | 'soxl' | 'usd' | 'krw';
  label: string;
  krw: number;
}
export function compositionOf(z: AssetTrendPoint): { parts: CompositionPart[]; total: number } {
  const parts: CompositionPart[] = [
    { key: 'tqqq', label: 'TQQQ', krw: z.tqqqValueUsd * z.fx },
    { key: 'soxl', label: 'SOXL', krw: z.soxlValueUsd * z.fx },
    { key: 'usd', label: 'USD 예수금', krw: z.cashUsd * z.fx },
    { key: 'krw', label: 'KRW 예수금', krw: z.cashKrw },
  ];
  return { parts, total: parts.reduce((a, p) => a + p.krw, 0) };
}

export function dayChange(series: AssetTrendPoint[], i: number, ccy: Ccy): number | null {
  if (i <= 0) return null;
  return stockOf(series[i]!, ccy) - stockOf(series[i - 1]!, ccy);
}
