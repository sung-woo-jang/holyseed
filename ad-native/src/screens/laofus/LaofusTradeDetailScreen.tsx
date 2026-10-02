import { useMemo, useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/common/EmptyState';
import PriceLadder from './PriceLadder';
import ChartLegend from '../../components/charts/ChartLegend';
import TGauge from './TGauge';
import { laofusRestApi } from '../../api/laofus';
import {
  ERA_LABEL,
  describeOrders,
  dayStartTrade,
  eraOf,
  findCandle,
  isMergedLegs,
  levelsFor,
  sameDayOrders,
  splitsAt,
  stateAfter,
  stateBefore,
  whyLines,
  type OrderOutcome,
  type WhySegment,
} from '../../lib/laofus-trade-context';
import { useTheme } from '../../lib/theme';
import { TE } from '../../lib/toss-emoji';
import type { StrategyStackParamList } from '../../navigation/StrategyStack';

type Props = NativeStackScreenProps<StrategyStackParamList, 'LaofusTradeDetail'>;

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function n(v: string | number | null | undefined): number {
  return Number(v ?? 0);
}
function usd(v: number, d = 2): string {
  const s = Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  return `${v < 0 ? '−' : ''}$${s}`;
}
function f2(v: number): string {
  return String(+v.toFixed(2));
}
function md(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return `${m}/${d} (${WEEKDAYS[new Date(y!, m! - 1, d!).getDay()]})`;
}
function qtyText(q: number): string {
  return Number.isInteger(q) ? String(q) : q.toFixed(5).replace(/0+$/, '');
}

function Card({ title, right, children }: { title: string; right?: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.cardHead}>
        <Text style={{ color: theme.textMuted, fontSize: 12.5, fontWeight: '700' }}>{title}</Text>
        {right ? <Text style={{ color: theme.textMuted, fontSize: 11.5 }}>{right}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function Chip({ text, color, bg }: { text: string; color: string; bg: string }) {
  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      <Text style={{ color, fontSize: 11.5, fontWeight: '700' }}>{text}</Text>
    </View>
  );
}

export default function LaofusTradeDetailScreen({ route, navigation }: Props) {
  const theme = useTheme();
  const { cycleNo, tradeId } = route.params;
  const statusQ = useQuery({ queryKey: ['laofus-status'], queryFn: laofusRestApi.status });
  const candlesQ = useQuery({ queryKey: ['laofus-candles', 'all'], queryFn: () => laofusRestApi.candles('all'), staleTime: 10 * 60_000 });
  const ordersQ = useQuery({ queryKey: ['laofus-order-log'], queryFn: laofusRestApi.orderLog, staleTime: 60_000 });
  const [cardWidth, setCardWidth] = useState(Dimensions.get('window').width - 32 - 30);

  const cycle = statusQ.data?.cycles.find((c) => c.cycleNo === cycleNo);
  const trades = useMemo(() => [...(cycle?.trades ?? [])].sort((a, b) => a.seq - b.seq), [cycle]);
  const idx = trades.findIndex((t) => t.id === tradeId);
  const trade = idx >= 0 ? trades[idx]! : null;

  const view = useMemo(() => {
    if (!trade) return null;
    const era = eraOf(trade.date);
    const splits = splitsAt(trade.date);
    const startTrade = dayStartTrade(trades, trade);
    const start = stateBefore(startTrade);
    const levels = levelsFor(start, splits);
    const before = stateBefore(trade);
    const after = stateAfter(trade);
    const candle = candlesQ.data ? findCandle(candlesQ.data.candles, trade) : null;
    const logged = sameDayOrders(ordersQ.data ?? [], trade);
    const firstHalf = start.T < splits / 2;
    const orders = describeOrders({ rows: logged.orders, mineIds: logged.mineIds, levels, firstHalf, avg: start.avg, candle });
    const merged = isMergedLegs(trade);
    const why = whyLines({ trade, start, levels, splits, era, candle, orders, merged });
    return { era, splits, start, levels, before, after, candle, orders, merged, why };
  }, [trade, trades, candlesQ.data, ordersQ.data]);

  function onCardLayout(e: LayoutChangeEvent) {
    setCardWidth(e.nativeEvent.layout.width - 28);
  }
  function go(target: number | undefined) {
    const t = target != null ? trades[target] : undefined;
    if (t) navigation.setParams({ tradeId: t.id });
  }

  if (statusQ.isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <Loader size="large" />
      </View>
    );
  }
  if (!trade || !view) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <EmptyState iconCode={TE.search} title="체결 기록을 찾을 수 없어요" />
      </View>
    );
  }

  const { era, splits, start, levels, before, after, candle, orders, why } = view;
  const isBuy = trade.side === 'BUY';
  const sideColor = isBuy ? theme.brand : theme.danger;
  const sideSoft = isBuy ? theme.brandSoft : theme.dark ? '#3A1A1E' : '#FDECEE';
  const principal = n(cycle?.principal);
  const mineOrder = orders.find((o) => o.mine);
  const heroKind = view.merged
    ? '별지점·평단 LOC 매수 2건 체결'
    : era === 'LOC' && mineOrder
      ? `${mineOrder.title.replace(/^(매수|매도) · /, '')} ${isBuy ? '매수' : '매도'} 체결`
      : era === 'MARKET'
        ? `${trade.kind} 체결 · 시장가`
        : `${trade.kind} 체결`;
  const sameDay = trades.filter((t) => t.date === trade.date && t.id !== trade.id);
  const qty = n(trade.quantity);
  const plPct = candle && after.quantity > 0.0001 && after.avg ? ((candle.c - after.avg) / after.avg) * 100 : null;
  const plAmt = candle && after.quantity > 0.0001 && after.avg ? after.quantity * (candle.c - after.avg) : null;
  const invested = principal > 0 ? ((principal - after.cash) / principal) * 100 : null;
  const chg = candle && candle.prevClose ? (candle.c / candle.prevClose - 1) * 100 : null;
  const outcomeStyle = (o: OrderOutcome) =>
    o === '체결'
      ? { color: theme.brand, bg: theme.brandSoft }
      : o === '거부'
        ? { color: theme.danger, bg: theme.dark ? '#3A1A1E' : '#FDECEE' }
        : { color: theme.textMuted, bg: theme.bg };

  function renderSegments(segs: WhySegment[]) {
    return segs.map((s, i) => (
      <Text key={i} style={s.bold ? { fontWeight: '800', color: theme.text } : undefined}>
        {s.text}
      </Text>
    ));
  }

  return (
    <ScrollView style={[styles.root, { backgroundColor: theme.bg }]} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <View style={styles.navRow}>
        <Pressable disabled={idx <= 0} hitSlop={8} onPress={() => go(idx - 1)} style={[styles.navBtn, idx <= 0 && { opacity: 0.3 }]}>
          <Text style={{ color: theme.text, fontSize: 20 }}>‹</Text>
        </Pressable>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: theme.text, fontSize: 15, fontWeight: '800' }}>
            {cycleNo}차 사이클 · {trade.seq}차 거래
          </Text>
          <Text style={{ color: theme.textMuted, fontSize: 11.5, marginTop: 2 }}>
            {md(trade.date)} 반영 · 전체 {trades.length}건 중 {idx + 1}
          </Text>
        </View>
        <Pressable disabled={idx >= trades.length - 1} hitSlop={8} onPress={() => go(idx + 1)} style={[styles.navBtn, idx >= trades.length - 1 && { opacity: 0.3 }]}>
          <Text style={{ color: theme.text, fontSize: 20 }}>›</Text>
        </Pressable>
      </View>

      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.chipRow}>
          <Chip text={isBuy ? '매수' : trade.kind} color={sideColor} bg={sideSoft} />
          <Chip text={ERA_LABEL[era]} color={theme.textMuted} bg={theme.bg} />
        </View>
        <Text style={{ color: theme.textMuted, fontSize: 13, fontWeight: '700', marginTop: 8 }}>{heroKind}</Text>
        <Text style={{ color: theme.text, fontSize: 38, fontWeight: '800', letterSpacing: -1, marginTop: 2 }}>{usd(n(trade.price))}</Text>
        <View style={styles.heroRow}>
          <Text style={{ color: theme.textMuted, fontSize: 12.5 }}>
            수량 <Text style={{ color: theme.text, fontWeight: '800' }}>{qtyText(qty)}주</Text>
          </Text>
          <Text style={{ color: theme.textMuted, fontSize: 12.5 }}>
            금액 <Text style={{ color: theme.text, fontWeight: '800' }}>{usd(n(trade.amount))}</Text>
          </Text>
          {candle ? <Text style={{ color: theme.textMuted, fontSize: 12.5 }}>미국 {md(candle.date)} 장</Text> : null}
        </View>
        {sameDay.length > 0 && (
          <View style={[styles.chipRow, { marginTop: 12 }]}>
            <Text style={{ color: theme.textMuted, fontSize: 11.5, alignSelf: 'center' }}>같은 날</Text>
            {sameDay.map((t) => (
              <Pressable key={t.id} onPress={() => navigation.setParams({ tradeId: t.id })}>
                <Chip text={`${t.seq}차 ${t.kind}`} color={theme.brand} bg={theme.brandSoft} />
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {levels && start.avg != null && (
        <View onLayout={onCardLayout}>
          <Card title="가격 사다리" right={candle ? `미국 ${md(candle.date)} 장` : '시세 정보 없음'}>
            <PriceLadder width={cardWidth} levels={levels} avg={start.avg} T={start.T} splits={splits} price={n(trade.price)} candle={candle} />
            <ChartLegend
              items={[
                { kind: 'area', color: theme.danger, alpha: '33', label: '매도 구간 (별지점 위)' },
                ...(start.T < splits / 2 ? [{ kind: 'area' as const, color: theme.brand, alpha: '22', label: '절반 매수 구간' }] : []),
                { kind: 'area', color: theme.brand, alpha: '44', label: '전액 매수 구간' },
                { kind: 'dash', color: theme.danger, label: '별지점 · 전량매도선' },
                { kind: 'dash', color: theme.brand, label: '평단' },
                { kind: 'dot', color: theme.text, label: '이 체결가' },
              ]}
              hint={`점선은 그날 아침 기준선이에요. 오른쪽 막대는 그날 시세(시가→종가, 빨강=상승·파랑=하락, 세로선은 고저)이고 ${splits}분할 기준이에요.`}
            />
            {!candle && era !== 'MIGRATED' ? (
              <Text style={{ color: theme.textMuted, fontSize: 11.5, marginTop: 4 }}>이 날의 일봉을 찾지 못해 시세는 표시하지 않았어요.</Text>
            ) : null}
          </Card>
        </View>
      )}

      <Card title="T 게이지" right={levels ? `별% = ${f2(levels.starPct * 100).replace('-', '−')}%` : undefined}>
        <TGauge width={cardWidth} splits={splits} tBefore={n(trade.tBefore)} tAfter={n(trade.tAfter)} />
      </Card>

      <Card title="판단 근거">
        <View style={{ gap: 9 }}>
          {why.map((segs, i) => (
            <View key={i} style={styles.whyRow}>
              <View style={[styles.bullet, { backgroundColor: theme.brand }]} />
              <Text style={{ flex: 1, color: theme.textMuted, fontSize: 13, lineHeight: 20 }}>{renderSegments(segs)}</Text>
            </View>
          ))}
        </View>
      </Card>

      {orders.length > 0 && (
        <Card title="그날 걸린 주문" right={`${orders.length}건`}>
          <View style={{ gap: 8 }}>
            {orders.map((o) => {
              const st = outcomeStyle(o.outcome);
              return (
                <View
                  key={o.key}
                  style={[styles.orderRow, { backgroundColor: o.mine ? theme.brandSoft : theme.bg }, o.mine && { borderWidth: 1.5, borderColor: theme.brand }]}
                >
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ color: theme.text, fontSize: 12.5, fontWeight: '800' }}>{o.title}</Text>
                    <Text style={{ color: theme.textMuted, fontSize: 11.5, marginTop: 2 }}>{o.detail}</Text>
                  </View>
                  <Chip text={o.outcome} color={st.color} bg={st.bg} />
                </View>
              );
            })}
          </View>
          {era === 'LOC' && <Text style={{ color: theme.textMuted, fontSize: 11.5, marginTop: 8 }}>매도 지정가는 평단·T로 재계산한 값, 매수 지정가는 주문 기록 값이에요.</Text>}
        </Card>
      )}

      <Card title="체결 전 → 후">
        <View style={styles.kvHead}>
          <Text style={[styles.kvL, { color: theme.textMuted }]} />
          <Text style={[styles.kvV, { color: theme.textMuted, fontSize: 11.5, fontWeight: '700' }]}>전</Text>
          <Text style={[styles.kvV, { color: theme.textMuted, fontSize: 11.5, fontWeight: '700' }]}>후</Text>
        </View>
        {[
          { l: 'T', a: String(before.T), b: String(after.T) },
          { l: '보유수량', a: before.quantity.toFixed(3), b: after.quantity.toFixed(3) },
          { l: '평단', a: before.avg != null ? usd(before.avg) : '—', b: after.avg != null ? usd(after.avg) : '—' },
          { l: '잔금', a: usd(before.cash), b: usd(after.cash), neg: after.cash < 0 },
        ].map((r) => (
          <View key={r.l} style={styles.kvRow}>
            <Text style={[styles.kvL, { color: theme.textMuted }]}>{r.l}</Text>
            <Text style={[styles.kvV, { color: theme.text }]}>{r.a}</Text>
            <Text style={[styles.kvV, { color: r.neg ? theme.danger : theme.text, fontWeight: '800' }]}>{r.b}</Text>
          </View>
        ))}
        <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 8, lineHeight: 18 }}>
          {plPct != null && plAmt != null && candle ? (
            <>
              그날 종가 {usd(candle.c)} 기준 평가손익{' '}
              <Text style={{ color: plPct >= 0 ? theme.brand : theme.danger, fontWeight: '800' }}>
                {plPct >= 0 ? '+' : ''}
                {plPct.toFixed(2)}% ({plAmt >= 0 ? '+' : '−'}
                {usd(Math.abs(plAmt))})
              </Text>
              {' · '}
            </>
          ) : null}
          {invested != null ? (
            <>
              원금 대비 투입 <Text style={{ color: theme.text, fontWeight: '800' }}>{invested.toFixed(0)}%</Text>
              {after.cash < 0 ? ' (원금 초과)' : ''}
            </>
          ) : null}
        </Text>
        {trade.note ? <Text style={{ color: theme.textMuted, fontSize: 11.5, marginTop: 6, fontStyle: 'italic' }}>{trade.note}</Text> : null}
      </Card>

      {candle && (
        <Card title="그날 시세" right={`미국 ${md(candle.date)}`}>
          <View style={styles.ohlc}>
            {[
              ['시가', candle.o],
              ['고가', candle.h],
              ['저가', candle.l],
              ['종가', candle.c],
            ].map(([label, v]) => (
              <View key={label as string} style={[styles.ohlcCell, { backgroundColor: theme.bg }]}>
                <Text style={{ color: theme.textMuted, fontSize: 10.5 }}>{label}</Text>
                <Text style={{ color: theme.text, fontSize: 13, fontWeight: '800', marginTop: 2 }}>{f2(v as number)}</Text>
              </View>
            ))}
          </View>
          {chg != null && candle.prevClose != null ? (
            <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 8 }}>
              전일 종가 {usd(candle.prevClose)} 대비{' '}
              <Text style={{ color: chg >= 0 ? theme.danger : theme.brand, fontWeight: '800' }}>
                {chg >= 0 ? '+' : ''}
                {chg.toFixed(2)}%
              </Text>
            </Text>
          ) : null}
        </Card>
      )}

      <View style={styles.footerRow}>
        <Pressable disabled={idx <= 0} onPress={() => go(idx - 1)} style={[styles.footBtn, { backgroundColor: theme.card, borderColor: theme.border }, idx <= 0 && { opacity: 0.35 }]}>
          <Text style={{ color: theme.text, fontSize: 13, fontWeight: '700' }}>‹ {idx > 0 ? `${trades[idx - 1]!.seq}차` : '처음'}</Text>
        </Pressable>
        <Pressable
          disabled={idx >= trades.length - 1}
          onPress={() => go(idx + 1)}
          style={[styles.footBtn, { backgroundColor: theme.card, borderColor: theme.border }, idx >= trades.length - 1 && { opacity: 0.35 }]}
        >
          <Text style={{ color: theme.text, fontSize: 13, fontWeight: '700' }}>{idx < trades.length - 1 ? `${trades[idx + 1]!.seq}차 ›` : '마지막 거래'}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  navBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  card: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 10 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  chipRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999 },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  legend: { flexDirection: 'row', gap: 12, marginTop: 8, flexWrap: 'wrap' },
  whyRow: { flexDirection: 'row', gap: 8 },
  bullet: { width: 5, height: 5, borderRadius: 3, marginTop: 8 },
  orderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 12 },
  kvHead: { flexDirection: 'row', marginBottom: 4 },
  kvRow: { flexDirection: 'row', paddingVertical: 4 },
  kvL: { width: 70, fontSize: 13 },
  kvV: { flex: 1, textAlign: 'right', fontSize: 13 },
  ohlc: { flexDirection: 'row', gap: 8 },
  ohlcCell: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10 },
  footerRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  footBtn: { flex: 1, alignItems: 'center', paddingVertical: 13, borderRadius: 12, borderWidth: 1 },
});
