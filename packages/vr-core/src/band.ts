/** V값·밴드폭으로 최소/최대 밴드를 계산 — 순수함수. */

export interface VrBand {
  minBand: number
  maxBand: number
}

const round2 = (n: number) => Math.round(n * 100) / 100

export function computeBand(vValue: number, bandPct: number): VrBand {
  const ratio = bandPct / 100
  return {
    minBand: round2(vValue * (1 - ratio)),
    maxBand: round2(vValue * (1 + ratio)),
  }
}
