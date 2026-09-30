import { View } from 'react-native';
import Svg, { G, Line, Path, Circle, Text as SvgText } from 'react-native-svg';

export interface BandCycle {
  cycleNo: number;
  startDate: string;
  endDate: string | null;
  minBand: number;
  maxBand: number;
}

interface BandChartProps {
  cycles: BandCycle[];
  /** 일별 평가금 (date 오름차순) */
  points: { date: string; value: number }[];
  width: number;
  height?: number;
  dark?: boolean;
  /** 축 값 표시 포맷 */
  formatValue?: (v: number) => string;
}

const dayNum = (s: string) => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)) / 86400000;
const md = (s: string) => `${+s.slice(5, 7)}/${+s.slice(8, 10)}`;

/**
 * 평가금(선)이 사이클별 V 최소~최대 밴드(띠) 안에서 움직이는 모습 — x축은 날짜 비례.
 * 밴드는 사이클 안에서 고정이고 새 사이클 시작에 계단식으로 바뀐다. 밴드 밖으로 나간 기록은 경고색 점으로 강조.
 */
export default function BandChart({ cycles, points, width, height = 210, dark = false, formatValue = (v) => `$${Math.round(v)}` }: BandChartProps) {
  if (cycles.length === 0) return null;
  const sorted = [...cycles].sort((a, b) => a.cycleNo - b.cycleNo);
  const lineColor = dark ? '#35D6BD' : '#0E8F7E';
  const bandColor = dark ? '#A594FF' : '#7A5FD0';
  const outColor = dark ? '#FF7A70' : '#C23B34';
  const gridColor = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const labelColor = dark ? 'rgba(255,255,255,0.45)' : '#8B95A1';

  const pad = { t: 22, r: 44, b: 22, l: 8 };
  const w = width - pad.l - pad.r;
  const h = height - pad.t - pad.b;

  const lastDate = points.length > 0 ? points[points.length - 1].date : sorted[sorted.length - 1].startDate;
  const lastCycleEnd = sorted[sorted.length - 1].endDate ?? lastDate;
  const x0 = dayNum(sorted[0].startDate);
  const x1 = Math.max(dayNum(lastCycleEnd), dayNum(lastDate));
  const X = (s: string) => pad.l + ((dayNum(s) - x0) / (x1 - x0 || 1)) * w;

  // 사이클 k의 구간은 [start_k, start_{k+1}) — 주말 공백 없이 이어서 그린다
  const segs = sorted.map((c, i) => ({ c, a: c.startDate, b: i < sorted.length - 1 ? sorted[i + 1].startDate : lastCycleEnd > lastDate ? lastCycleEnd : lastDate }));
  const cycleOf = (date: string) => {
    let r: (typeof sorted)[number] | null = null;
    for (const c of sorted) if (c.startDate <= date) r = c;
    return r;
  };

  const lo = Math.min(...sorted.map((c) => c.minBand), ...points.map((p) => p.value)) * 0.9;
  const hi = Math.max(...sorted.map((c) => c.maxBand), ...points.map((p) => p.value)) * 1.05;
  const step = hi - lo > 4000 ? 1000 : 500;
  const yMin = Math.floor(lo / step) * step;
  const yMax = Math.ceil(hi / step) * step;
  const Y = (v: number) => pad.t + h - ((v - yMin) / (yMax - yMin)) * h;
  const ticks: number[] = [];
  for (let v = yMin; v <= yMax; v += step) ticks.push(v);

  const stepPath = (key: 'minBand' | 'maxBand') =>
    segs.map((g, i) => `${i ? 'L' : 'M'}${X(g.a).toFixed(1)},${Y(g.c[key]).toFixed(1)} L${X(g.b).toFixed(1)},${Y(g.c[key]).toFixed(1)}`).join(' ');
  const upper = stepPath('maxBand');
  const lower = [...segs].reverse().map((g) => `L${X(g.b).toFixed(1)},${Y(g.c.minBand).toFixed(1)} L${X(g.a).toFixed(1)},${Y(g.c.minBand).toFixed(1)}`).join(' ');

  const linePath = points.map((p, i) => `${i ? 'L' : 'M'}${X(p.date).toFixed(1)},${Y(p.value).toFixed(1)}`).join(' ');
  const last = points[points.length - 1];
  const outPoints = points.filter((p) => {
    const c = cycleOf(p.date);
    return c ? p.value < c.minBand || p.value > c.maxBand : false;
  });

  const xLabelDates = [sorted[0].startDate, ...sorted.filter((_, i) => i > 0 && i % 2 === 0).map((c) => c.startDate)];

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        {ticks.map((v) => (
          <G key={v}>
            <Line x1={pad.l} x2={pad.l + w} y1={Y(v)} y2={Y(v)} stroke={gridColor} strokeWidth={1} />
            <SvgText x={width - 4} y={Y(v) + 3} fontSize={9.5} fill={labelColor} textAnchor="end">
              {formatValue(v)}
            </SvgText>
          </G>
        ))}

        <Path d={`${upper} ${lower} Z`} fill={bandColor} opacity={0.13} />
        <Path d={stepPath('maxBand')} fill="none" stroke={bandColor} strokeWidth={1.4} strokeDasharray="4,3" />
        <Path d={stepPath('minBand')} fill="none" stroke={bandColor} strokeWidth={1.4} strokeDasharray="4,3" />

        {segs.map((g, i) => (
          <G key={g.c.cycleNo}>
            {i > 0 && <Line x1={X(g.a)} x2={X(g.a)} y1={pad.t - 4} y2={pad.t + h} stroke={gridColor} strokeWidth={1} strokeDasharray="2,3" />}
            <SvgText x={(X(g.a) + X(g.b)) / 2} y={pad.t - 8} fontSize={9.5} fill={labelColor} textAnchor="middle">
              {g.c.cycleNo}
            </SvgText>
          </G>
        ))}

        {points.length > 1 && <Path d={linePath} fill="none" stroke={lineColor} strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />}
        {outPoints.map((p) => (
          <Circle key={p.date} cx={X(p.date)} cy={Y(p.value)} r={3.5} fill={outColor} stroke={dark ? '#191F28' : '#fff'} strokeWidth={1.5} />
        ))}
        {last && (
          <>
            <Circle cx={X(last.date)} cy={Y(last.value)} r={4} fill={lineColor} stroke={dark ? '#191F28' : '#fff'} strokeWidth={2} />
            <SvgText x={X(last.date) - 6} y={Y(last.value) + 16} fontSize={10} fontWeight="700" fill={lineColor} textAnchor="end">
              {`$${Math.round(last.value).toLocaleString('en-US')}`}
            </SvgText>
          </>
        )}

        {xLabelDates.map((d, i) => (
          <SvgText key={d} x={X(d)} y={height - 6} fontSize={9.5} fill={labelColor} textAnchor={i === 0 ? 'start' : 'middle'}>
            {md(d)}
          </SvgText>
        ))}
        <SvgText x={pad.l + w} y={height - 6} fontSize={9.5} fill={labelColor} textAnchor="end">
          {md(lastCycleEnd > lastDate ? lastCycleEnd : lastDate)}
        </SvgText>
      </Svg>
    </View>
  );
}
