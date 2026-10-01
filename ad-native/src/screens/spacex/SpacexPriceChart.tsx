import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../../lib/theme';
import type { ChartPoint } from '../../lib/spacex-insights';

const H = 170;
const PAD = { l: 8, r: 58, t: 14, b: 22 };
const CURRENT_COLOR = '#FF3B30';

function dayNumber(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return Date.UTC(y!, m! - 1, d!) / 86_400_000;
}
function mmdd(date: string): string {
  return `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`;
}
function price2(v: number): string {
  return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface Extreme {
  price: number;
  date: string;
}

interface SpacexPriceChartProps {
  points: ChartPoint[];
  buys: Array<{ date: string; price: number }>;
  avgPrice: number | null;
  currentPrice: number | null;
  /** 전체 보기에서만 상장 후 고점·저점 표시 */
  high?: Extreme | null;
  low?: Extreme | null;
  width: number;
}

/** SPCX 일봉 종가 라인 + 내 매수 지점(●) + 평단(점선) + 현재가 */
export default function SpacexPriceChart({ points, buys, avgPrice, currentPrice, high, low, width }: SpacexPriceChartProps) {
  const theme = useTheme();
  if (points.length < 2) return null;

  const W = Math.max(240, width);
  const plotRight = W - PAD.r;
  const d0 = dayNumber(points[0]!.date);
  const d1 = dayNumber(points[points.length - 1]!.date);
  const xs = (date: string) => PAD.l + ((dayNumber(date) - d0) / Math.max(1, d1 - d0)) * (plotRight - PAD.l);

  const values = [...points.map((p) => p.close), ...(avgPrice !== null ? [avgPrice] : []), ...buys.map((b) => b.price)];
  const yMin = Math.min(...values) * 0.985;
  const yMax = Math.max(...values) * 1.015;
  const ys = (v: number) => PAD.t + ((yMax - v) / (yMax - yMin || 1)) * (H - PAD.t - PAD.b);

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${xs(p.date).toFixed(1)},${ys(p.close).toFixed(1)}`).join(' ');
  const area = `${line} L${xs(points[points.length - 1]!.date).toFixed(1)},${H - PAD.b} L${xs(points[0]!.date).toFixed(1)},${H - PAD.b} Z`;

  const gridColor = theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const lineColor = theme.dark ? '#9AA3B2' : '#4E5968';
  const last = points[points.length - 1]!;
  const lastY = ys(currentPrice ?? last.close);

  const avgLabel = avgPrice !== null ? `평단 ${price2(avgPrice)}` : '';
  const avgLabelW = avgLabel.length * 5.6 + 8;

  const extremes = [
    high && dayNumber(high.date) >= d0 ? { ...high, label: `고점 ${price2(high.price)}`, below: true } : null,
    low && dayNumber(low.date) >= d0 ? { ...low, label: `저점 ${price2(low.price)}`, below: false } : null,
  ].filter((e): e is Extreme & { label: string; below: boolean } => e !== null);

  return (
    <Svg width={W} height={H}>
      {[0, 0.5, 1].map((f) => {
        const y = PAD.t + f * (H - PAD.t - PAD.b);
        return <Line key={f} x1={PAD.l} x2={plotRight} y1={y} y2={y} stroke={gridColor} strokeWidth={1} />;
      })}
      <Path d={area} fill={theme.brand} opacity={0.08} />
      <Path d={line} fill="none" stroke={lineColor} strokeWidth={1.5} strokeLinejoin="round" />

      {avgPrice !== null && (
        <>
          <Line x1={PAD.l} x2={plotRight} y1={ys(avgPrice)} y2={ys(avgPrice)} stroke={theme.brand} strokeWidth={1.2} strokeDasharray="4,3" />
          <Rect x={PAD.l + 2} y={ys(avgPrice) - 15} width={avgLabelW} height={13} rx={3} fill={theme.card} opacity={0.9} />
          <SvgText x={PAD.l + 6} y={ys(avgPrice) - 5} fontSize={9} fontWeight="700" fill={theme.brand}>
            {avgLabel}
          </SvgText>
        </>
      )}

      {extremes.map((e) => {
        const x = xs(e.date);
        const y = ys(e.price);
        const anchorEnd = x > plotRight - 90;
        return (
          <G key={e.label}>
            <Circle cx={x} cy={y} r={2.4} fill={theme.textMuted} />
            <SvgText x={anchorEnd ? x - 5 : x + 5} y={e.below ? y + 11 : y - 5} fontSize={9} textAnchor={anchorEnd ? 'end' : 'start'} fill={theme.textMuted}>
              {e.label}
            </SvgText>
          </G>
        );
      })}

      {buys.map((b) => (
        <Circle key={b.date} cx={xs(b.date)} cy={ys(b.price)} r={3.4} fill={theme.brand} stroke={theme.card} strokeWidth={1.4} />
      ))}

      <Circle cx={xs(last.date)} cy={lastY} r={3.2} fill={CURRENT_COLOR} stroke={theme.card} strokeWidth={1.2} />
      <SvgText x={xs(last.date) + 7} y={lastY + 3.5} fontSize={10.5} fontWeight="800" fill={CURRENT_COLOR}>
        {price2(currentPrice ?? last.close)}
      </SvgText>

      <SvgText x={PAD.l} y={H - 5} fontSize={9} fill={theme.textMuted}>
        {mmdd(points[0]!.date)}
      </SvgText>
      <SvgText x={plotRight} y={H - 5} fontSize={9} textAnchor="end" fill={theme.textMuted}>
        {mmdd(last.date)}
      </SvgText>
    </Svg>
  );
}
