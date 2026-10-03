import type { VrCalcSource, VrVCalc } from '../api/vr';
import type { BandState } from './vr-trend';

export function usd(v: number, d = 2): string {
  return `${v < 0 ? '−' : ''}$${Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })}`;
}

export function pct(v: number, d = 1): string {
  return `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(d)}%`;
}

export function md(s: string): string {
  return `${+s.slice(5, 7)}/${+s.slice(8, 10)}`;
}

export const BAND_STATE_LABEL: Record<BandState, string> = { below: '밴드 아래', inside: '밴드 안', above: '밴드 위' };

export const V_SOURCE_LABEL: Record<VrCalcSource, string> = { ROLLOVER: '자동 갱신', MANUAL: '직접 입력', BACKFILL: '역산(추정)' };

function plain(v: number, d = 2): string {
  return v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}

/** `1,322.96 + 3,941.74 ÷ 10 + 200 = 1,917.13` — 대입식. 입력이 없으면 null */
export function vCalcSubstitution(c: VrVCalc): string | null {
  if (c.prevV == null || c.poolInput == null || c.g == null) return null;
  return `${plain(c.prevV)} + ${plain(c.poolInput)} ÷ ${c.g} + ${plain(c.deposit, c.deposit % 1 === 0 ? 0 : 2)} = ${plain(c.recomputed ?? c.result)}`;
}

/** 다음 갱신 예정 대입식 (진행 중 사이클용) */
export function nextVSubstitution(v: number, pool: number, g: number, deposit: number, result: number | null): string {
  return `${plain(v)} + ${plain(pool)} ÷ ${g} + ${plain(deposit, deposit % 1 === 0 ? 0 : 2)} = ${result != null ? plain(result) : '—'}`;
}
