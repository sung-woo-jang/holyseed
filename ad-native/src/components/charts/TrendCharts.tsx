import { useRef } from 'react';
import { View, type GestureResponderEvent } from 'react-native';
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';
import type { AssetTrendPoint } from '../../api/laofus';
import { scrubLock } from '../../lib/chart-touch';
import { principalOf, returnsOf, soxlOf, tqqqOf, type Ccy } from '../../lib/laofus-trend';
import { useTheme } from '../../lib/theme';

export function trendColors(dark: boolean) {
  return {
    tqqq: dark ? '#8DB4D8' : '#1F3A52',
    soxl: dark ? '#F2A04B' : '#E8871E',
  };
}

const PAD = { l: 6, r: 46, t: 10, b: 20 };
const md = (d: string) => `${+d.slice(5, 7)}/${+d.slice(8, 10)}`;

function axisLabel(v: number, ccy: Ccy): string {
  if (ccy === 'usd') return v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${Math.round(v)}`;
  if (v >= 1e8) return `${(v / 1e8).toFixed(1)}억`;
  return `${Math.round(v / 1e4).toLocaleString('en-US')}만`;
}

/** 터치한 지점의 행 번호를 부모에 알리고(hover), 드래그 없이 눌렀다 떼면 onPick — 스크롤에 뺏기지 않게 scrubLock */
function useScrub(n: number, plotW: number, onHover: (i: number | null) => void, onPick?: (i: number) => void) {
  const st = useRef({ startX: 0, moved: false, idx: 0 });
  const idxAt = (x: number) => Math.max(0, Math.min(n - 1, Math.round(((x - PAD.l) / plotW) * (n - 1))));
  return {
    onStartShouldSetResponder: () => true,
    onMoveShouldSetResponder: () => true,
    ...scrubLock((e: GestureResponderEvent) => {
      st.current = { startX: e.nativeEvent.locationX, moved: false, idx: idxAt(e.nativeEvent.locationX) };
      onHover(st.current.idx);
    }),
    onResponderMove: (e: GestureResponderEvent) => {
      if (Math.abs(e.nativeEvent.locationX - st.current.startX) > 8) st.current.moved = true;
      st.current.idx = idxAt(e.nativeEvent.locationX);
      onHover(st.current.idx);
    },
    onResponderRelease: () => {
      onHover(null);
      if (!st.current.moved) onPick?.(st.current.idx);
    },
    onResponderTerminate: () => onHover(null),
  };
}

interface Props {
  rows: AssetTrendPoint[];
  width: number;
  height?: number;
  hover: number | null;
  onHover: (i: number | null) => void;
  onPick?: (i: number) => void;
}

/** TQQQ·SOXL 평가금을 아래·위로 쌓은 면 + 매입 원금 점선 — 영점 기준이라 쌓인 높이가 곧 주식 평가금 */
export function StackedValueChart({ rows, width, height = 170, ccy, hover, onHover, onPick }: Props & { ccy: Ccy }) {
  const theme = useTheme();
  const c = trendColors(theme.dark);
  const n = rows.length;
  const w = width - PAD.l - PAD.r;
  const h = height - PAD.t - PAD.b;
  const handlers = useScrub(n, w, onHover, onPick);
  if (n < 2) return null;

  const tq = rows.map((r) => tqqqOf(r, ccy));
  const sx = rows.map((r) => soxlOf(r, ccy));
  const pr = rows.map((r) => principalOf(r, ccy));
  const tot = tq.map((v, i) => v + sx[i]!);
  const hi = Math.max(...tot, ...pr) * 1.05 || 1;
  const X = (i: number) => PAD.l + (i / (n - 1)) * w;
  const Y = (v: number) => PAD.t + h - (v / hi) * h;
  const grid = theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const label = theme.textMuted;

  const area = (base: number[], top: number[]) => {
    let d = top.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
    for (let i = n - 1; i >= 0; i--) d += ` L${X(i).toFixed(1)},${Y(base[i]!).toFixed(1)}`;
    return `${d} Z`;
  };
  const zeros = tq.map(() => 0);
  const labelIdx = [0, Math.floor((n - 1) / 2), n - 1];

  return (
    <View style={{ width, height }} {...handlers}>
      <Svg width={width} height={height}>
        {[0, 0.5, 1].map((k) => (
          <G key={k}>
            <Line x1={PAD.l} x2={PAD.l + w} y1={PAD.t + h * k} y2={PAD.t + h * k} stroke={grid} strokeWidth={1} />
            <SvgText x={width - 4} y={PAD.t + h * k + 3} fontSize={9.5} fill={label} textAnchor="end">
              {axisLabel((hi / 1.05) * (1 - k), ccy)}
            </SvgText>
          </G>
        ))}
        <Path d={area(zeros, tq)} fill={c.tqqq} opacity={0.85} />
        <Path d={area(tq, tot)} fill={c.soxl} opacity={0.85} />
        <Path d={pr.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ')} fill="none" stroke={theme.text} strokeWidth={1.6} strokeDasharray="4,3" />
        {labelIdx.map((i) => (
          <SvgText key={i} x={X(i)} y={height - 5} fontSize={9.5} fill={label} textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}>
            {md(rows[i]!.date)}
          </SvgText>
        ))}
        {hover !== null && hover < n && <Line x1={X(hover)} x2={X(hover)} y1={PAD.t} y2={PAD.t + h} stroke={label} strokeWidth={1} strokeDasharray="3,3" />}
      </Svg>
    </View>
  );
}

/** 전략별 (평가금 ÷ 원금 − 1) 선 — 입금·매수 시점에 영향받지 않아 두 전략을 같은 눈금에서 비교 */
export function ReturnChart({ rows, width, height = 170, hover, onHover, onPick }: Props) {
  const theme = useTheme();
  const c = trendColors(theme.dark);
  const n = rows.length;
  const w = width - PAD.l - PAD.r;
  const h = height - PAD.t - PAD.b;
  const handlers = useScrub(n, w, onHover, onPick);
  if (n < 2) return null;

  const rets = rows.map(returnsOf);
  const tr = rets.map((r) => r.tqqq);
  const sr = rets.map((r) => r.soxl);
  const ar = rets.map((r) => r.all);
  const all = [...tr, ...sr, ...ar];
  const lo = Math.min(...all, 0);
  const hi = Math.max(...all, 0);
  const span = hi - lo || 1;
  const X = (i: number) => PAD.l + (i / (n - 1)) * w;
  const Y = (v: number) => PAD.t + h - ((v - lo) / span) * h;
  const grid = theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const label = theme.textMuted;
  const line = (arr: number[], color: string, width2: number, dash?: string) => (
    <G>
      <Path d={arr.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ')} fill="none" stroke={color} strokeWidth={width2} strokeDasharray={dash} strokeLinejoin="round" strokeLinecap="round" />
      <Circle cx={X(n - 1)} cy={Y(arr[n - 1]!)} r={3.4} fill={color} stroke={theme.card} strokeWidth={2} />
    </G>
  );
  const labelIdx = [0, Math.floor((n - 1) / 2), n - 1];

  return (
    <View style={{ width, height }} {...handlers}>
      <Svg width={width} height={height}>
        {[lo, 0, hi].map((v, k) => (
          <G key={k}>
            <Line x1={PAD.l} x2={PAD.l + w} y1={Y(v)} y2={Y(v)} stroke={v === 0 ? label : grid} strokeWidth={1} strokeDasharray={v === 0 ? '3,3' : undefined} />
            <SvgText x={width - 4} y={Y(v) + 3} fontSize={9.5} fill={label} textAnchor="end">
              {`${v.toFixed(0)}%`}
            </SvgText>
          </G>
        ))}
        {line(ar, label, 1.6, '4,3')}
        {line(sr, c.soxl, 2)}
        {line(tr, c.tqqq, 2)}
        {labelIdx.map((i) => (
          <SvgText key={i} x={X(i)} y={height - 5} fontSize={9.5} fill={label} textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}>
            {md(rows[i]!.date)}
          </SvgText>
        ))}
        {hover !== null && hover < n && <Line x1={X(hover)} x2={X(hover)} y1={PAD.t} y2={PAD.t + h} stroke={label} strokeWidth={1} strokeDasharray="3,3" />}
      </Svg>
    </View>
  );
}
