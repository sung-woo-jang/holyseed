'use no memo';
import type { ReactElement } from 'react';
import { requestWidgetUpdate, type WidgetTaskHandlerProps } from 'react-native-android-widget';
import { AssetDiaryWidget } from './AssetDiaryWidget';
import { LaofusWidget } from './LaofusWidget';
import { VrWidget } from './VrWidget';
import { WorklogWidget } from './WorklogWidget';
import type { WidgetViewProps } from './components';
import { fetchAssetData, fetchLaofusData, fetchVrData, fetchWorklogData, readCache, writeCache } from './data';
import { DARK, LIGHT } from './palette';

type Size = { width: number; height: number };
type Rendered = ReactElement | { light: ReactElement; dark: ReactElement | null };

interface WidgetDef<T> {
  fetch: () => Promise<T>;
  View: (props: WidgetViewProps<T>) => ReactElement;
}

const DEFS: Record<string, WidgetDef<any>> = {
  AssetDiaryWidget: { fetch: fetchAssetData, View: AssetDiaryWidget },
  LaofusWidget: { fetch: fetchLaofusData, View: LaofusWidget },
  VrWidget: { fetch: fetchVrData, View: VrWidget },
  WorklogWidget: { fetch: fetchWorklogData, View: WorklogWidget },
};

export const WIDGET_NAMES = Object.keys(DEFS);

function errorCode(e: unknown): string {
  if (e instanceof Error && e.message === 'NO_AUTH') return 'NO_AUTH';
  return e instanceof Error ? e.message || 'ERROR' : 'ERROR';
}

function view(name: string, size: Size, state: { data: unknown; at: number | null; stale: boolean; error: string | null }): Rendered {
  const { View } = DEFS[name]!;
  const mk = (p: typeof LIGHT) => <View p={p} size={size} {...state} />;
  return { light: mk(LIGHT), dark: mk(DARK) };
}

type State = { data: unknown; at: number | null; stale: boolean; error: string | null };

/** 데이터 모양이 어긋나 위젯 트리 생성이 터져도(예: 옛 캐시) 빈 위젯 대신 안내 문구를 그린다 */
async function safeDraw(name: string, size: Size, state: State, draw: (w: Rendered) => void | Promise<void>): Promise<void> {
  try {
    await draw(view(name, size, state));
  } catch {
    await draw(view(name, size, { data: null, at: state.at, stale: false, error: 'ERROR' }));
  }
}

/** 이전 값이 있으면 먼저 그려 빈 화면을 피하고, 새로 조회한 값으로 다시 그린다 */
async function renderWidget(name: string, size: Size, draw: (w: Rendered) => void | Promise<void>): Promise<void> {
  const def = DEFS[name];
  if (!def) return;

  const cached = await readCache<unknown>(name);
  await safeDraw(name, size, { data: cached?.data ?? null, at: cached?.at ?? null, stale: false, error: null }, draw);

  try {
    const data = await def.fetch();
    const at = Date.now();
    await writeCache(name, data);
    await safeDraw(name, size, { data, at, stale: false, error: null }, draw);
  } catch (e) {
    await safeDraw(name, size, { data: cached?.data ?? null, at: cached?.at ?? null, stale: !!cached, error: errorCode(e) }, draw);
  }
}

export async function widgetTaskHandler(props: WidgetTaskHandlerProps): Promise<void> {
  const { widgetInfo, widgetAction, clickAction, renderWidget: draw } = props;
  if (widgetAction === 'WIDGET_DELETED') return;
  if (widgetAction === 'WIDGET_CLICK' && clickAction !== 'REFRESH') return;
  await renderWidget(widgetInfo.widgetName, { width: widgetInfo.width, height: widgetInfo.height }, draw);
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
          await renderWidget(name, { width: info.width, height: info.height }, (w) => {
            out = w;
          });
          return out ?? view(name, { width: info.width, height: info.height }, { data: null, at: null, stale: false, error: 'ERROR' });
        },
      }).catch(() => undefined),
    ),
  );
}
