/** 로컬 타임존 기준 YYYY-MM-DD — toISOString()은 UTC라 KST 오전 9시 이전엔 어제 날짜가 됨 */
export function toLocalDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function todayLocal(): string {
  return toLocalDateString(new Date());
}

/** YYYY-MM-DD에 일수 가감 */
export function shiftDay(dateStr: string, delta: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return toLocalDateString(new Date(y!, m! - 1, d! + delta));
}

/** a → b 경과 일수 (b - a, 정수) */
export function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  const da = new Date(ay!, am! - 1, ad!);
  const db = new Date(by!, bm! - 1, bd!);
  return Math.round((db.getTime() - da.getTime()) / 86_400_000);
}

export function isSameMonth(a: string, b: string): boolean {
  return a.slice(0, 7) === b.slice(0, 7);
}

/** 기준일이 속한 달의 직전 달 말일 (YYYY-MM-DD) */
export function lastDayOfPrevMonth(dateStr: string): string {
  const [y, m] = dateStr.split('-').map(Number);
  return toLocalDateString(new Date(y!, m! - 1, 0));
}

/** YYYY-MM에 개월 수 가감 → YYYY-MM */
export function shiftMonth(ym: string, delta: number): string {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y!, m! - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
