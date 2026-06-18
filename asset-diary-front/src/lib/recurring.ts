/**
 * 변동형 정기 항목이 "이번 달 금액 입력"이 필요한지 판정.
 *
 * 조건(모두 충족):
 * 1. 변동형(isVariable)
 * 2. 활성(active)
 * 3. 결제일 도래: 오늘 일자 >= min(dayOfMonth, 이번달 말일)
 * 4. 이번 달 미입력: lastRunDate가 null이거나 YYYY-MM이 현재 월과 다름
 *
 * lastRunDate는 'YYYY-MM-DD' date 컬럼이므로 문자열 슬라이스로 비교(타임존 드리프트 회피).
 */
export function recurringNeedsInput(r: {
  isVariable?: boolean;
  active: boolean;
  dayOfMonth: number;
  lastRunDate?: string | null;
}): boolean {
  if (!r.isVariable || !r.active) return false;
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dueDay = Math.min(r.dayOfMonth, lastDay);
  const dueArrived = now.getDate() >= dueDay;
  const recordedThisMonth = !!r.lastRunDate && r.lastRunDate.slice(0, 7) === ym;
  return dueArrived && !recordedThisMonth;
}
