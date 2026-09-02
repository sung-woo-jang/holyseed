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

/** 'HH:mm' → 오늘 날짜의 그 시각을 갖는 Date (시간 피커 value용) */
export function timeStringToDate(time: string): Date {
  const [h, m] = time.split(':').map(Number);
  const d = new Date();
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}

/** Date → 'HH:mm' */
export function dateToTimeString(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
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

/** '이번달'|'올해'|'작년'|'3년'|'전체' → {from, to} (YYYY-MM-DD, 문자열 사전식 비교용 경계값 — 존재하지 않는 날짜(예: 4월 31일)를 상한으로 써도 비교엔 안전함) */
export function periodToRange(
  period: '이번달' | '올해' | '작년' | '3년' | '전체',
  base: Date = new Date(),
): { from?: string; to?: string } {
  const y = base.getFullYear();
  const m = String(base.getMonth() + 1).padStart(2, '0');
  switch (period) {
    case '이번달':
      return { from: `${y}-${m}-01`, to: `${y}-${m}-31` };
    case '올해':
      return { from: `${y}-01-01`, to: `${y}-12-31` };
    case '작년':
      return { from: `${y - 1}-01-01`, to: `${y - 1}-12-31` };
    case '3년':
      return { from: `${y - 2}-01-01`, to: `${y}-12-31` };
    default:
      return {};
  }
}
