import { View } from 'react-native';
import Svg, { Circle, G, Line, Rect, Text as SvgText } from 'react-native-svg';
import type { DayCandle, Levels } from '../../lib/laofus-trade-context';
import { useTheme } from '../../lib/theme';

function usd(v: number): string {
  return `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function f2(v: number): string {
  return String(+v.toFixed(2));
}

interface PriceLadderProps {
  width: number;
  levels: Levels;
  avg: number;
  /** 그날 아침 T와 분할 수 — 전반전이면 평단~별지점 사이가 "절반 매수" 구간 */
  T: number;
  splits: number;
  price: number;
  candle: DayCandle | null;
}

const H = 300;
const TOP = 18;
const BOT = 18;

/** 가격 사다리 — 전량매도선·별지점·평단 기준선 위에 그날 시세(시가↔종가 막대, 고저 세로선)와 체결가를 겹쳐 그린다 */
export default function PriceLadder({ width, levels, avg, T, splits, price, candle }: PriceLadderProps) {
  const theme = useTheme();
  const W = Math.max(280, width);
  const barW = 22;
  const barX = Math.round(W * 0.6);
  const rx = barX + barW + 8;
  const sell = theme.danger;
  const brand = theme.brand;
  const zoneSell = theme.dark ? 'rgba(255,107,119,0.14)' : 'rgba(240,68,82,0.10)';
  const zoneHalf = theme.dark ? 'rgba(91,157,255,0.10)' : 'rgba(49,130,246,0.07)';
  const zoneFull = theme.dark ? 'rgba(91,157,255,0.20)' : 'rgba(49,130,246,0.15)';

  const lv = [
    { k: 'full', label: '전량매도선', p: levels.full, color: sell },
    { k: 'star', label: '별지점', p: levels.star, color: sell },
    { k: 'avg', label: '평단', p: avg, color: brand },
  ];
  const prices = [...lv.map((l) => l.p), price, ...(candle ? [candle.h, candle.l] : [])];
  let hi = Math.max(...prices);
  let lo = Math.min(...prices);
  const pad = (hi - lo) * 0.07 || 1;
  hi += pad;
  lo -= pad;
  const Y = (v: number) => TOP + ((hi - v) / (hi - lo)) * (H - TOP - BOT);

  const firstHalf = T < splits / 2;
  const yStar = Y(levels.star);
  const yAvg = Y(avg);
  const yBuy = firstHalf ? yAvg : yStar;

  // 왼쪽 기준선 라벨 — 서로 겹치면 아래로 밀어냄
  const items = lv.map((l) => ({ ...l, y: Y(l.p) })).sort((a, b) => a.y - b.y);
  const ly = items.map((i) => i.y);
  for (let i = 1; i < ly.length; i++) if (ly[i]! - ly[i - 1]! < 26) ly[i] = ly[i - 1]! + 26;

  const yp = Y(price);
  const right: { t: string; y: number; bold?: boolean }[] = [{ t: `체결 ${usd(price)}`, y: yp, bold: true }];
  if (candle) {
    right.push({ t: `고 ${f2(candle.h)}`, y: Y(candle.h) }, { t: `저 ${f2(candle.l)}`, y: Y(candle.l) }, { t: `종 ${f2(candle.c)}`, y: Y(candle.c) });
  }
  right.sort((a, b) => a.y - b.y);
  const ry = right.map((r) => r.y + 4);
  for (let i = 1; i < ry.length; i++) if (ry[i]! - ry[i - 1]! < 14) ry[i] = ry[i - 1]! + 14;

  return (
    <View>
      <Svg width={W} height={H}>
        <Rect x={0} y={TOP - 8} width={W} height={Math.max(0, yStar - TOP + 8)} fill={zoneSell} rx={6} />
        {firstHalf && <Rect x={0} y={yStar} width={W} height={Math.max(0, yAvg - yStar)} fill={zoneHalf} />}
        <Rect x={0} y={yBuy} width={W} height={Math.max(0, H - BOT + 8 - yBuy)} fill={zoneFull} rx={6} />

        {items.map((it, i) => {
          const pct = (it.p / avg - 1) * 100;
          return (
            <G key={it.k}>
              <Line x1={0} x2={barX - 6} y1={it.y} y2={it.y} stroke={it.color} strokeWidth={1.3} strokeDasharray="4 3" />
              <SvgText x={6} y={ly[i]! - 5} fontSize={11.5} fontWeight="bold" fill={it.color}>
                {it.label}
              </SvgText>
              <SvgText x={barX - 12} y={ly[i]! - 5} fontSize={12} fontWeight="bold" textAnchor="end" fill={theme.text}>
                {usd(it.p)}
              </SvgText>
              {it.k !== 'avg' && (
                <SvgText x={barX - 12} y={ly[i]! + 9} fontSize={10} textAnchor="end" fill={theme.textMuted}>
                  {`평단 ${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`}
                </SvgText>
              )}
            </G>
          );
        })}

        {candle && (
          <>
            <Line x1={barX + barW / 2} x2={barX + barW / 2} y1={Y(candle.h)} y2={Y(candle.l)} stroke={theme.textMuted} strokeWidth={1.6} />
            <Rect
              x={barX}
              y={Math.min(Y(candle.o), Y(candle.c))}
              width={barW}
              height={Math.max(3, Math.abs(Y(candle.o) - Y(candle.c)))}
              rx={3}
              fill={candle.c >= candle.o ? sell : brand}
              opacity={0.8}
            />
          </>
        )}

        {right.map((r, i) => (
          <SvgText key={r.t} x={rx} y={ry[i]!} fontSize={r.bold ? 12 : 10.5} fontWeight={r.bold ? 'bold' : 'normal'} fill={r.bold ? theme.text : theme.textMuted}>
            {r.t}
          </SvgText>
        ))}
        <Line x1={barX - 4} x2={barX + barW + 4} y1={yp} y2={yp} stroke={theme.text} strokeWidth={1.8} />
        <Circle cx={barX + barW / 2} cy={yp} r={6.5} fill={theme.card} stroke={theme.text} strokeWidth={2.6} />
      </Svg>
    </View>
  );
}
