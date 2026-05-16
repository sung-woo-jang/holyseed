import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
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
}

export default function LineChart({
  data,
  width = 327,
  height = 180,
  color = '#3182F6',
  dark = false,
  interactive = true,
}: LineChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const viewRef = useRef<View>(null);
  const gradId = useRef(`lc-${Math.random().toString(36).slice(2, 7)}`).current;

  if (!data || data.length === 0) return null;

  const padding = { top: 18, right: 44, bottom: 24, left: 8 };
  const w = width - padding.left - padding.right;
  const h = height - padding.top - padding.bottom;
  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = data.map((d, i) => ({
    x: padding.left + (i / (data.length - 1)) * w,
    y: padding.top + h - ((d.value - min) / range) * h,
    ...d,
  }));

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

  const xLabelIdxs = [
    0,
    Math.floor(data.length / 4),
    Math.floor(data.length / 2),
    Math.floor((data.length * 3) / 4),
    data.length - 1,
  ];

  const hp = hoverIdx != null ? points[hoverIdx] : null;

  const onLayout = () => {};

  const handleTouchStart = (evt: { nativeEvent: { locationX: number } }) => {
    if (!interactive) return;
    const x = evt.nativeEvent.locationX;
    const rel = (x - padding.left) / w;
    const idx = Math.max(0, Math.min(data.length - 1, Math.round(rel * (data.length - 1))));
    setHoverIdx(idx);
  };

  const handleTouchEnd = () => setHoverIdx(null);

  return (
    <View
      ref={viewRef}
      onLayout={onLayout}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={color} stopOpacity={0.18} />
            <Stop offset="100%" stopColor={color} stopOpacity={0} />
          </LinearGradient>
        </Defs>

        {yTicks.map((t, i) => (
          <React.Fragment key={i}>
            <Line
              x1={padding.left} x2={padding.left + w}
              y1={t.y} y2={t.y}
              stroke={gridColor} strokeWidth={1} strokeDasharray="2,4"
            />
            <SvgText
              x={width - 4} y={t.y + 3}
              fontSize={10} fill={labelColor}
              textAnchor="end"
            >
              {krwShort(t.value)}
            </SvgText>
          </React.Fragment>
        ))}

        <Path d={areaD} fill={`url(#${gradId})`} />
        <Path d={pathD} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

        {points.map((p, i) => (
          <Circle
            key={i} cx={p.x} cy={p.y}
            r={i === points.length - 1 ? 4 : 0}
            fill={color}
            stroke={dark ? '#191F28' : '#fff'}
            strokeWidth={2}
          />
        ))}

        {xLabelIdxs.map((idx, k) => {
          const d = data[idx]?.date ?? '';
          const label = d.length > 7 ? d.slice(0, 7) : d;
          return (
            <SvgText
              key={k}
              x={padding.left + (idx / (data.length - 1)) * w}
              y={height - 6}
              textAnchor="middle"
              fontSize={9.5}
              fill={labelColor}
            >
              {label.slice(2)}
            </SvgText>
          );
        })}

        {hp && (
          <>
            <Line
              x1={hp.x} x2={hp.x}
              y1={padding.top} y2={padding.top + h}
              stroke={color} strokeWidth={1} strokeDasharray="3,3" opacity={0.5}
            />
            <Circle
              cx={hp.x} cy={hp.y} r={6}
              fill={color}
              stroke={dark ? '#191F28' : '#fff'}
              strokeWidth={2.5}
            />
            <Rect
              x={Math.max(8, Math.min(width - 110, hp.x - 50))}
              y={Math.max(2, hp.y - 38)}
              width={100} height={32} rx={6}
              fill={dark ? '#0F1115' : '#191F28'}
              opacity={0.95}
            />
            <SvgText
              x={Math.max(8, Math.min(width - 110, hp.x - 50)) + 50}
              y={Math.max(2, hp.y - 38) + 13}
              textAnchor="middle" fontSize={9.5}
              fill="rgba(255,255,255,0.6)"
            >
              {hp.date}
            </SvgText>
            <SvgText
              x={Math.max(8, Math.min(width - 110, hp.x - 50)) + 50}
              y={Math.max(2, hp.y - 38) + 26}
              textAnchor="middle" fontSize={11} fontWeight="700"
              fill="#fff"
            >
              {krwShort(hp.value)}원
            </SvgText>
          </>
        )}
      </Svg>
    </View>
  );
}
