import { useRef, useState } from 'react';
import { View, Text, type GestureResponderEvent } from 'react-native';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { krwShort } from '../../lib/format';

interface DataPoint {
  date: string;
  value: number;
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
   * (예: 평가금 vs 투자원금, 전략 수익률 vs 벤치마크). data와 같은 길이·같은 순서여야 함.
   */
  series2?: DataPoint[];
  color2?: string;
  /** [계열1 이름, 계열2 이름] — 지정하면 차트 아래 범례를 그림 */
  legendLabels?: [string, string];
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
}: LineChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const gradId = useRef(`lc-${Math.random().toString(36).slice(2, 7)}`).current;

  if (!data || data.length === 0) return null;

  const padding = { top: 18, right: 44, bottom: 24, left: 8 };
  const w = width - padding.left - padding.right;
  const h = height - padding.top - padding.bottom;
  const values = data.map((d) => d.value).concat(series2 ? series2.map((d) => d.value) : []);
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
  const points2 = series2 && series2.length > 1 ? toPoints(series2) : null;

  const pathD = points.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(' ');
  const path2D = points2 ? points2.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(' ') : null;
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
  const hp2 = points2 && hoverIdx != null ? points2[hoverIdx] : null;

  function pickIndex(locationX: number) {
    const rel = (locationX - padding.left) / w;
    const idx = Math.max(0, Math.min(data.length - 1, Math.round(rel * (data.length - 1))));
    setHoverIdx(idx);
  }

  function handleTouch(e: GestureResponderEvent) {
    if (!interactive) return;
    pickIndex(e.nativeEvent.locationX);
  }

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
        {path2D && <Path d={path2D} fill="none" stroke={color2} strokeWidth={2} strokeDasharray="5,4" strokeLinecap="round" strokeLinejoin="round" />}
        <Path d={pathD} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

        {points.map((p, i) =>
          i === points.length - 1 ? (
            <Circle key={i} cx={p.x} cy={p.y} r={4} fill={color} stroke={dark ? '#191F28' : '#fff'} strokeWidth={2} />
          ) : null,
        )}
        {points2 &&
          points2.map((p, i) =>
            i === points2.length - 1 ? <Circle key={`s2-${i}`} cx={p.x} cy={p.y} r={3.5} fill={color2} stroke={dark ? '#191F28' : '#fff'} strokeWidth={2} /> : null,
          )}

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
            {hp2 && <Circle cx={hp2.x} cy={hp2.y} r={5} fill={color2} stroke={dark ? '#191F28' : '#fff'} strokeWidth={2} />}
            <Rect
              x={Math.max(8, Math.min(width - 110, hp.x - 50))}
              y={Math.max(2, hp.y - (hp2 ? 52 : 38))}
              width={100}
              height={hp2 ? 46 : 32}
              rx={6}
              fill={dark ? '#0F1115' : '#191F28'}
              opacity={0.95}
            />
            <SvgText
              x={Math.max(8, Math.min(width - 110, hp.x - 50)) + 50}
              y={Math.max(2, hp.y - (hp2 ? 52 : 38)) + 13}
              textAnchor="middle"
              fontSize={9.5}
              fill="rgba(255,255,255,0.6)"
            >
              {hp.date}
            </SvgText>
            <SvgText
              x={Math.max(8, Math.min(width - 110, hp.x - 50)) + 50}
              y={Math.max(2, hp.y - (hp2 ? 52 : 38)) + 26}
              textAnchor="middle"
              fontSize={11}
              fontWeight="700"
              fill={color}
            >
              {formatValue(hp.value)}
            </SvgText>
            {hp2 && (
              <SvgText
                x={Math.max(8, Math.min(width - 110, hp.x - 50)) + 50}
                y={Math.max(2, hp.y - 52) + 39}
                textAnchor="middle"
                fontSize={11}
                fontWeight="700"
                fill={color2}
              >
                {formatValue(hp2.value)}
              </SvgText>
            )}
          </>
        )}
      </Svg>
      {legendLabels && (
        <View style={{ flexDirection: 'row', gap: 14, marginTop: 6, paddingLeft: padding.left }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ width: 10, height: 2.5, borderRadius: 2, backgroundColor: color }} />
            <Text style={{ fontSize: 10.5, color: labelColor }}>{legendLabels[0]}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ width: 10, height: 2.5, borderRadius: 2, backgroundColor: color2 }} />
            <Text style={{ fontSize: 10.5, color: labelColor }}>{legendLabels[1]}</Text>
          </View>
        </View>
      )}
    </View>
  );
}
