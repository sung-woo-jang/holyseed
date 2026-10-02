import * as SecureStore from 'expo-secure-store';

// 위젯 인스턴스(widgetId)마다 "몇 달 전/후를 보는 중인지"를 기억한다. 오래 두면 이번 달로 자동 복귀.
const TTL_MS = 20 * 60 * 1000;
const key = (widgetId: number) => `widget_month_${widgetId}`;

export async function getMonthOffset(widgetId: number): Promise<number> {
  try {
    const raw = await SecureStore.getItemAsync(key(widgetId));
    if (!raw) return 0;
    const v = JSON.parse(raw) as { offset: number; at: number };
    return Date.now() - v.at < TTL_MS ? v.offset : 0;
  } catch {
    return 0;
  }
}

export async function setMonthOffset(widgetId: number, offset: number): Promise<void> {
  try {
    await SecureStore.setItemAsync(key(widgetId), JSON.stringify({ offset, at: Date.now() }));
  } catch {
    // 저장 실패 시 이번 달로 보임
  }
}

export type MonthAction = 'MONTH_PREV' | 'MONTH_NEXT' | 'MONTH_NOW';

export function applyMonthAction(current: number, action: string, range: { min: number; max: number }): number {
  const next = action === 'MONTH_PREV' ? current - 1 : action === 'MONTH_NEXT' ? current + 1 : action === 'MONTH_NOW' ? 0 : current;
  return Math.max(range.min, Math.min(range.max, next));
}
