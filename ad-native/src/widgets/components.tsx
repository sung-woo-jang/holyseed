'use no memo';
import type { ReactNode } from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { Hex, Palette } from './palette';
import { hhmm } from './format';

export interface WidgetViewProps<T> {
  p: Palette;
  data: T | null;
  /** 마지막 성공 시각 (ms) */
  at: number | null;
  /** 최신 조회가 실패해 이전 값을 보여주는 중 */
  stale: boolean;
  error: string | null;
  size: { width: number; height: number };
}

export const WIDGET_URI = {
  asset: 'adnative://widget/asset',
  laofus: 'adnative://widget/laofus',
  vr: 'adnative://widget/vr',
  worklog: 'adnative://widget/worklog',
  worklogAdd: 'adnative://widget/worklog-add',
} as const;

export function Frame({
  p,
  title,
  link,
  at,
  stale,
  children,
}: {
  p: Palette;
  title: string;
  link: string;
  at: number | null;
  stale: boolean;
  children: ReactNode;
}) {
  const stamp = at ? `${stale ? '오래됨 ' : ''}${hhmm(at)}` : '';
  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: link }}
      style={{
        width: 'match_parent',
        height: 'match_parent',
        flexDirection: 'column',
        backgroundColor: p.bg,
        borderRadius: 22,
        padding: 14,
      }}
    >
      <FlexWidget style={{ width: 'match_parent', flexDirection: 'row', alignItems: 'center' }}>
        <FlexWidget style={{ flex: 1 }}>
          <TextWidget text={title} style={{ fontSize: 12, fontWeight: '600', color: p.muted }} />
        </FlexWidget>
        <TextWidget
          text={`${stamp} ↻`}
          clickAction="REFRESH"
          style={{ fontSize: 11, color: (stale ? p.danger : p.muted), paddingLeft: 12, paddingVertical: 2 }}
        />
      </FlexWidget>
      {children}
    </FlexWidget>
  );
}

/** 위젯 트리 빌더는 Fragment/배열 반환을 지원하지 않아 여러 자식은 항상 이 컨테이너로 감싼다 */
export function Column({ children }: { children?: ReactNode }) {
  return <FlexWidget style={{ width: 'match_parent', flexDirection: 'column' }}>{children}</FlexWidget>;
}

export function Big({ p, text, color }: { p: Palette; text: string; color?: Hex }) {
  return <TextWidget text={text} truncate="END" maxLines={1} style={{ fontSize: 24, fontWeight: '700', color: (color ?? p.text), marginTop: 4 }} />;
}

export function Sub({ p, text, color }: { p: Palette; text: string; color?: Hex }) {
  return <TextWidget text={text} truncate="END" maxLines={1} style={{ fontSize: 12, fontWeight: '500', color: (color ?? p.muted), marginTop: 1 }} />;
}

export function Metric({ p, label, value, color }: { p: Palette; label: string; value: string; color?: Hex }) {
  return (
    <FlexWidget style={{ flex: 1, flexDirection: 'column' }}>
      <TextWidget text={label} maxLines={1} style={{ fontSize: 10.5, color: p.muted }} />
      <TextWidget text={value} truncate="END" maxLines={1} style={{ fontSize: 13, fontWeight: '700', color: (color ?? p.text) }} />
    </FlexWidget>
  );
}

export function MetricRow({ p, children }: { p: Palette; children: ReactNode }) {
  return (
    <FlexWidget
      style={{
        width: 'match_parent',
        flexDirection: 'row',
        backgroundColor: p.surface,
        borderRadius: 12,
        paddingVertical: 8,
        paddingHorizontal: 10,
        marginTop: 8,
      }}
    >
      {children}
    </FlexWidget>
  );
}

export function Message({ p, text }: { p: Palette; text: string }) {
  return (
    <FlexWidget style={{ width: 'match_parent', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <TextWidget text={text} style={{ fontSize: 13, color: p.muted, textAlign: 'center' }} />
    </FlexWidget>
  );
}

/** 값이 아직 없을 때(첫 조회 중/오류) 공통 본문 */
export function emptyBody<T>(p: Palette, props: WidgetViewProps<T>): ReactNode | null {
  if (props.data) return null;
  if (props.error === 'NO_AUTH') return <Message p={p} text="앱에서 로그인해 주세요" />;
  if (props.error) return <Message p={p} text="불러오지 못했어요 · 우측 상단 ↻ 로 다시 시도" />;
  return <Message p={p} text="불러오는 중…" />;
}

export function tone(p: Palette, v: number | null | undefined): Hex {
  if (v === null || v === undefined) return p.text;
  return v >= 0 ? p.brand : p.danger;
}
