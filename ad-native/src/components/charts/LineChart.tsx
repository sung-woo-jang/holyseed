import { useRef, useState } from 'react';
import { View, Text, type GestureResponderEvent } from 'react-native';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { krwShort } from '../../lib/format';

interface DataPoint {
  date: string;
  value: number;
}

interface ExtraSeries {
  data: DataPoint[];
  color: string;
  label?: string;
}

interface LineChartProps {
  data: DataPoint[];
  width?: number;
  height?: number;
  color?: string;
  dark?: boolean;
  interactive?: boolean;
  /** 축/툴팁 값 표시 포맷 (기본: 원화 축약 표기) */
  formatValue?: (v: number) => string;
  /**
   * 두번째 계열을 같은 좌표축에 겹쳐 그림(점선, area 없음) — 두 값을 비교해서 봐야 할 때
   * (예: 평가금 vs 투자원금). data와 같은 길이·같은 순서여야 함. 3개 이상 겹칠 땐 extraSeries 사용.
   */
  series2?: DataPoint[];
  color2?: string;
  /** [계열1 이름, 계열2 이름(생략 가능)] — 지정하면 차트 아래 범례를 그림 */
  legendLabels?: [string, string?];
  /** series2로도 부족한 경우(3개 이상 비교) — 각각 점선으로 겹쳐 그리고 범례에 label을 붙임 */
  extraSeries?: ExtraSeries[];
}

export default function LineChart({
  data,
  width = 327,
  height = 180,
  color = '#3182F6',
  dark = false,
  interactive = true,
  formatValue = krwShort,
  series2,
  color2 = '#8B95A1',
  legendLabels,
  extraSeries,
}: LineChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const gradId = useRef(`lc-${Math.random().toString(36).slice(2, 7)}`).current;

  if (!data || data.length === 0) return null;

  const extras: ExtraSeries[] = [
    ...(series2 && series2.length > 1 ? [{ data: series2, color: color2, label: legendLabels?.[1] }] : []),
    ...(extraSeries ?? []),
  ].filter((e) => e.data.length > 1);

  const padding = { top: 18, right: 44, bottom: 24, left: 8 };
  const w = width - padding.left - padding.right;
  const h = height - padding.top - padding.bottom;
  const values = data.map((d) => d.value).concat(extras.flatMap((e) => e.data.map((d) => d.value)));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const toPoints = (series: DataPoint[]) =>
    series.map((d, i) => ({
      x: padding.left + (i / (series.length - 1)) * w,
      y: padding.top + h - ((d.value - min) / range) * h,
      ...d,
    }));

  const points = toPoints(data);
  const extraPoints = extras.map((e) => ({ ...e, points: toPoints(e.data) }));

  const pathD = points.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(' ');
  const lastPt = points[points.length - 1];
  const firstPt = points[0];
  const areaD = lastPt && firstPt ? `${pathD} L${lastPt.x},${padding.top + h} L${firstPt.x},${padding.top + h} Z` : pathD;

  const gridColor = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
  const labelColor = dark ? 'rgba(255,255,255,0.4)' : '#8B95A1';

  const yTicks = [
    { y: padding.top, value: max },
    { y: padding.top + h / 2, value: (max + min) / 2 },
    { y: padding.top + h, value: min },
  ];

  const xLabelIdxs = [0, Math.floor(data.length / 4), Math.floor(data.length / 2), Math.floor((data.length * 3) / 4), data.length - 1];

  const hp = hoverIdx != null ? points[hoverIdx] : null;
  const hoverExtras = hoverIdx != null ? extraPoints.map((e) => ({ color: e.color, pt: e.points[hoverIdx] })).filter((e) => e.pt) : [];

  function pickIndex(locationX: number) {
    const rel = (locationX - padding.left) / w;
    const idx = Math.max(0, Math.min(data.length - 1, Math.round(rel * (data.length - 1))));
    setHoverIdx(idx);
  }

  function handleTouch(e: GestureResponderEvent) {
    if (!interactive) return;
    pickIndex(e.nativeEvent.locationX);
  }

  const tooltipRows = 1 + hoverExtras.length;
  const tooltipH = 20 + tooltipRows * 13;
  const tooltipX = hp ? Math.max(8, Math.min(width - 110, hp.x - 50)) : 0;
  const tooltipY = hp ? Math.max(2, hp.y - tooltipH - 6) : 0;

  const legendItems = [
    ...(legendLabels?.[0] ? [{ color, label: legendLabels[0] }] : []),
    ...extras.filter((e) => e.label).map((e) => ({ color: e.color, label: e.label as string })),
  ];

  return (
    <View
      style={{ width, height }}
      onStartShouldSetResponder={() => interactive}
      onMoveShouldSetResponder={() => interactive}
      onResponderGrant={handleTouch}
      onResponderMove={handleTouch}
      onResponderRelease={() => setHoverIdx(null)}
    >
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={color} stopOpacity={0.18} />
            <Stop offset="100%" stopColor={color} stopOpacity={0} />
          </LinearGradient>
        </Defs>

        {yTicks.map((t, i) => (
          <G key={i}>
            <Line x1={padding.left} x2={padding.left + w} y1={t.y} y2={t.y} stroke={gridColor} strokeWidth={1} strokeDasharray="2,4" />
            <SvgText x={width - 4} y={t.y + 3} fontSize={10} fill={labelColor} textAnchor="end">
              {formatValue(t.value)}
            </SvgText>
          </G>
        ))}

        <Path d={areaD} fill={`url(#${gradId})`} />
        {extraPoints.map((e, i) => {
          const dPath = e.points.map((p, j) => (j === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(' ');
          return <Path key={i} d={dPath} fill="none" stroke={e.color} strokeWidth={2} strokeDasharray="5,4" strokeLinecap="round" strokeLinejoin="round" />;
        })}
        <Path d={pathD} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

        {points.map((p, i) =>
          i === points.length - 1 ? (
            <Circle key={i} cx={p.x} cy={p.y} r={4} fill={color} stroke={dark ? '#191F28' : '#fff'} strokeWidth={2} />
          ) : null,
        )}
        {extraPoints.map((e, i) => {
          const p = e.points[e.points.length - 1];
          return p ? <Circle key={`ex-${i}`} cx={p.x} cy={p.y} r={3.5} fill={e.color} stroke={dark ? '#191F28' : '#fff'} strokeWidth={2} /> : null;
        })}

        {xLabelIdxs.map((idx, k) => {
          const d = data[idx]?.date ?? '';
          const label = d.length > 7 ? d.slice(0, 7) : d;
          return (
            <SvgText key={k} x={padding.left + (idx / (data.length - 1)) * w} y={height - 6} textAnchor="middle" fontSize={9.5} fill={labelColor}>
              {label.slice(2)}
            </SvgText>
          );
        })}

        {hp && (
          <>
            <Line x1={hp.x} x2={hp.x} y1={padding.top} y2={padding.top + h} stroke={color} strokeWidth={1} strokeDasharray="3,3" opacity={0.5} />
            <Circle cx={hp.x} cy={hp.y} r={6} fill={color} stroke={dark ? '#191F28' : '#fff'} strokeWidth={2.5} />
            {hoverExtras.map((e, i) => (
              <Circle key={i} cx={e.pt!.x} cy={e.pt!.y} r={5} fill={e.color} stroke={dark ? '#191F28' : '#fff'} strokeWidth={2} />
            ))}
            <Rect x={tooltipX} y={tooltipY} width={100} height={tooltipH} rx={6} fill={dark ? '#0F1115' : '#191F28'} opacity={0.95} />
            <SvgText x={tooltipX + 50} y={tooltipY + 13} textAnchor="middle" fontSize={9.5} fill="rgba(255,255,255,0.6)">
              {hp.date}
            </SvgText>
            <SvgText x={tooltipX + 50} y={tooltipY + 26} textAnchor="middle" fontSize={11} fontWeight="700" fill={color}>
              {formatValue(hp.value)}
            </SvgText>
            {hoverExtras.map((e, i) => (
              <SvgText key={i} x={tooltipX + 50} y={tooltipY + 39 + i * 13} textAnchor="middle" fontSize={11} fontWeight="700" fill={e.color}>
                {formatValue(e.pt!.value)}
              </SvgText>
            ))}
          </>
        )}
      </Svg>
      {legendItems.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 6, paddingLeft: padding.left }}>
          {legendItems.map((item, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <View style={{ width: 10, height: 2.5, borderRadius: 2, backgroundColor: item.color }} />
              <Text style={{ fontSize: 10.5, color: labelColor }}>{item.label}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
