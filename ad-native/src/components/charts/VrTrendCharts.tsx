import { useRef, useState } from 'react';
import { View, type GestureResponderEvent } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import type { VrCandlesDto, VrCycle, VrFill } from '../../api/vr';
import { scrubLock } from '../../lib/chart-touch';
import { useTheme, type Theme } from '../../lib/theme';
import { closesByDate, type TrendPoint } from '../../lib/vr-trend';

const dayNum = (s: string) => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)) / 86400000;
const md = (s: string) => `${+s.slice(5, 7)}/${+s.slice(8, 10)}`;
function usd(v: number, d = 2): string {
  return `${v < 0 ? '−' : ''}$${Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })}`;
}
function pct(v: number): string {
  return `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(1)}%`;
}

function palette(theme: Theme) {
  return {
    line: theme.dark ? '#35D6BD' : '#0E8F7E',
    band: theme.dark ? '#A594FF' : '#7A5FD0',
    pool: theme.dark ? '#35D6BD' : '#18A999',
    avg: '#A78BFA',
    out: theme.dark ? '#FF7A70' : '#C23B34',
    grid: theme.dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
    label: theme.dark ? 'rgba(255,255,255,0.5)' : '#8B95A1',
    halo: theme.dark ? '#191F28' : '#fff',
  };
}

function niceTicks(lo: number, hi: number, n = 4): number[] {
  const raw = (hi - lo) / n;
  const mag = Math.pow(10, Math.floor(Math.log10(raw || 1)));
  const mult = [1, 2, 2.5, 5, 10].find((k) => raw / (k * mag) <= 1) ?? 10;
  const step = mult * mag;
  const out: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(v);
  return out;
}

/** 터치로 가장 가까운 점을 고르는 공통 훅 — 손을 떼면 해제 */
function useScrub(xs: number[], padLeft: number) {
  const [idx, setIdx] = useState<number | null>(null);
  const xsRef = useRef(xs);
  xsRef.current = xs;
  function pick(e: GestureResponderEvent) {
    const x = e.nativeEvent.locationX;
    let best = 0;
    let bestD = Infinity;
    xsRef.current.forEach((v, i) => {
      const d = Math.abs(v - x);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    setIdx(best);
  }
  return {
    idx,
    handlers: {
      onStartShouldSetResponder: () => true,
      onMoveShouldSetResponder: () => true,
      ...scrubLock(pick),
      onResponderMove: pick,
      onResponderRelease: () => setIdx(null),
      onResponderTerminate: () => setIdx(null),
    },
    padLeft,
  };
}

function Tooltip({ x, width, lines, dark }: { x: number; width: number; lines: string[]; dark: boolean }) {
  const boxW = 150;
  const boxH = 14 + lines.length * 14;
  const bx = Math.max(4, Math.min(width - boxW - 4, x - boxW / 2));
  return (
    <G>
      <Rect x={bx} y={4} width={boxW} height={boxH} rx={8} fill={dark ? '#0F1115' : '#191F28'} opacity={0.95} />
      {lines.map((t, i) => (
        <SvgText key={i} x={bx + 10} y={20 + i * 14} fontSize={i === 0 ? 10 : 10.5} fontWeight={i === 0 ? 'normal' : 'bold'} fill={i === 0 ? 'rgba(255,255,255,0.65)' : '#fff'}>
          {t}
        </SvgText>
      ))}
    </G>
  );
}

interface BaseProps {
  width: number;
  height?: number;
}

interface XScale {
  X: (date: string) => number;
  d0: number;
  d1: number;
}
function makeX(dates: string[], padL: number, w: number): XScale {
  const d0 = Math.min(...dates.map(dayNum));
  const d1 = Math.max(...dates.map(dayNum));
  return { X: (date) => padL + ((dayNum(date) - d0) / (d1 - d0 || 1)) * w, d0, d1 };
}
function xLabelDates(first: string, last: string): string[] {
  const a = dayNum(first);
  const b = dayNum(last);
  const mids = [0.25, 0.5, 0.75].map((r) => {
    const t = new Date((a + (b - a) * r) * 86400000);
    return t.toISOString().slice(0, 10);
  });
  return [first, ...mids, last];
}

// ── 평가금 vs 밴드 ───────────────────────────────────────────────────────────

interface BandTrendProps extends BaseProps {
  points: TrendPoint[];
  cycles: VrCycle[];
}

/** 평가금(선)이 사이클별 V 밴드(띠·V 점선) 안에서 움직이는 모습 — 날짜 비례 x축, 복원 구간은 점선·음영, 밴드 밖은 빨간 점 */
export function BandTrendChart({ points, cycles, width, height = 230 }: BandTrendProps) {
  const theme = useTheme();
  const c = palette(theme);
  const pad = { t: 20, r: 44, b: 22, l: 6 };
  const w = width - pad.l - pad.r;
  const h = height - pad.t - pad.b;
  const sortedCycles = [...cycles].sort((a, b) => a.cycleNo - b.cycleNo);
  const from = sortedCycles[0]?.startDate ?? points[0]?.date;
  const pts = points.filter((p) => !from || p.date >= from);
  const xscale = pts.length >= 2 ? makeX(pts.map((p) => p.date), pad.l, w) : null;
  const scrub = useScrub(xscale ? pts.map((p) => xscale.X(p.date)) : [], pad.l);
  if (!xscale || sortedCycles.length === 0) return null;

  const lastDate = pts[pts.length - 1]!.date;
  const X = xscale.X;
  const vals = [...pts.map((p) => p.val), ...sortedCycles.flatMap((cy) => [cy.minBand, cy.maxBand])];
  const rawLo = Math.min(...vals) * 0.92;
  const rawHi = Math.max(...vals) * 1.03;
  const ticks = niceTicks(rawLo, rawHi);
  const lo = Math.min(rawLo, ticks[0] ?? rawLo);
  const hi = Math.max(rawHi, ticks[ticks.length - 1] ?? rawHi);
  const Y = (v: number) => pad.t + h - ((v - lo) / (hi - lo)) * h;

  const estPts = pts.filter((p) => p.est);
  const lastEst = estPts[estPts.length - 1];
  const realPts = pts.filter((p) => !p.est);
  const line = (list: TrendPoint[]) => list.map((p, i) => `${i ? 'L' : 'M'}${X(p.date).toFixed(1)},${Y(p.val).toFixed(1)}`).join(' ');
  const last = pts[pts.length - 1]!;
  const hv = scrub.idx != null ? pts[scrub.idx] : null;
  const labels = xLabelDates(pts[0]!.date, lastDate);

  return (
    <View style={{ width, height }} {...scrub.handlers}>
      <Svg width={width} height={height}>
        {ticks.map((v) => (
          <G key={v}>
            <Line x1={pad.l} x2={pad.l + w} y1={Y(v)} y2={Y(v)} stroke={c.grid} strokeWidth={1} />
            <SvgText x={width - 4} y={Y(v) + 3} fontSize={9.5} fill={c.label} textAnchor="end">
              {`$${Math.round(v).toLocaleString('en-US')}`}
            </SvgText>
          </G>
        ))}
        {lastEst && (
          <>
            <Rect x={pad.l} y={pad.t} width={Math.max(0, X(lastEst.date) - pad.l)} height={h} fill={c.label} opacity={0.08} />
            <SvgText x={pad.l + 4} y={pad.t + 11} fontSize={9.5} fill={c.label}>
              {`복원(추정) ${md(estPts[0]!.date)}~${md(lastEst.date)}`}
            </SvgText>
          </>
        )}
        {sortedCycles.map((cy, k) => {
          const next = sortedCycles[k + 1];
          const a = Math.max(dayNum(cy.startDate), dayNum(pts[0]!.date));
          const b = Math.min(next ? dayNum(next.startDate) : dayNum(lastDate), dayNum(lastDate));
          if (b <= a) return null;
          const xa = pad.l + ((a - dayNum(pts[0]!.date)) / (dayNum(lastDate) - dayNum(pts[0]!.date) || 1)) * w;
          const xb = pad.l + ((b - dayNum(pts[0]!.date)) / (dayNum(lastDate) - dayNum(pts[0]!.date) || 1)) * w;
          return (
            <G key={cy.cycleNo}>
              <Rect x={xa} y={Y(cy.maxBand)} width={xb - xa} height={Y(cy.minBand) - Y(cy.maxBand)} fill={c.band} opacity={0.13} />
              <Line x1={xa} x2={xb} y1={Y(cy.maxBand)} y2={Y(cy.maxBand)} stroke={c.band} strokeWidth={1.2} />
              <Line x1={xa} x2={xb} y1={Y(cy.minBand)} y2={Y(cy.minBand)} stroke={c.band} strokeWidth={1.2} />
              <Line x1={xa} x2={xb} y1={Y(cy.vValue)} y2={Y(cy.vValue)} stroke={c.band} strokeWidth={1.2} strokeDasharray="3,3" />
              {k > 0 && <Line x1={xa} x2={xa} y1={pad.t - 3} y2={pad.t + h} stroke={c.grid} strokeDasharray="2,3" />}
              <SvgText x={(xa + xb) / 2} y={pad.t - 7} fontSize={9.5} fill={c.label} textAnchor="middle">
                {cy.cycleNo}
              </SvgText>
            </G>
          );
        })}
        {estPts.length > 1 && <Path d={line(lastEst && realPts[0] ? [...estPts, realPts[0]] : estPts)} fill="none" stroke={c.line} strokeWidth={2} strokeDasharray="4,3" opacity={0.85} />}
        {realPts.length > 1 && <Path d={line(realPts)} fill="none" stroke={c.line} strokeWidth={2.4} strokeLinejoin="round" strokeLinecap="round" />}
        {pts
          .filter((p) => p.min != null && (p.val < p.min || p.val > (p.max ?? Infinity)))
          .map((p) => (
            <Circle key={p.date} cx={X(p.date)} cy={Y(p.val)} r={3} fill={c.out} stroke={c.halo} strokeWidth={1.2} />
          ))}
        <Circle cx={X(last.date)} cy={Y(last.val)} r={4.5} fill={c.line} stroke={c.halo} strokeWidth={2} />
        <SvgText x={X(last.date) - 6} y={Y(last.val) + 16} fontSize={10.5} fontWeight="bold" fill={c.line} textAnchor="end">
          {usd(last.val, 0)}
        </SvgText>
        {labels.map((d, i) => (
          <SvgText key={d} x={X(d)} y={height - 6} fontSize={9.5} fill={c.label} textAnchor={i === 0 ? 'start' : i === labels.length - 1 ? 'end' : 'middle'}>
            {md(d)}
          </SvgText>
        ))}
        {hv && (
          <>
            <Line x1={X(hv.date)} x2={X(hv.date)} y1={pad.t} y2={pad.t + h} stroke={c.label} strokeWidth={1} strokeDasharray="3,3" />
            <Tooltip
              x={X(hv.date)}
              width={width}
              dark={theme.dark}
              lines={[
                `${md(hv.date)}${hv.est ? ' · 추정' : ''}`,
                `평가금 ${usd(hv.val, 0)}`,
                hv.min != null && hv.max != null ? `밴드 ${usd(hv.min, 0)}~${usd(hv.max, 0)}` : '밴드 없음',
              ]}
            />
          </>
        )}
      </Svg>
    </View>
  );
}

// ── 가격 · 체결 ─────────────────────────────────────────────────────────────

interface PriceFillsProps extends BaseProps {
  candles: VrCandlesDto['candles'];
  fills: VrFill[];
  /** 첫 점 날짜 이후만 그린다 */
  from: string;
  /** 이번 사이클 매수/매도선 */
  lines?: { buy: number; sell: number; startDate: string };
}

export function PriceFillsChart({ candles, fills, from, lines, width, height = 230 }: PriceFillsProps) {
  const theme = useTheme();
  const c = palette(theme);
  const pad = { t: 14, r: 44, b: 22, l: 6 };
  const w = width - pad.l - pad.r;
  const h = height - pad.t - pad.b;
  const closes = closesByDate(candles);
  const series = [...closes.entries()].filter(([d]) => d >= from).sort((a, b) => (a[0] < b[0] ? -1 : 1));
  const { X } = makeX(series.length ? series.map(([d]) => d) : [from, from], pad.l, w);
  const scrub = useScrub(series.map(([d]) => X(d)), pad.l);
  if (series.length < 2) return null;

  const sortedFills = [...fills].sort((a, b) => (a.fillDate === b.fillDate ? a.id - b.id : a.fillDate < b.fillDate ? -1 : 1));
  const avgSteps = sortedFills.filter((f) => f.avgPriceAfter > 0 && f.fillDate >= from);
  const prices = [...series.map(([, p]) => p), ...avgSteps.map((f) => f.avgPriceAfter), ...(lines ? [lines.buy, lines.sell] : [])];
  const rawLo = Math.min(...prices) * 0.95;
  const rawHi = Math.max(...prices) * 1.04;
  const ticks = niceTicks(rawLo, rawHi);
  const lo = Math.min(rawLo, ticks[0] ?? rawLo);
  const hi = Math.max(rawHi, ticks[ticks.length - 1] ?? rawHi);
  const Y = (v: number) => pad.t + h - ((v - lo) / (hi - lo)) * h;
  const lastDate = series[series.length - 1]![0];
  const lastPrice = series[series.length - 1]![1];
  const [hd, hp] = scrub.idx != null ? series[scrub.idx]! : [null, null];

  // 평단 계단선 — 체결 직후 값이 다음 체결 전까지 이어진다
  let stepPath = '';
  avgSteps.forEach((f, i) => {
    const next = avgSteps[i + 1];
    const xa = X(f.fillDate);
    const xb = next ? X(next.fillDate) : X(lastDate);
    stepPath += `${stepPath ? 'L' : 'M'}${xa.toFixed(1)},${Y(f.avgPriceAfter).toFixed(1)} L${xb.toFixed(1)},${Y(f.avgPriceAfter).toFixed(1)} `;
  });
  const labels = xLabelDates(series[0]![0], lastDate);

  return (
    <View style={{ width, height }} {...scrub.handlers}>
      <Svg width={width} height={height}>
        {ticks.map((v) => (
          <G key={v}>
            <Line x1={pad.l} x2={pad.l + w} y1={Y(v)} y2={Y(v)} stroke={c.grid} strokeWidth={1} />
            <SvgText x={width - 4} y={Y(v) + 3} fontSize={9.5} fill={c.label} textAnchor="end">
              {`$${Math.round(v)}`}
            </SvgText>
          </G>
        ))}
        <Path d={series.map(([d, p], i) => `${i ? 'L' : 'M'}${X(d).toFixed(1)},${Y(p).toFixed(1)}`).join(' ')} fill="none" stroke={c.label} strokeWidth={1.6} strokeLinejoin="round" />
        {stepPath ? <Path d={stepPath} fill="none" stroke={c.avg} strokeWidth={2} strokeLinejoin="round" /> : null}
        {lines && (
          <>
            <Line x1={X(lines.startDate < series[0]![0] ? series[0]![0] : lines.startDate)} x2={X(lastDate)} y1={Y(lines.buy)} y2={Y(lines.buy)} stroke={theme.brand} strokeWidth={1.4} strokeDasharray="4,3" />
            <Line x1={X(lines.startDate < series[0]![0] ? series[0]![0] : lines.startDate)} x2={X(lastDate)} y1={Y(lines.sell)} y2={Y(lines.sell)} stroke={theme.danger} strokeWidth={1.4} strokeDasharray="4,3" />
            <SvgText x={X(lastDate) - 4} y={Y(lines.sell) - 4} fontSize={9.5} fontWeight="bold" textAnchor="end" fill={theme.danger}>
              {`매도선 ${usd(lines.sell)}`}
            </SvgText>
            <SvgText x={X(lastDate) - 4} y={Y(lines.buy) + 12} fontSize={9.5} fontWeight="bold" textAnchor="end" fill={theme.brand}>
              {`매수선 ${usd(lines.buy)}`}
            </SvgText>
          </>
        )}
        {sortedFills
          .filter((f) => f.kind === 'BUY' && f.fillDate >= from)
          .map((f) => (
            <Circle key={f.id} cx={X(f.fillDate)} cy={Y(f.price)} r={2.6 + Math.min(4, f.quantity * 0.7)} fill={theme.brand} opacity={0.85} stroke={c.halo} strokeWidth={1} />
          ))}
        <Circle cx={X(lastDate)} cy={Y(lastPrice)} r={4} fill={theme.text} stroke={c.halo} strokeWidth={2} />
        <SvgText x={X(lastDate) - 6} y={Y(lastPrice) - 8} fontSize={10.5} fontWeight="bold" textAnchor="end" fill={theme.text}>
          {usd(lastPrice)}
        </SvgText>
        {labels.map((d, i) => (
          <SvgText key={d} x={X(d)} y={height - 6} fontSize={9.5} fill={c.label} textAnchor={i === 0 ? 'start' : i === labels.length - 1 ? 'end' : 'middle'}>
            {md(d)}
          </SvgText>
        ))}
        {hd && hp != null && (
          <>
            <Line x1={X(hd)} x2={X(hd)} y1={pad.t} y2={pad.t + h} stroke={c.label} strokeWidth={1} strokeDasharray="3,3" />
            <Tooltip x={X(hd)} width={width} dark={theme.dark} lines={[md(hd), `TQQQ ${usd(hp)}`]} />
          </>
        )}
      </Svg>
    </View>
  );
}

// ── 자산 구성 ───────────────────────────────────────────────────────────────

export function MixChart({ points, width, height = 230 }: { points: TrendPoint[] } & BaseProps) {
  const theme = useTheme();
  const c = palette(theme);
  const pad = { t: 14, r: 44, b: 22, l: 6 };
  const w = width - pad.l - pad.r;
  const h = height - pad.t - pad.b;
  const dates = points.map((p) => p.date);
  const { X } = makeX(dates.length ? dates : ['2000-01-01', '2000-01-02'], pad.l, w);
  const scrub = useScrub(points.map((p) => X(p.date)), pad.l);
  if (points.length < 2) return null;

  const rawHi = Math.max(...points.map((p) => Math.max(p.tot, p.prin))) * 1.05;
  const ticks = niceTicks(0, rawHi);
  const hi = Math.max(rawHi, ticks[ticks.length - 1] ?? rawHi);
  const Y = (v: number) => pad.t + h - (v / hi) * h;
  const area = (top: (p: TrendPoint) => number, bottom: (p: TrendPoint) => number) =>
    points.map((p, i) => `${i ? 'L' : 'M'}${X(p.date).toFixed(1)},${Y(top(p)).toFixed(1)}`).join(' ') +
    ' ' +
    [...points].reverse().map((p) => `L${X(p.date).toFixed(1)},${Y(bottom(p)).toFixed(1)}`).join(' ') +
    ' Z';
  const last = points[points.length - 1]!;
  const estEnd = [...points].reverse().find((p) => p.est);
  const hv = scrub.idx != null ? points[scrub.idx] : null;
  const labels = xLabelDates(points[0]!.date, last.date);

  return (
    <View style={{ width, height }} {...scrub.handlers}>
      <Svg width={width} height={height}>
        {ticks.map((v) => (
          <G key={v}>
            <Line x1={pad.l} x2={pad.l + w} y1={Y(v)} y2={Y(v)} stroke={c.grid} strokeWidth={1} />
            <SvgText x={width - 4} y={Y(v) + 3} fontSize={9.5} fill={c.label} textAnchor="end">
              {`$${Math.round(v).toLocaleString('en-US')}`}
            </SvgText>
          </G>
        ))}
        <Path d={area((p) => p.val, () => 0)} fill={c.line} opacity={0.45} />
        <Path d={area((p) => p.val + p.pool, (p) => p.val)} fill={c.pool} opacity={0.3} />
        <Path d={points.map((p, i) => `${i ? 'L' : 'M'}${X(p.date).toFixed(1)},${Y(p.prin).toFixed(1)}`).join(' ')} fill="none" stroke={theme.text} strokeWidth={1.6} strokeDasharray="4,3" />
        {estEnd && (
          <>
            <Line x1={X(estEnd.date)} x2={X(estEnd.date)} y1={pad.t} y2={pad.t + h} stroke={c.label} strokeDasharray="2,3" />
            <SvgText x={pad.l + 4} y={pad.t + 11} fontSize={9.5} fill={c.label}>
              {`${md(points[0]!.date)}~${md(estEnd.date)} 복원(추정)`}
            </SvgText>
          </>
        )}
        <SvgText x={X(last.date) + 4} y={Y(last.prin) + 3} fontSize={9.5} fontWeight="bold" fill={theme.text}>
          원금
        </SvgText>
        <SvgText x={X(last.date) - 4} y={Y(last.val / 2) + 3} fontSize={10} fontWeight="bold" textAnchor="end" fill={theme.text}>
          {`TQQQ ${Math.round((last.val / last.tot) * 100)}%`}
        </SvgText>
        <SvgText x={X(last.date) - 4} y={Y(last.val + last.pool / 2) + 3} fontSize={10} fontWeight="bold" textAnchor="end" fill={theme.text}>
          {`Pool ${Math.round((last.pool / last.tot) * 100)}%`}
        </SvgText>
        {labels.map((d, i) => (
          <SvgText key={d} x={X(d)} y={height - 6} fontSize={9.5} fill={c.label} textAnchor={i === 0 ? 'start' : i === labels.length - 1 ? 'end' : 'middle'}>
            {md(d)}
          </SvgText>
        ))}
        {hv && (
          <>
            <Line x1={X(hv.date)} x2={X(hv.date)} y1={pad.t} y2={pad.t + h} stroke={c.label} strokeWidth={1} strokeDasharray="3,3" />
            <Tooltip x={X(hv.date)} width={width} dark={theme.dark} lines={[`${md(hv.date)}${hv.est ? ' · 추정' : ''}`, `평가금 ${usd(hv.val, 0)} · Pool ${usd(hv.pool, 0)}`, `원금 ${usd(hv.prin, 0)}`]} />
          </>
        )}
      </Svg>
    </View>
  );
}

// ── VR vs 단순 매수 수익률 ──────────────────────────────────────────────────

export function CompareChart({ points, width, height = 120 }: { points: TrendPoint[] } & BaseProps) {
  const theme = useTheme();
  const c = palette(theme);
  const pad = { t: 12, r: 50, b: 14, l: 6 };
  const w = width - pad.l - pad.r;
  const h = height - pad.t - pad.b;
  const pts = points.filter((p) => p.prin > 0);
  const { X } = makeX(pts.length ? pts.map((p) => p.date) : ['2000-01-01', '2000-01-02'], pad.l, w);
  const scrub = useScrub(pts.map((p) => X(p.date)), pad.l);
  if (pts.length < 2) return null;

  const vr = pts.map((p) => (p.tot / p.prin - 1) * 100);
  const bm = pts.map((p) => (p.bench != null ? (p.bench / p.prin - 1) * 100 : null));
  const all = [...vr, ...(bm.filter((v) => v != null) as number[])];
  const lo = Math.floor(Math.min(...all, 0) / 10) * 10;
  const hi = Math.ceil(Math.max(...all, 0) / 10) * 10 + 5;
  const Y = (v: number) => pad.t + h - ((v - lo) / (hi - lo)) * h;
  const path = (arr: (number | null)[]) => {
    let d = '';
    arr.forEach((v, i) => {
      if (v == null) return;
      d += `${d ? 'L' : 'M'}${X(pts[i]!.date).toFixed(1)},${Y(v).toFixed(1)}`;
    });
    return d;
  };
  const lastVr = vr[vr.length - 1]!;
  const lastBm = bm[bm.length - 1];
  const hi2 = scrub.idx;

  return (
    <View style={{ width, height }} {...scrub.handlers}>
      <Svg width={width} height={height}>
        <Line x1={pad.l} x2={pad.l + w} y1={Y(0)} y2={Y(0)} stroke={c.grid} strokeWidth={1} />
        <SvgText x={width - 4} y={Y(0) + 3} fontSize={9.5} fill={c.label} textAnchor="end">
          0%
        </SvgText>
        <Path d={path(bm)} fill="none" stroke={c.label} strokeWidth={1.8} strokeDasharray="4,3" />
        <Path d={path(vr)} fill="none" stroke={c.line} strokeWidth={2.4} strokeLinejoin="round" />
        <SvgText x={X(pts[pts.length - 1]!.date) + 4} y={Y(lastVr) - 4} fontSize={10} fontWeight="bold" fill={c.line}>
          {pct(lastVr)}
        </SvgText>
        {lastBm != null && (
          <SvgText x={X(pts[pts.length - 1]!.date) + 4} y={Y(lastBm) + 12} fontSize={10} fontWeight="bold" fill={c.label}>
            {pct(lastBm)}
          </SvgText>
        )}
        {hi2 != null && (
          <>
            <Line x1={X(pts[hi2]!.date)} x2={X(pts[hi2]!.date)} y1={pad.t} y2={pad.t + h} stroke={c.label} strokeWidth={1} strokeDasharray="3,3" />
            <Tooltip
              x={X(pts[hi2]!.date)}
              width={width}
              dark={theme.dark}
              lines={[`${md(pts[hi2]!.date)}${pts[hi2]!.est ? ' · 추정' : ''}`, `VR ${pct(vr[hi2]!)}`, bm[hi2] != null ? `단순 매수 ${pct(bm[hi2]!)}` : '단순 매수 —']}
            />
          </>
        )}
      </Svg>
    </View>
  );
}
