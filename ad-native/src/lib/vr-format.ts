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
