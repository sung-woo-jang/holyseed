import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

interface DonutSlice {
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutSlice[];
  size?: number;
  thickness?: number;
  dark?: boolean;
}

export default function DonutChart({ data, size = 180, thickness = 22, dark = false }: DonutChartProps) {
  const total = data.reduce((s, d) => s + Math.abs(d.value), 0) || 1;
  const r = size / 2 - thickness / 2;
  const cx = size / 2;
  const cy = size / 2;

  let cumulative = 0;
  const arcs = data.map(d => {
    const frac = Math.abs(d.value) / total;
    const start = cumulative;
    cumulative += frac;
    const end = cumulative;
    const startAngle = start * 2 * Math.PI - Math.PI / 2;
    const endAngle = end * 2 * Math.PI - Math.PI / 2;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = frac > 0.5 ? 1 : 0;
    return {
      d: `M${x1},${y1} A${r},${r} 0 ${largeArc} 1 ${x2},${y2}`,
      color: d.color,
      frac,
    };
  });

  return (
    <Svg width={size} height={size}>
      <Circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={dark ? 'rgba(255,255,255,0.06)' : '#F2F4F6'}
        strokeWidth={thickness}
      />
      {arcs.map((a, i) => (
        <Path
          key={i} d={a.d}
          fill="none"
          stroke={a.color}
          strokeWidth={thickness}
          strokeLinecap="butt"
        />
      ))}
    </Svg>
  );
}
