/**
 * V 갱신(사이클 롤오버) 공식 및 사이클 날짜 계산 — 순수함수.
 * packages/vr-core/src/rollover.ts와 동일 로직의 백엔드 사본.
 */

const round2 = (n: number) => Math.round(n * 100) / 100;

/** V₂ = V₁ + Pool/G + 적립금(인출금은 음수) */
export function computeV2(v1: number, pool: number, gFactor: number, deposit: number): number {
  return round2(v1 + pool / gFactor + deposit);
}

/** 주어진 날짜(YYYY-MM-DD) 다음 월요일 */
export function nextMonday(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  const day = d.getUTCDay();
  const add = (8 - day) % 7 || 7;
  d.setUTCDate(d.getUTCDate() + add);
  return d.toISOString().slice(0, 10);
}

/** 시작일로부터 2주차 금요일 */
export function fridayAfterTwoWeeks(startDateStr: string): string {
  const d = new Date(`${startDateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 7);
  const day = d.getUTCDay();
  const toFriday = (5 - day + 7) % 7;
  d.setUTCDate(d.getUTCDate() + toFriday);
  return d.toISOString().slice(0, 10);
}
