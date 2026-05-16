import React from 'react';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';
import { krwShort } from '../../lib/format';

interface WaterfallItem {
  label: string;
  value: number;
}

interface WaterfallChartProps {
  data: WaterfallItem[];
  width?: number;
  height?: number;
  dark?: boolean;
}

export default function WaterfallChart({ data, width = 327, height = 240, dark = false }: WaterfallChartProps) {
  const padding = { top: 38, right: 8, bottom: 56, left: 8 };
  const w = width - padding.left - padding.right;
  const h = height - padding.top - padding.bottom;

  const contribs = data.slice(1, -1);
  const maxContrib = Math.max(...contribs.map(c => Math.abs(c.value))) || 1;
  const contribMaxH = h * 0.55;
  const n = data.length;
  const stepX = w / n;
  const barW = stepX * 0.62;
  const gap = stepX * 0.38;

  const labelColor = dark ? 'rgba(255,255,255,0.5)' : '#8B95A1';
  const valColor = dark ? '#fff' : '#191F28';
  const baselineY = padding.top + h - 1;

  const cells = data.map((d, i) => {
    const x = padding.left + i * stepX + gap / 2;
    if (i === 0 || i === n - 1) {
      return { x, w: barW, yTop: padding.top, yBot: padding.top + h, value: d.value, label: d.label, type: 'total' as const };
    }
    const v = d.value;
    const barH = (Math.abs(v) / maxContrib) * contribMaxH;
    if (v >= 0) {
      return { x, w: barW, yTop: baselineY - barH, yBot: baselineY, value: v, label: d.label, type: 'pos' as const };
    }
    return { x, w: barW, yTop: baselineY, yBot: baselineY + barH, value: v, label: d.label, type: 'neg' as const };
  });

  return (
    <Svg width={width} height={height}>
      <Line
        x1={padding.left} x2={padding.left + w}
        y1={baselineY} y2={baselineY}
        stroke={dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}
        strokeWidth={1}
      />

      {cells.map((c, i) => {
        const color = c.type === 'total' ? '#3182F6' : c.type === 'pos' ? '#0AB39C' : '#EF4444';
        const barH = Math.max(3, c.yBot - c.yTop);
        const isTotal = c.type === 'total';
        const valLabel = isTotal ? krwShort(c.value) : (c.value > 0 ? '+' : '') + krwShort(c.value);
        return (
          <React.Fragment key={i}>
            <Rect
              x={c.x} y={c.yTop}
              width={c.w} height={barH}
              rx={3} fill={color}
              opacity={isTotal ? 1 : 0.9}
            />
            <SvgText
              x={c.x + c.w / 2}
              y={c.type === 'neg' ? c.yBot + 13 : c.yTop - 7}
              textAnchor="middle" fontSize={10.5}
              fill={isTotal ? valColor : color}
              fontWeight="700"
            >
              {valLabel}
            </SvgText>
            <SvgText
              x={c.x + c.w / 2}
              y={padding.top + h + 32}
              textAnchor="middle" fontSize={9.5}
              fill={labelColor}
            >
              {c.label}
            </SvgText>
          </React.Fragment>
        );
      })}

      <SvgText x={padding.left} y={14} fontSize={9.5} fill={labelColor}>
        총자산 (전체 높이)
      </SvgText>
      <SvgText x={padding.left + w} y={14} fontSize={9.5} fill={labelColor} textAnchor="end">
        기여도 (실제 비율)
      </SvgText>
    </Svg>
  );
}
