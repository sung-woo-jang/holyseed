import { useMemo, useState } from 'react';
import { Dimensions, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/common/EmptyState';
import Segmented from '../../components/common/Segmented';
import { BandTrendChart, CompareChart, MixChart, PriceFillsChart, vrPalette } from '../../components/charts/VrTrendCharts';
import ChartLegend from '../../components/charts/ChartLegend';
import { vrApi } from '../../api/vr';
import {
  bandBoundaries,
  bandPosition,
  buildTrend,
  maxDrawdownPct,
  returnPct,
  summarizeCycles,
} from '../../lib/vr-trend';
import { BAND_STATE_LABEL, md, pct, usd } from '../../lib/vr-format';
import { useTheme } from '../../lib/theme';
import { TE } from '../../lib/toss-emoji';
import type { StrategyStackParamList } from '../../navigation/StrategyStack';
import QueryError from '../../components/common/QueryError';
import { VCalcBadges } from './VCalcCard';

type Props = NativeStackScreenProps<StrategyStackParamList, 'VrTrend'>;

const CHART_TABS = ['평가금·밴드', '가격·체결', '자산 구성'] as const;
type ChartTab = (typeof CHART_TABS)[number];

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

export default function VrTrendScreen({ navigation }: Props) {
  const theme = useTheme();
  const pal = vrPalette(theme);
  const cyclesQ = useQuery({ queryKey: ['vr-cycles'], queryFn: vrApi.cycles });
  const fillsQ = useQuery({ queryKey: ['vr-fills'], queryFn: vrApi.fills });
  const wealthQ = useQuery({ queryKey: ['vr-wealth-history'], queryFn: vrApi.wealthHistory });
  const candlesQ = useQuery({ queryKey: ['vr-candles', 'all'], queryFn: () => vrApi.candles('all'), staleTime: 10 * 60_000 });
  const stateQ = useQuery({ queryKey: ['vr-state'], queryFn: vrApi.state, refetchInterval: 30_000 });
  const priceQ = useQuery({ queryKey: ['vr-price'], queryFn: vrApi.price, refetchInterval: 60_000 });
  const [tab, setTab] = useState<ChartTab>('평가금·밴드');
  const [refreshing, setRefreshing] = useState(false);
  const [cardWidth, setCardWidth] = useState(Dimensions.get('window').width - 32 - 28);

  const cycles = cyclesQ.data ?? [];
  const fills = fillsQ.data ?? [];
  const candles = candlesQ.data?.candles ?? [];

  const points = useMemo(
    () => buildTrend({ fills, cycles, wealth: wealthQ.data ?? [], candles }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fillsQ.data, cyclesQ.data, wealthQ.data, candlesQ.data],
  );
  const summaries = useMemo(() => summarizeCycles(cycles, fills, points), [cycles, fills, points]);

  async function onRefresh() {
    setRefreshing(true);
    try {
      await Promise.all([cyclesQ.refetch(), fillsQ.refetch(), wealthQ.refetch(), candlesQ.refetch(), stateQ.refetch(), priceQ.refetch()]);
    } finally {
      setRefreshing(false);
    }
  }

  if (cyclesQ.isLoading || fillsQ.isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <Loader size="large" />
      </View>
    );
  }
  if ((cyclesQ.isError && !cyclesQ.data) || (fillsQ.isError && !fillsQ.data)) return <QueryError onRetry={() => { void cyclesQ.refetch(); void fillsQ.refetch(); }} />;
  if (cycles.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <EmptyState iconCode={TE.chartBar} title="등록된 사이클이 없어요" />
      </View>
    );
  }

  const last = points[points.length - 1] ?? null;
  const vrRet = last ? returnPct(last.tot, last.prin) : null;
  const bmRet = last ? returnPct(last.bench, last.prin) : null;
  const vrMdd = maxDrawdownPct(points, (p) => p.tot);
  const bmMdd = maxDrawdownPct(points, (p) => p.bench);
  const profit = last ? last.tot - last.prin : null;
  const hasEst = points.some((p) => p.est);
  const estRange = hasEst ? `${md(points.find((p) => p.est)!.date)}~${md([...points].reverse().find((p) => p.est)!.date)}` : '';

  const state = stateQ.data;
  const price = priceQ.data?.price ?? null;
  const openCycle = cycles.find((c) => !c.isClosed) ?? null;
  const marketValue = state && price != null ? state.quantity * price : last?.val ?? null;
  const boundaries =
    state && price != null ? bandBoundaries({ quantity: state.quantity, minBand: state.minBand, maxBand: state.maxBand, price }) : null;
  const pos = state && marketValue != null ? bandPosition(marketValue, state.minBand, state.maxBand) : null;
  const midPos = state ? (state.vValue - state.minBand) / (state.maxBand - state.minBand || 1) : null;
  const cashPct = state && marketValue != null ? (state.pool / (state.pool + marketValue)) * 100 : last ? (last.pool / last.tot) * 100 : null;
  const outsideNow = state && marketValue != null ? (marketValue < state.minBand ? 'below' : marketValue > state.maxBand ? 'above' : 'inside') : null;

  const lastDate = points[points.length - 1]?.date ?? '';
  const estimateNote = hasEst ? `${estRange}는 일봉(보유수량 × 종가)으로 복원한 추정치예요 (실제 스냅샷과 평균 약 0.5% 차이)` : '';
  const linesForPrice = state && openCycle ? { buy: state.minBand / Math.max(state.quantity, 1), sell: state.maxBand / Math.max(state.quantity, 1), startDate: openCycle.startDate } : undefined;
  const chartW = cardWidth;

  function onLayout(e: LayoutChangeEvent) {
    setCardWidth(e.nativeEvent.layout.width - 28);
  }

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: theme.bg }]}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.brand} colors={[theme.brand]} />}
    >
      {last && vrRet != null && profit != null && (
        <View onLayout={onLayout}>
          <Card title="결론" right={`입금 ${usd(last.prin, 0)} 기준`}>
            <View style={styles.heroRow}>
              <View>
                <Text style={{ color: theme.textMuted, fontSize: 11.5 }}>계좌총액</Text>
                <Text style={{ color: theme.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.5 }}>{usd(last.tot, 0)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: theme.textMuted, fontSize: 11.5 }}>수익률 · 수익금</Text>
                <Text style={{ color: vrRet >= 0 ? theme.brand : theme.danger, fontSize: 28, fontWeight: '800', letterSpacing: -0.5 }}>{pct(vrRet)}</Text>
                <Text style={{ color: vrRet >= 0 ? theme.brand : theme.danger, fontSize: 12, fontWeight: '700' }}>
                  {profit >= 0 ? '+' : '−'}
                  {usd(Math.abs(profit), 0)}
                </Text>
              </View>
            </View>
            {bmRet != null && (
              <View style={styles.chipRow}>
                <View style={[styles.chip, { backgroundColor: vrRet - bmRet >= 0 ? theme.brandSoft : theme.dark ? '#3A1A1E' : '#FDECEE' }]}>
                  <Text style={{ color: vrRet - bmRet >= 0 ? theme.brand : theme.danger, fontSize: 11.5, fontWeight: '800' }}>
                    단순 매수 대비 {pct(vrRet - bmRet)}p
                  </Text>
                </View>
                {vrMdd != null && bmMdd != null && (
                  <View style={[styles.chip, { backgroundColor: theme.bg }]}>
                    <Text style={{ color: theme.textMuted, fontSize: 11.5, fontWeight: '700' }}>
                      원금 대비 최대 낙폭 {vrMdd.toFixed(0).replace('-', '−')}% (단순 {bmMdd.toFixed(0).replace('-', '−')}%)
                    </Text>
                  </View>
                )}
              </View>
            )}
            {points.length > 1 && bmRet != null && (
              <View style={{ marginTop: 8 }}>
                <CompareChart points={points} width={chartW} height={120} />
                <ChartLegend
                  items={[
                    { kind: 'line', color: pal.line, label: 'VR (내 계좌)', value: pct(vrRet) },
                    { kind: 'dash', color: pal.label, label: '입금 즉시 전액 매수했다면', value: pct(bmRet) },
                  ]}
                  hint="둘 다 원금 대비 수익률(%)이에요. 점선보다 위면 VR이 더 잘한 거예요."
                />
              </View>
            )}
            <View style={styles.miniGrid}>
              {[
                ['TQQQ 평가금', usd(last.val, 0)],
                ['Pool', usd(last.pool, 0)],
                ['투자금', usd(last.prin, 0)],
              ].map(([k, v]) => (
                <View key={k} style={[styles.mini, { backgroundColor: theme.bg }]}>
                  <Text style={{ color: theme.textMuted, fontSize: 10.5 }}>{k}</Text>
                  <Text style={{ color: theme.text, fontSize: 13, fontWeight: '800', marginTop: 2 }}>{v}</Text>
                </View>
              ))}
            </View>
            <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 8 }}>
              {lastDate} 기준 · 단순 매수는 입금한 날 종가에 TQQQ를 전액 사서 보유한 경우(수수료·환율 제외)
            </Text>
          </Card>
        </View>
      )}

      {state && state.cycle && marketValue != null && pos != null && midPos != null && (
        <Card title="지금 위치" right={`사이클 ${state.cycle.cycleNo} · 진행중`}>
          <View style={[styles.track, { backgroundColor: theme.border }]}>
            <View style={[styles.trackMid, { left: `${midPos * 100}%`, backgroundColor: theme.dark ? '#A594FF' : '#7A5FD0' }]} />
            <View
              style={[
                styles.marker,
                { left: `${pos * 100}%`, backgroundColor: theme.card, borderColor: outsideNow === 'inside' ? (theme.dark ? '#35D6BD' : '#0E8F7E') : theme.danger },
              ]}
            />
          </View>
          <View style={styles.gaugeLabels}>
            <Text style={{ color: theme.textMuted, fontSize: 11 }}>최소 {usd(state.minBand, 0)}</Text>
            <Text style={{ color: theme.textMuted, fontSize: 11 }}>V {usd(state.vValue, 0)}</Text>
            <Text style={{ color: theme.textMuted, fontSize: 11 }}>최대 {usd(state.maxBand, 0)}</Text>
          </View>
          <Text style={{ color: theme.text, fontSize: 12.5, fontWeight: '700', marginTop: 8 }}>
            평가금 {usd(marketValue, 0)} · {BAND_STATE_LABEL[outsideNow ?? 'inside']}
          </Text>
          {boundaries && (
            <View style={styles.twoCol}>
              <View style={[styles.boundary, { backgroundColor: theme.bg }]}>
                <Text style={{ color: theme.textMuted, fontSize: 11 }}>매수 구간까지</Text>
                <Text style={{ color: theme.brand, fontSize: 17, fontWeight: '800', marginTop: 2 }}>{usd(boundaries.buyPrice)}</Text>
                <Text style={{ color: theme.textMuted, fontSize: 11.5 }}>TQQQ {pct(boundaries.buyDistancePct)}</Text>
              </View>
              <View style={[styles.boundary, { backgroundColor: theme.bg }]}>
                <Text style={{ color: theme.textMuted, fontSize: 11 }}>매도 구간까지</Text>
                <Text style={{ color: theme.danger, fontSize: 17, fontWeight: '800', marginTop: 2 }}>{usd(boundaries.sellPrice)}</Text>
                <Text style={{ color: theme.textMuted, fontSize: 11.5 }}>TQQQ {pct(boundaries.sellDistancePct)}</Text>
              </View>
            </View>
          )}
          {cashPct != null && (
            <View style={{ marginTop: 12 }}>
              <View style={[styles.cashBar, { backgroundColor: theme.border }]}>
                <View style={{ width: `${Math.max(0, Math.min(100, cashPct))}%`, height: '100%', backgroundColor: theme.dark ? '#35D6BD' : '#18A999' }} />
              </View>
              <Text style={{ color: theme.textMuted, fontSize: 11.5, marginTop: 6 }}>
                현금(Pool) <Text style={{ color: theme.text, fontWeight: '800' }}>{cashPct.toFixed(0)}%</Text> · {usd(state.pool, 0)} — 사용 가능 한도(사이클 시작 Pool의 {state.settings.poolLimitPct}% 중 남은 금액) 약 {usd(state.usablePool, 0)}
              </Text>
            </View>
          )}
        </Card>
      )}

      <Card title="차트">
        <Segmented options={[...CHART_TABS]} value={tab} onChange={(v) => setTab(v as ChartTab)} small />
        <View style={{ marginTop: 10 }}>
          {tab === '평가금·밴드' && <BandTrendChart points={points} cycles={cycles} width={chartW} />}
          {tab === '가격·체결' &&
            (candles.length > 1 ? (
              <PriceFillsChart candles={candles} fills={fills} from={points[0]?.date ?? fills[0]?.fillDate ?? ''} lines={linesForPrice} width={chartW} />
            ) : (
              <Text style={{ color: theme.textMuted, fontSize: 12.5 }}>일봉을 불러오지 못해 가격 차트를 그릴 수 없어요</Text>
            ))}
          {tab === '자산 구성' && <MixChart points={points} width={chartW} />}
        </View>
        {tab === '평가금·밴드' && (
          <ChartLegend
            items={[
              { kind: 'line', color: pal.line, label: '내 평가금 (TQQQ 보유분)' },
              { kind: 'band', color: pal.band, label: '사이클별 밴드 (V ±15%)' },
              { kind: 'dash', color: pal.band, label: 'V (사이클 기준값)' },
              { kind: 'dot', color: pal.out, label: '밴드 밖으로 나간 날' },
              ...(hasEst ? [{ kind: 'dash' as const, color: pal.line, label: '복원(추정) 구간' }] : []),
            ]}
            hint="띠 위 숫자는 사이클 번호예요. 평가금이 띠 아래로 가면 매수, 위로 가면 매도 신호예요. 그래프를 눌러 값을 볼 수 있어요."
          />
        )}
        {tab === '가격·체결' && (
          <ChartLegend
            items={[
              { kind: 'line', color: pal.label, label: 'TQQQ 종가' },
              { kind: 'line', color: pal.avg, label: '내 평단 (체결마다 바뀜)' },
              { kind: 'dot', color: theme.brand, label: '매수 체결 (클수록 수량 많음)' },
              ...(linesForPrice
                ? [
                    { kind: 'dash' as const, color: theme.brand, label: '이번 사이클 매수선' },
                    { kind: 'dash' as const, color: theme.danger, label: '이번 사이클 매도선' },
                  ]
                : []),
            ]}
            hint="매수선·매도선은 지금 보유수량으로 평가금이 밴드 끝에 닿는 TQQQ 가격이에요."
          />
        )}
        {tab === '자산 구성' && (
          <ChartLegend
            items={[
              { kind: 'area', color: pal.line, label: 'TQQQ 평가금' },
              { kind: 'area', color: pal.pool, label: 'Pool (현금)' },
              { kind: 'dash', color: theme.text, label: '누적 투자원금' },
            ]}
            hint="두 면을 합친 높이가 내 계좌 총자산이에요. 점선(원금)보다 위면 이익이에요."
          />
        )}
        {estimateNote ? <Text style={{ color: theme.textMuted, fontSize: 11.5, marginTop: 4 }}>{estimateNote}</Text> : null}
      </Card>

      <Card title="V 이력" right="눌러서 상세">
        {[...cycles].sort((a, b) => b.cycleNo - a.cycleNo).map((cycle, i) => {
          const c = cycle.vCalc;
          return (
            <Pressable
              key={cycle.id}
              onPress={() => navigation.navigate('VrCycleDetail', { cycleNo: cycle.cycleNo })}
              style={({ pressed }) => [styles.cycleRow, i > 0 && { borderTopWidth: 1, borderColor: theme.border }, pressed && { opacity: 0.6 }]}
            >
              <Text style={{ width: 24, color: theme.text, fontSize: 13, fontWeight: '800' }}>{cycle.cycleNo}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontSize: 13.5, fontWeight: '800' }}>{usd(cycle.vValue)}</Text>
                <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 2 }}>
                  {c?.growth != null
                    ? `${c.growth >= 0 ? '+' : ''}${usd(c.growth, 0)}${c.growthPct != null ? ` (${pct(c.growthPct)})` : ''} · Pool÷G ${usd(c.poolTerm ?? 0, 0)}${c.formula === 'SKILL' && c.evalTerm != null ? ` · 보정 ${c.evalTerm >= 0 ? '+' : '−'}${usd(Math.abs(c.evalTerm), 0)}` : ''} · 적립 ${usd(c.deposit, 0)}`
                    : `적립 ${usd(cycle.depositAmount, 0)}`}
                </Text>
              </View>
              <VCalcBadges calc={c} />
              <Text style={{ color: theme.textMuted, fontSize: 18 }}>›</Text>
            </Pressable>
          );
        })}
      </Card>

      <Card title="사이클" right="눌러서 상세">
        {summaries.map(({ cycle, endVal, endPool, state: st, position, buyCount, outDays, hasEstimate }, i) => (
          <Pressable
            key={cycle.id}
            onPress={() => navigation.navigate('VrCycleDetail', { cycleNo: cycle.cycleNo })}
            style={({ pressed }) => [styles.cycleRow, i > 0 && { borderTopWidth: 1, borderColor: theme.border }, pressed && { opacity: 0.6 }]}
          >
            <View style={{ width: 78 }}>
              <Text style={{ color: theme.text, fontSize: 13, fontWeight: '800' }}>사이클 {cycle.cycleNo}</Text>
              <Text style={{ color: theme.textMuted, fontSize: 11 }}>
                {md(cycle.startDate)}~{cycle.isClosed && cycle.endDate ? md(cycle.endDate) : '진행중'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={[styles.rowTrack, { backgroundColor: theme.border }]}>
                {position != null && (
                  <View
                    style={[
                      styles.rowDot,
                      { left: `${position * 100}%`, backgroundColor: st === 'inside' ? (theme.dark ? '#35D6BD' : '#0E8F7E') : theme.danger, borderColor: theme.card },
                    ]}
                  />
                )}
              </View>
              <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 5 }}>
                {st ? BAND_STATE_LABEL[st] : '기록 없음'}
                {outDays > 0 ? ` · 이탈 ${outDays}일` : ''}
                {hasEstimate ? ' · 추정 포함' : ''}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: theme.text, fontSize: 13, fontWeight: '800' }}>{endVal != null ? usd(endVal, 0) : '—'}</Text>
              <Text style={{ color: theme.textMuted, fontSize: 11 }}>
                매수 {buyCount}건 · Pool {endPool != null ? usd(endPool, 0) : '—'}
              </Text>
            </View>
            <Text style={{ color: theme.textMuted, fontSize: 18 }}>›</Text>
          </Pressable>
        ))}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 12 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  chipRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 10 },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  legend: { flexDirection: 'row', gap: 14, marginTop: 4, flexWrap: 'wrap' },
  miniGrid: { flexDirection: 'row', gap: 8, marginTop: 10 },
  mini: { flex: 1, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10 },
  track: { height: 12, borderRadius: 6, marginTop: 8 },
  trackMid: { position: 'absolute', top: -3, bottom: -3, width: 2 },
  marker: { position: 'absolute', top: -4, width: 20, height: 20, marginLeft: -10, borderRadius: 10, borderWidth: 3 },
  gaugeLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  twoCol: { flexDirection: 'row', gap: 8, marginTop: 10 },
  boundary: { flex: 1, borderRadius: 12, padding: 10 },
  cashBar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  cycleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11 },
  rowTrack: { height: 6, borderRadius: 3 },
  rowDot: { position: 'absolute', top: -3, width: 12, height: 12, marginLeft: -6, borderRadius: 6, borderWidth: 2 },
});
