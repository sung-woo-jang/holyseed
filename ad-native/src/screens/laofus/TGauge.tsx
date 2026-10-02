import Svg, { Circle, Line, Rect, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../../lib/theme';

interface TGaugeProps {
  width: number;
  splits: number;
  tBefore: number;
  tAfter: number;
}

/** T 게이지 — 0~분할수 막대 위에 전반전·후반전·리버스 구간과 체결 전→후 T */
export default function TGauge({ width, splits, tBefore, tAfter }: TGaugeProps) {
  const theme = useTheme();
  const W = Math.max(280, width);
  const half = splits / 2;
  const x0 = 10;
  const x1 = W - 10;
  const y = 40;
  const h = 22;
  const X = (t: number) => x0 + (t / splits) * (x1 - x0);
  const zoneHalf = theme.dark ? 'rgba(91,157,255,0.10)' : 'rgba(49,130,246,0.07)';
  const zoneFull = theme.dark ? 'rgba(91,157,255,0.20)' : 'rgba(49,130,246,0.15)';
  const zoneSell = theme.dark ? 'rgba(255,107,119,0.14)' : 'rgba(240,68,82,0.10)';
  const xb = X(tBefore);
  const xa = X(tAfter);
  // 마커와 겹치는 구간 라벨은 옆으로 비킨다
  const lx = (x: number) => (Math.abs(x - xb) < 28 || Math.abs(x - xa) < 28 ? x + 34 : x);
  const mid = (xa + xb) / 2;

  return (
    <Svg width={W} height={92}>
      <Rect x={X(0)} y={y} width={X(half) - X(0)} height={h} rx={8} fill={zoneHalf} />
      <Rect x={X(half)} y={y} width={X(splits - 1) - X(half)} height={h} fill={zoneFull} />
      <Rect x={X(splits - 1)} y={y} width={X(splits) - X(splits - 1)} height={h} rx={8} fill={zoneSell} />
      <SvgText x={lx(X(half / 2))} y={y + 15} fontSize={11} textAnchor="middle" fill={theme.textMuted}>
        전반전
      </SvgText>
      <SvgText x={lx(X((half + splits - 1) / 2))} y={y + 15} fontSize={11} textAnchor="middle" fill={theme.textMuted}>
        후반전
      </SvgText>
      {[0, half, splits].map((t) => (
        <SvgText key={t} x={X(t)} y={y + h + 14} fontSize={10.5} textAnchor={t === 0 ? 'start' : t === splits ? 'end' : 'middle'} fill={theme.textMuted}>
          {String(t)}
        </SvgText>
      ))}
      <Line x1={xb} x2={xb} y1={y - 6} y2={y + h} stroke={theme.textMuted} strokeWidth={1.5} strokeDasharray="3 2" />
      <Line x1={xa} x2={xa} y1={y - 6} y2={y + h} stroke={theme.text} strokeWidth={2.2} />
      <Circle cx={xb} cy={y - 10} r={5} fill={theme.card} stroke={theme.textMuted} strokeWidth={2} />
      <Circle cx={xa} cy={y - 10} r={5.5} fill={theme.text} />
      <SvgText x={Math.min(Math.max(mid, 44), W - 44)} y={y - 22} fontSize={12} fontWeight="bold" textAnchor="middle" fill={theme.text}>
        {`T ${tBefore} → ${tAfter}`}
      </SvgText>
    </Svg>
  );
}
