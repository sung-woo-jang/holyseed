import * as SecureStore from 'expo-secure-store';

// 자산일기·근무일지 위젯이 "보고 있는 달"을 하나로 공유한다(위젯끼리만 — 앱 화면의 월 상태와는 무관).
// 오래 두면 이번 달로 자동 복귀.
const TTL_MS = 20 * 60 * 1000;
const KEY = 'widget_month_shared';

export interface MonthRange {
  min: number;
  max: number;
}

/** 공유 저장값(원본). 위젯마다 갈 수 있는 범위가 달라 실제로 보이는 값은 clampOffset으로 구한다 */
export async function getSharedOffset(): Promise<number> {
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    if (!raw) return 0;
    const v = JSON.parse(raw) as { offset: number; at: number };
    return Date.now() - v.at < TTL_MS ? v.offset : 0;
  } catch {
    return 0;
  }
}

export async function setSharedOffset(offset: number): Promise<void> {
  try {
    await SecureStore.setItemAsync(KEY, JSON.stringify({ offset, at: Date.now() }));
  } catch {
    // 저장 실패 시 이번 달로 보임
  }
}

export function clampOffset(offset: number, range: MonthRange): number {
  return Math.max(range.min, Math.min(range.max, offset));
}

/** 눌린 위젯이 "화면에 보이는 달" 기준으로 이동한 새 값 — 갈 수 없는 달에 멈춰 있어도 탭이 먹통이 되지 않게 */
export function applyMonthAction(shown: number, action: string, range: MonthRange): number {
  const next = action === 'MONTH_PREV' ? shown - 1 : action === 'MONTH_NEXT' ? shown + 1 : action === 'MONTH_NOW' ? 0 : shown;
  return clampOffset(next, range);
}

// 거래장부 위젯에서 달력의 어느 날을 골랐는지 (선택은 위젯 안에서만 의미 있음, 20분 뒤 해제)
const DAY_KEY = 'widget_ledger_day';

export async function getLedgerDay(): Promise<string | null> {
  try {
    const raw = await SecureStore.getItemAsync(DAY_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as { date: string; at: number };
    return Date.now() - v.at < TTL_MS ? v.date : null;
  } catch {
    return null;
  }
}

export async function setLedgerDay(date: string | null): Promise<void> {
  try {
    await SecureStore.setItemAsync(DAY_KEY, JSON.stringify({ date, at: Date.now() }));
  } catch {
    // 저장 실패 시 기본 날짜로 보임
  }
}
