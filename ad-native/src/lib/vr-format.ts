import type { VrCalcSource, VrNextV, VrVCalc } from '../api/vr';
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

export const V_FORMULA_BASIC = 'V₂ = V₁ + Pool ÷ G + 적립금';
export const V_FORMULA_SKILL = 'V₂ = V₁ + Pool ÷ G + (E − V₁) ÷ 2√G + 적립금';

/** 대입식 — 평가금(E)이 있으면 실력공식. 입력이 없으면 null */
export function vCalcSubstitution(c: VrVCalc): string | null {
  if (c.prevV == null || c.poolInput == null || c.g == null) return null;
  const dep = plain(c.deposit, c.deposit % 1 === 0 ? 0 : 2);
  const total = plain(c.recomputed ?? c.result);
  if (c.formula === 'SKILL' && c.evaluation != null) {
    return `${plain(c.prevV)} + ${plain(c.poolInput)} ÷ ${c.g} + (${plain(c.evaluation)} − ${plain(c.prevV)}) ÷ 2√${c.g} + ${dep} = ${total}`;
  }
  return `${plain(c.prevV)} + ${plain(c.poolInput)} ÷ ${c.g} + ${dep} = ${total}`;
}

/** 다음 갱신 예정 대입식 (진행 중 사이클용) */
export function nextVSubstitution(n: VrNextV): string {
  const dep = plain(n.deposit, n.deposit % 1 === 0 ? 0 : 2);
  return `${plain(n.v1)} + ${plain(n.pool)} ÷ ${n.g} + (${plain(n.evaluation)} − ${plain(n.v1)}) ÷ 2√${n.g} + ${dep} = ${plain(n.v2)}`;
}

/** E를 어떻게 구했는지 한 줄 설명 */
export function evaluationNote(n: VrNextV): string {
  if (n.eSource === 'MANUAL') return `E = 직접 입력한 평가금 ${usd(n.evaluation)}`;
  const src = n.priceSource === 'CLOSE' && n.priceDate ? `${md(n.priceDate)} 종가` : '현재가';
  return `E = 보유 ${n.quantity}주 × ${usd(n.price ?? 0)} (${src}) = ${usd(n.evaluation)}`;
}
