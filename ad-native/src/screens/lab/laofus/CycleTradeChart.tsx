import { useState } from 'react';
import { Text, View, type GestureResponderEvent } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import type { TradeDto } from '../../../api/laofus';
import { useTheme } from '../../../lib/theme';

function n(v: string | number | null | undefined): number {
  return Number(v ?? 0);
}
function usd(v: number, d = 2): string {
  return `$${v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })}`;
}
function kstDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric' });
}

/** SVG 차트 끝점 라벨이 플롯 영역 밖으로 잘리지 않도록 y좌표를 경계 안으로 고정 */
function clampLabelY(y: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, y));
}
/** 두 라벨의 y좌표가 minGap보다 가까우면 중간점 기준으로 서로 밀어내 겹침을 방지 */
function resolveLabelPair(y1: number, y2: number, minGap: number): [number, number] {
  const gap = y2 - y1;
  if (Math.abs(gap) >= minGap) return [y1, y2];
  const mid = (y1 + y2) / 2;
  const half = minGap / 2;
  return gap >= 0 ? [mid - half, mid + half] : [mid + half, mid - half];
}

const AVG_COLOR = '#A78BFA';

interface CycleTradeChartProps {
  trades: TradeDto[];
  width: number;
}

/** 사이클 내 체결가 vs 평단 라인차트 (lab-front CycleChart.tsx 이식 — 마우스 호버 대신 터치) */
export default function CycleTradeChart({ trades, width }: CycleTradeChartProps) {
  const theme = useTheme();
  const [hover, setHover] = useState<number | null>(null);

  const pts = trades.filter((t) => t.kind !== '이월');
  if (pts.length < 2) return null;

  const W = Math.max(280, width);
  const H = 240;
  const PAD = { l: 48, r: 76, t: 16, b: 28 };
  const xs = (i: number) => PAD.l + (i / (pts.length - 1)) * (W - PAD.l - PAD.r);
  const prices = pts.flatMap((t) => [n(t.price), n(t.avgAfter)]);
  const yMin = Math.floor(Math.min(...prices) / 20) * 20;
  const yMax = Math.ceil(Math.max(...prices) / 20) * 20;
  const ys = (v: number) => PAD.t + (1 - (v - yMin) / (yMax - yMin || 1)) * (H - PAD.t - PAD.b);
  const path = (get: (t: TradeDto) => number) =>
    pts.map((t, i) => `${i === 0 ? 'M' : 'L'}${xs(i).toFixed(1)},${ys(get(t)).toFixed(1)}`).join(' ');

  const ticks: number[] = [];
  for (let v = yMin; v <= yMax; v += Math.max(20, Math.round((yMax - yMin) / 4 / 20) * 20)) ticks.push(v);

  const last = pts[pts.length - 1]!;
  const hv = hover !== null ? pts[hover] : null;

  let lastLabelX = -Infinity;
  let stack = 0;
  const sellLabels = pts
    .map((t, i) => ({ t, i }))
    .filter(({ t }) => t.side === 'SELL')
    .map(({ t, i }) => {
      const x = xs(i);
      const y = ys(n(t.price));
      stack = x - lastLabelX < 60 ? stack + 1 : 0;
      lastLabelX = x;
      const labelY = clampLabelY(y - 40 - stack * 36, PAD.t + 18, y - 22);
      // 매도 시 평단은 변동 없음(엔진 로직) → avgAfter가 곧 이 매도분의 원가
      const profit = (n(t.price) - n(t.avgAfter)) * n(t.quantity);
      const text = `${t.kind} ${usd(n(t.price))}`;
      const profitText = `${profit >= 0 ? '+' : ''}${usd(profit)}`;
      const boxW = Math.max(text.length, profitText.length) * 6 + 12;
      return { x, y, labelY, text, profitText, profit, boxW };
    });

  function pickIndex(locationX: number) {
    const rel = (locationX - PAD.l) / (W - PAD.l - PAD.r);
    const idx = Math.round(rel * (pts.length - 1));
    setHover(Math.max(0, Math.min(pts.length - 1, idx)));
  }
  function handleTouch(e: GestureResponderEvent) {
    pickIndex(e.nativeEvent.locationX);
  }

  const gridColor = theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const priceColor = theme.brand;

  return (
    <View>
      <View style={{ flexDirection: 'row', gap: 16, marginBottom: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <View style={{ width: 12, height: 3, borderRadius: 2, backgroundColor: priceColor }} />
          <Text style={{ fontSize: 11.5, color: theme.textMuted }}>체결가</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <View style={{ width: 12, height: 3, borderRadius: 2, backgroundColor: AVG_COLOR }} />
          <Text style={{ fontSize: 11.5, color: theme.textMuted }}>평단</Text>
        </View>
      </View>

      <View
        style={{ width: W, height: H }}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={handleTouch}
        onResponderMove={handleTouch}
        onResponderRelease={() => setHover(null)}
      >
        <Svg width={W} height={H}>
          {ticks.map((v) => (
            <G key={v}>
              <Line x1={PAD.l} x2={W - PAD.r} y1={ys(v)} y2={ys(v)} stroke={gridColor} strokeWidth={1} />
              <SvgText x={PAD.l - 6} y={ys(v) + 4} textAnchor="end" fontSize={10} fill={theme.textMuted}>
                {v}
              </SvgText>
            </G>
          ))}
          <Line x1={PAD.l} x2={W - PAD.r} y1={H - PAD.b} y2={H - PAD.b} stroke={theme.border} strokeWidth={1} />

          {pts.map((t, i) =>
            i % Math.ceil(pts.length / 8) === 0 || i === pts.length - 1 ? (
              <SvgText key={i} x={xs(i)} y={H - PAD.b + 14} textAnchor="middle" fontSize={10} fill={theme.textMuted}>
                {kstDate(t.date)}
              </SvgText>
            ) : null,
          )}

          {hv && (
            <Line
              x1={xs(hover as number)}
              x2={xs(hover as number)}
              y1={PAD.t}
              y2={H - PAD.b}
              stroke={theme.textMuted}
              strokeWidth={1}
              strokeDasharray="3,3"
            />
          )}

          <Path d={path((t) => n(t.avgAfter))} fill="none" stroke={AVG_COLOR} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          <Path d={path((t) => n(t.price))} fill="none" stroke={priceColor} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

          {pts.map((t, i) => (
            <G key={i}>
              <Circle cx={xs(i)} cy={ys(n(t.price))} r={hover === i ? 5 : 4} fill={priceColor} stroke={theme.card} strokeWidth={2} />
              <Circle cx={xs(i)} cy={ys(n(t.avgAfter))} r={hover === i ? 5 : 4} fill={AVG_COLOR} stroke={theme.card} strokeWidth={2} />
            </G>
          ))}

          {sellLabels.map((s, idx) => (
            <G key={idx}>
              <Line x1={s.x} x2={s.x} y1={s.y - 6} y2={s.labelY + 16} stroke={theme.danger} strokeWidth={1} strokeDasharray="2,2" />
              <Rect x={s.x - s.boxW / 2} y={s.labelY - 18} width={s.boxW} height={32} rx={4} fill={theme.card} stroke={theme.danger} strokeWidth={1} />
              <SvgText x={s.x} y={s.labelY - 5} textAnchor="middle" fontSize={11} fontWeight="700" fill={theme.danger}>
                {s.text}
              </SvgText>
              <SvgText x={s.x} y={s.labelY + 10} textAnchor="middle" fontSize={11} fontWeight="700" fill={s.profit >= 0 ? theme.brand : theme.danger}>
                {s.profitText}
              </SvgText>
            </G>
          ))}

          {(() => {
            const [priceY, avgY] = resolveLabelPair(ys(n(last.price)), ys(n(last.avgAfter)), 14);
            const clamp = (y: number) => clampLabelY(y, PAD.t + 8, H - PAD.b - 2);
            return (
              <G>
                <SvgText x={xs(pts.length - 1) + 8} y={clamp(priceY) + 4} fontSize={11} fill={theme.text}>
                  {usd(n(last.price))}
                </SvgText>
                <SvgText x={xs(pts.length - 1) + 8} y={clamp(avgY) + 4} fontSize={11} fill={theme.text}>
                  {usd(n(last.avgAfter))}
                </SvgText>
              </G>
            );
          })()}

          {hv &&
            (() => {
              const boxW = 156;
              const boxH = 52;
              const bx = Math.max(4, Math.min(W - boxW - 4, xs(hover as number) - boxW / 2));
              const by = PAD.t + 4;
              return (
                <G>
                  <Rect x={bx} y={by} width={boxW} height={boxH} rx={8} fill={theme.dark ? '#0F1115' : '#191F28'} opacity={0.95} />
                  <SvgText x={bx + 10} y={by + 16} fontSize={10} fill="rgba(255,255,255,0.6)">
                    {`${hv.seq}차 · ${kstDate(hv.date)} · ${hv.kind}`}
                  </SvgText>
                  <SvgText x={bx + 10} y={by + 30} fontSize={10.5} fontWeight="700" fill="#fff">
                    {`체결가 ${usd(n(hv.price))} · 평단 ${usd(n(hv.avgAfter))}`}
                  </SvgText>
                  <SvgText x={bx + 10} y={by + 44} fontSize={9.5} fill="rgba(255,255,255,0.75)">
                    {`T ${n(hv.tBefore)}→${n(hv.tAfter)} · 잔금 ${usd(n(hv.cashAfter))}`}
                  </SvgText>
                </G>
              );
            })()}
        </Svg>
      </View>
    </View>
  );
}
