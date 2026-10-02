'use no memo';
import type { ReactElement, ReactNode } from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { Hex, Palette } from './palette';
import { hhmm } from './format';
import { SvgWidget } from 'react-native-android-widget';

export interface WidgetViewProps<T> {
  p: Palette;
  data: T | null;
  /** 마지막 성공 시각 (ms) */
  at: number | null;
  /** 최신 조회가 실패해 이전 값을 보여주는 중 */
  stale: boolean;
  error: string | null;
  size: { width: number; height: number };
  /** 월 이동 위젯에서 보고 있는 달 (0=이번 달) */
  monthOffset: number;
  /** 위젯 안에서만 쓰는 화면 상태 (거래장부: 달력에서 고른 날짜) */
  ui?: { selectedDate: string | null };
}

export const WIDGET_URI = {
  asset: 'adnative://widget/asset',
  laofus: 'adnative://widget/laofus',
  vr: 'adnative://widget/vr',
  worklog: 'adnative://widget/worklog',
  worklogAdd: 'adnative://widget/worklog-add',
  ledger: 'adnative://widget/ledger',
  ledgerAdd: 'adnative://widget/ledger-add',
} as const;

const BTN = 40;
const HEAD_H = 42;

/** 손가락으로 누르기 쉽게 박스 전체(40×48dp)를 터치 영역으로 쓰는 ‹ › 버튼 */
function NavButton({ p, text, action }: { p: Palette; text: string; action?: string }) {
  return (
    <FlexWidget clickAction={action} style={{ width: 48, height: BTN, alignItems: 'center', justifyContent: 'center' }}>
      <TextWidget text={text} style={{ fontSize: 24, fontWeight: '700', color: action ? p.text : p.muted }} />
    </FlexWidget>
  );
}

export interface MonthNav {
  label: string;
  canPrev: boolean;
  canNext: boolean;
  isCurrent: boolean;
}

export function Frame({
  p,
  title,
  link,
  at,
  stale,
  nav,
  children,
}: {
  p: Palette;
  title: string;
  link: string;
  at: number | null;
  stale: boolean;
  nav?: MonthNav;
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
        padding: PAD,
      }}
    >
      <FlexWidget style={{ width: 'match_parent', height: HEAD_H, flexDirection: 'row', alignItems: 'center' }}>
        <FlexWidget style={{ flex: 1 }}>
          <TextWidget text={title} truncate="END" maxLines={1} style={{ fontSize: 12, fontWeight: '600', color: p.muted }} />
        </FlexWidget>
        {nav && (
          <FlexWidget style={{ height: BTN, flexDirection: 'row', alignItems: 'center', backgroundColor: p.surface, borderRadius: BTN / 2, marginRight: 6 }}>
            <NavButton p={p} text="‹" action={nav.canPrev ? 'MONTH_PREV' : undefined} />
            <FlexWidget
              clickAction={nav.isCurrent ? undefined : 'MONTH_NOW'}
              style={{ height: BTN, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center' }}
            >
              <TextWidget text={nav.label} style={{ fontSize: 13, fontWeight: '700', color: nav.isCurrent ? p.text : p.brand }} />
            </FlexWidget>
            <NavButton p={p} text="›" action={nav.canNext ? 'MONTH_NEXT' : undefined} />
          </FlexWidget>
        )}
        <FlexWidget
          clickAction="REFRESH"
          style={{ height: BTN, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
        >
          {stamp !== '' && <TextWidget text={stamp} style={{ fontSize: 10.5, color: stale ? p.danger : p.muted, paddingRight: 4 }} />}
          <TextWidget text="↻" style={{ fontSize: 17, fontWeight: '700', color: stale ? p.danger : p.muted }} />
        </FlexWidget>
      </FlexWidget>
      {children}
    </FlexWidget>
  );
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

// ─── 크기에 맞춰 정보를 채우는 레이아웃 도우미 ─────────────────────────────────────────

export interface Section {
  key: string;
  /** 위쪽 간격 포함 예상 높이(dp) — grow 구역은 최소 줄 수일 때의 높이 */
  h: number;
  /** 작은 위젯에서 먼저 버려지는 순서 — 클수록 먼저 빠짐 */
  prio: number;
  el: ReactElement;
  /** 남는 높이를 줄 수로 채울 수 있는 목록 구역 */
  grow?: { min: number; max: number; rowH: number; make: (rows: number) => ReactElement };
}

export const HEADER_H = 42;
export const PAD = 14;

/** 위젯 실제 크기(dp). 런처가 값을 주지 않으면(0) 5x4 기준 값으로 가정 */
export function metrics(size: { width: number; height: number }) {
  const width = size.width >= 120 ? size.width : 330;
  const height = size.height >= 80 ? size.height : 290;
  return { width, height, inner: width - PAD * 2, avail: height - PAD * 2 - HEADER_H };
}

export function totalH(list: Section[]): number {
  return list.reduce((a, s) => a + s.h, 0);
}

/** 높이가 모자라면 우선순위가 낮은 구역부터 뺀다 (표시 순서는 유지) */
export function pack(sections: Section[], avail: number): Section[] {
  const list = [...sections];
  while (list.length > 1 && totalH(list) > avail) {
    let drop = 0;
    list.forEach((s, i) => {
      if (s.prio >= list[drop]!.prio) drop = i;
    });
    list.splice(drop, 1);
  }
  return list;
}

/** 구역들을 높이에 맞춰 고르고, 남는 높이는 grow 목록의 줄 수로 채운다 */
export function layout(avail: number, sections: Section[]): ReactElement[] {
  const kept = pack(sections, avail);
  let left = avail - totalH(kept);
  return kept.map((s) => {
    if (!s.grow) return s.el;
    const extra = Math.max(0, Math.min(s.grow.max - s.grow.min, Math.floor(left / s.grow.rowH)));
    left -= extra * s.grow.rowH;
    return extra > 0 ? s.grow.make(s.grow.min + extra) : s.el;
  });
}

/** 남은 높이에 들어갈 목록 줄 수 (제목 한 줄 포함 계산) */
export function rowsFit(leftover: number, rowH: number, headH = 20): number {
  return Math.max(0, Math.floor((leftover - headH) / rowH));
}

export const ROW_H = 17;

export function Body({ children }: { children?: ReactNode }) {
  return <FlexWidget style={{ width: 'match_parent', flexDirection: 'column' }}>{children}</FlexWidget>;
}

/** 값 타일 한 줄 (회색 판 안에 N칸) */
export function Tiles({
  p,
  items,
  top = 6,
}: {
  p: Palette;
  items: { label: string; value: string; color?: Hex; sub?: string; subColor?: Hex }[];
  top?: number;
}) {
  return (
    <FlexWidget
      style={{
        width: 'match_parent',
        flexDirection: 'row',
        backgroundColor: p.surface,
        borderRadius: 12,
        paddingVertical: 6,
        paddingHorizontal: 10,
        marginTop: top,
      }}
    >
      {items.map((it, i) => (
        <FlexWidget key={i} style={{ flex: 1, flexDirection: 'column' }}>
          <TextWidget text={it.label} maxLines={1} style={{ fontSize: 10, color: p.muted }} />
          <TextWidget text={it.value} truncate="END" maxLines={1} style={{ fontSize: 13, fontWeight: '700', color: it.color ?? p.text }} />
          {it.sub !== undefined && <TextWidget text={it.sub} truncate="END" maxLines={1} style={{ fontSize: 10, color: it.subColor ?? p.muted }} />}
        </FlexWidget>
      ))}
    </FlexWidget>
  );
}

/** 가로 막대 — parts의 flex 비율대로 칠한다 (0 이하는 건너뜀) */
export function StackBar({ p, parts, height = 8, top = 6 }: { p: Palette; parts: { weight: number; color: Hex }[]; height?: number; top?: number }) {
  const used = parts.filter((x) => x.weight > 0);
  return (
    <FlexWidget style={{ width: 'match_parent', height, flexDirection: 'row', backgroundColor: p.surface, borderRadius: height / 2, marginTop: top, overflow: 'hidden' }}>
      {used.map((x, i) => (
        <FlexWidget key={i} style={{ flex: x.weight, height, backgroundColor: x.color }} />
      ))}
    </FlexWidget>
  );
}

/** 왼쪽 라벨 + 오른쪽 값 한 줄 */
export function LineRow({
  p,
  left,
  right,
  rightColor,
  leftColor,
}: {
  p: Palette;
  left: string;
  right: string;
  rightColor?: Hex;
  leftColor?: Hex;
}) {
  return (
    <FlexWidget style={{ width: 'match_parent', flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
      <FlexWidget style={{ flex: 1 }}>
        <TextWidget text={left} truncate="END" maxLines={1} style={{ fontSize: 11, color: leftColor ?? p.text }} />
      </FlexWidget>
      <TextWidget text={right} maxLines={1} style={{ fontSize: 11, fontWeight: '600', color: rightColor ?? p.text, paddingLeft: 8 }} />
    </FlexWidget>
  );
}

export function ListTitle({ p, text, right }: { p: Palette; text: string; right?: string }) {
  return (
    <FlexWidget style={{ width: 'match_parent', flexDirection: 'row', alignItems: 'center', marginTop: 7 }}>
      <FlexWidget style={{ flex: 1 }}>
        <TextWidget text={text} maxLines={1} style={{ fontSize: 10.5, fontWeight: '600', color: p.muted }} />
      </FlexWidget>
      {right !== undefined && <TextWidget text={right} maxLines={1} style={{ fontSize: 10.5, color: p.muted }} />}
    </FlexWidget>
  );
}

export interface SparkSeries {
  values: number[];
  color: Hex;
  dashed?: boolean;
  fill?: boolean;
  width?: number;
}

/** 간단한 추이선 — 시리즈들을 같은 눈금에 그리고 마지막 점을 강조 (SVG 문자열 → SvgWidget) */
export function Spark({
  p,
  width,
  height,
  series,
  hlines = [],
  top = 6,
}: {
  p: Palette;
  width: number;
  height: number;
  series: SparkSeries[];
  hlines?: { value: number; color: Hex; dashed?: boolean }[];
  top?: number;
}) {
  const W = Math.round(width);
  const H = height;
  const all = [...series.flatMap((s) => s.values), ...hlines.map((h) => h.value)].filter((v) => Number.isFinite(v));
  if (all.length < 2 || series.every((s) => s.values.length < 2)) return <FlexWidget style={{ height: 1 }} />;
  const lo = Math.min(...all);
  const hi = Math.max(...all);
  const pad = (hi - lo || Math.abs(hi) || 1) * 0.08;
  const min = lo - pad;
  const max = hi + pad;
  const y = (v: number) => (H - 3 - ((v - min) / (max - min)) * (H - 6)).toFixed(1);
  const x = (i: number, n: number) => (3 + (i / (n - 1)) * (W - 6)).toFixed(1);

  let body = '';
  for (const h of hlines) {
    body += `<line x1="0" y1="${y(h.value)}" x2="${W}" y2="${y(h.value)}" stroke="${h.color}" stroke-width="1" ${h.dashed ? 'stroke-dasharray="3,3"' : ''}/>`;
  }
  for (const s of series) {
    const n = s.values.length;
    if (n < 2) continue;
    const pts = s.values.map((v, i) => `${x(i, n)},${y(v)}`).join(' ');
    if (s.fill) body += `<polygon points="${pts} ${x(n - 1, n)},${H} ${x(0, n)},${H}" fill="${s.color}" fill-opacity="0.14"/>`;
    body += `<polyline points="${pts}" fill="none" stroke="${s.color}" stroke-width="${s.width ?? 2}" stroke-linejoin="round" stroke-linecap="round" ${s.dashed ? 'stroke-dasharray="4,3"' : ''}/>`;
    body += `<circle cx="${x(n - 1, n)}" cy="${y(s.values[n - 1]!)}" r="3" fill="${s.color}"/>`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${body}</svg>`;
  return <SvgWidget svg={svg} style={{ width: W, height: H, marginTop: top }} />;
}

/** 추이선 아래 범례 — 선 모양(실선/점선)과 색, 이름, 마지막 값을 한 줄로 */
export function SparkLegend({
  p,
  items,
  right,
  rightColor,
}: {
  p: Palette;
  items: { label: string; color: Hex; dashed?: boolean }[];
  right?: string;
  rightColor?: Hex;
}) {
  return (
    <FlexWidget style={{ width: 'match_parent', flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
      {items.map((it, i) => (
        <FlexWidget key={i} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10 }}>
          {it.dashed ? (
            <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', marginRight: 4 }}>
              <FlexWidget style={{ width: 4, height: 2.5, backgroundColor: it.color }} />
              <FlexWidget style={{ width: 2, height: 2.5 }} />
              <FlexWidget style={{ width: 4, height: 2.5, backgroundColor: it.color }} />
              <FlexWidget style={{ width: 2, height: 2.5 }} />
              <FlexWidget style={{ width: 4, height: 2.5, backgroundColor: it.color }} />
            </FlexWidget>
          ) : (
            <FlexWidget style={{ width: 16, height: 2.5, backgroundColor: it.color, marginRight: 4, borderRadius: 1 }} />
          )}
          <TextWidget text={it.label} maxLines={1} style={{ fontSize: 10, color: p.muted }} />
        </FlexWidget>
      ))}
      <FlexWidget style={{ flex: 1 }} />
      {right !== undefined && <TextWidget text={right} maxLines={1} style={{ fontSize: 10.5, fontWeight: '700', color: rightColor ?? p.text }} />}
    </FlexWidget>
  );
}
