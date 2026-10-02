'use no memo';
import type { ReactElement } from 'react';
import { getWidgetInfo, requestWidgetUpdate, requestWidgetUpdateById, type WidgetInfo, type WidgetTaskHandlerProps } from 'react-native-android-widget';
import { AssetDiaryWidget } from './AssetDiaryWidget';
import { LaofusWidget } from './LaofusWidget';
import { VrWidget } from './VrWidget';
import { WorklogWidget } from './WorklogWidget';
import { LedgerWidget } from './LedgerWidget';
import type { WidgetViewProps } from './components';
import { fetchAssetData, fetchLaofusData, fetchLedgerData, fetchVrData, fetchWorklogData, readCache, writeCache } from './data';
import { DARK, LIGHT } from './palette';
import { applyMonthAction, clampOffset, getLedgerDay, getSharedOffset, setLedgerDay, setSharedOffset } from './month-state';

type Size = { width: number; height: number };
type Rendered = ReactElement | { light: ReactElement; dark: ReactElement | null };

interface WidgetDef<T> {
  fetch: (monthOffset: number) => Promise<T>;
  View: (props: WidgetViewProps<T>) => ReactElement;
  /** 월 이동을 지원하는 위젯의 이동 가능 범위 (이번 달 기준 상대 개월 수) */
  months?: { min: number; max: number };
}

const DEFS: Record<string, WidgetDef<any>> = {
  AssetDiaryWidget: { fetch: fetchAssetData, View: AssetDiaryWidget, months: { min: -24, max: 0 } },
  LedgerWidget: { fetch: fetchLedgerData, View: LedgerWidget, months: { min: -24, max: 0 } },
  LaofusWidget: { fetch: fetchLaofusData, View: LaofusWidget },
  VrWidget: { fetch: fetchVrData, View: VrWidget },
  WorklogWidget: { fetch: fetchWorklogData, View: WorklogWidget, months: { min: -24, max: 2 } },
};

export const WIDGET_NAMES = Object.keys(DEFS);

function errorCode(e: unknown): string {
  if (e instanceof Error && e.message === 'NO_AUTH') return 'NO_AUTH';
  return e instanceof Error ? e.message || 'ERROR' : 'ERROR';
}

type State = { data: unknown; at: number | null; stale: boolean; error: string | null; monthOffset: number; ui?: { selectedDate: string | null } };

function view(name: string, size: Size, state: State): Rendered {
  const { View } = DEFS[name]!;
  const mk = (p: typeof LIGHT) => <View p={p} size={size} {...state} />;
  return { light: mk(LIGHT), dark: mk(DARK) };
}

/** 데이터 모양이 어긋나 위젯 트리 생성이 터져도(예: 옛 캐시) 빈 위젯 대신 안내 문구를 그린다 */
async function safeDraw(name: string, size: Size, state: State, draw: (w: Rendered) => void | Promise<void>): Promise<void> {
  try {
    await draw(view(name, size, state));
  } catch {
    await draw(view(name, size, { data: null, at: state.at, stale: false, error: 'ERROR', monthOffset: state.monthOffset, ui: state.ui }));
  }
}

/** 이전 값이 있으면 먼저 그려 빈 화면을 피하고, 새로 조회한 값으로 다시 그린다 (월 이동 위젯은 보는 달별로 캐시) */
async function renderWidget(name: string, widgetId: number, size: Size, draw: (w: Rendered) => void | Promise<void>): Promise<void> {
  const def = DEFS[name];
  if (!def) return;

  const monthOffset = def.months ? clampOffset(await getSharedOffset(), def.months) : 0;
  const ui = name === 'LedgerWidget' ? { selectedDate: await getLedgerDay() } : undefined;
  const cacheName = `${name}_${monthOffset}`;
  const cached = await readCache<unknown>(cacheName);
  await safeDraw(name, size, { data: cached?.data ?? null, at: cached?.at ?? null, stale: false, error: null, monthOffset, ui }, draw);

  try {
    const data = await def.fetch(monthOffset);
    const at = Date.now();
    await writeCache(cacheName, data);
    await safeDraw(name, size, { data, at, stale: false, error: null, monthOffset, ui }, draw);
  } catch (e) {
    await safeDraw(name, size, { data: cached?.data ?? null, at: cached?.at ?? null, stale: !!cached, error: errorCode(e), monthOffset, ui }, draw);
  }
}

/** 월 이동을 공유하는 다른 위젯들을 새 달로 다시 그린다 (눌린 위젯 자신은 호출한 쪽이 그린다) */
async function refreshMonthSiblings(exceptWidgetId: number): Promise<void> {
  for (const name of WIDGET_NAMES) {
    if (!DEFS[name]!.months) continue;
    const infos: WidgetInfo[] = await getWidgetInfo(name).catch(() => []);
    for (const info of infos) {
      if (info.widgetId === exceptWidgetId) continue;
      await renderWidget(name, info.widgetId, { width: info.width, height: info.height }, (w) =>
        requestWidgetUpdateById({ widgetName: name, widgetId: info.widgetId, renderWidget: () => w }),
      ).catch(() => undefined);
    }
  }
}

export async function widgetTaskHandler(props: WidgetTaskHandlerProps): Promise<void> {
  const { widgetInfo, widgetAction, clickAction, clickActionData, renderWidget: draw } = props;
  if (widgetAction === 'WIDGET_DELETED') return;
  const size = { width: widgetInfo.width, height: widgetInfo.height };
  let monthChanged = false;
  if (widgetAction === 'WIDGET_CLICK') {
    const def = DEFS[widgetInfo.widgetName];
    if (clickAction?.startsWith('MONTH_') && def?.months) {
      const shown = clampOffset(await getSharedOffset(), def.months);
      await setSharedOffset(applyMonthAction(shown, clickAction, def.months));
      monthChanged = true;
    } else if (clickAction === 'LEDGER_DAY') {
      const date = typeof clickActionData?.date === 'string' ? clickActionData.date : null;
      if (date) await setLedgerDay(date);
    } else if (clickAction !== 'REFRESH') {
      return;
    }
  }
  await Promise.all([
    renderWidget(widgetInfo.widgetName, widgetInfo.widgetId, size, draw),
    monthChanged ? refreshMonthSiblings(widgetInfo.widgetId) : Promise.resolve(),
  ]);
}

let lastRefreshAt = 0;

/** 앱이 포그라운드로 돌아올 때 홈 화면에 올려둔 위젯을 최신 값으로 갱신 (1분 이내 중복 호출은 무시) */
export async function refreshAllWidgets(force = false): Promise<void> {
  const now = Date.now();
  if (!force && now - lastRefreshAt < 60_000) return;
  lastRefreshAt = now;
  await Promise.all(
    WIDGET_NAMES.map((name) =>
      requestWidgetUpdate({
        widgetName: name,
        renderWidget: async (info) => {
          let out: Rendered | null = null;
          await renderWidget(name, info.widgetId, { width: info.width, height: info.height }, (w) => {
            out = w;
          });
          return out ?? view(name, { width: info.width, height: info.height }, { data: null, at: null, stale: false, error: 'ERROR', monthOffset: 0 });
        },
      }).catch(() => undefined),
    ),
  );
}
