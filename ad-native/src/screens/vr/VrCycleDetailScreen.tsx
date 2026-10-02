import { useMemo, useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/common/EmptyState';
import { BandTrendChart } from '../../components/charts/VrTrendCharts';
import { vrApi } from '../../api/vr';
import { buildTrend, summarizeCycles } from '../../lib/vr-trend';
import { BAND_STATE_LABEL, md, usd } from '../../lib/vr-format';
import { useTheme } from '../../lib/theme';
import { TE } from '../../lib/toss-emoji';
import type { StrategyStackParamList } from '../../navigation/StrategyStack';

type Props = NativeStackScreenProps<StrategyStackParamList, 'VrCycleDetail'>;

const KIND_LABEL: Record<string, string> = { INITIAL_BUY: '최초 매수', BUY: '매수', SELL: '매도', DEPOSIT: '입금' };

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.tile, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={{ color: theme.textMuted, fontSize: 11 }}>{label}</Text>
      <Text style={{ color: theme.text, fontSize: 15, fontWeight: '800', marginTop: 2 }}>{value}</Text>
      {sub ? <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 2 }}>{sub}</Text> : null}
    </View>
  );
}

export default function VrCycleDetailScreen({ route, navigation }: Props) {
  const theme = useTheme();
  const { cycleNo } = route.params;
  const cyclesQ = useQuery({ queryKey: ['vr-cycles'], queryFn: vrApi.cycles });
  const fillsQ = useQuery({ queryKey: ['vr-fills'], queryFn: vrApi.fills });
  const wealthQ = useQuery({ queryKey: ['vr-wealth-history'], queryFn: vrApi.wealthHistory });
  const candlesQ = useQuery({ queryKey: ['vr-candles', 'all'], queryFn: () => vrApi.candles('all'), staleTime: 10 * 60_000 });
  const [cardWidth, setCardWidth] = useState(Dimensions.get('window').width - 32 - 28);

  const cycles = useMemo(() => [...(cyclesQ.data ?? [])].sort((a, b) => a.cycleNo - b.cycleNo), [cyclesQ.data]);
  const fills = fillsQ.data ?? [];
  const points = useMemo(
    () => buildTrend({ fills, cycles, wealth: wealthQ.data ?? [], candles: candlesQ.data?.candles ?? [] }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fillsQ.data, cyclesQ.data, wealthQ.data, candlesQ.data],
  );
  const summaries = useMemo(() => summarizeCycles(cycles, fills, points), [cycles, fills, points]);

  if (cyclesQ.isLoading || fillsQ.isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <Loader size="large" />
      </View>
    );
  }
  const idx = cycles.findIndex((c) => c.cycleNo === cycleNo);
  const cycle = idx >= 0 ? cycles[idx]! : null;
  const summary = summaries.find((s) => s.cycle.cycleNo === cycleNo);
  if (!cycle || !summary) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <EmptyState iconCode={TE.search} title={`사이클 ${cycleNo}을 찾을 수 없어요`} />
      </View>
    );
  }

  const lastPoint = points[points.length - 1];
  const endDate = cycle.isClosed && cycle.endDate ? cycle.endDate : lastPoint?.date ?? cycle.startDate;
  // 이 사이클 구간(+ 직전 며칠)만 확대해서 보여준다
  const zoomPoints = points.filter((p) => p.date >= cycle.startDate && p.date <= endDate);
  const cycleFills = fills.filter((f) => f.cycleNo === cycleNo).sort((a, b) => (a.fillDate === b.fillDate ? b.id - a.id : a.fillDate < b.fillDate ? 1 : -1));
  const goto = (target: number | undefined) => {
    const c = target != null ? cycles[target] : undefined;
    if (c) navigation.setParams({ cycleNo: c.cycleNo });
  };

  function onLayout(e: LayoutChangeEvent) {
    setCardWidth(e.nativeEvent.layout.width - 28);
  }

  return (
    <ScrollView style={[styles.root, { backgroundColor: theme.bg }]} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <View style={styles.navRow}>
        <Pressable disabled={idx <= 0} hitSlop={8} onPress={() => goto(idx - 1)} style={[styles.navBtn, idx <= 0 && { opacity: 0.3 }]}>
          <Text style={{ color: theme.text, fontSize: 20 }}>‹</Text>
        </Pressable>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: theme.text, fontSize: 15, fontWeight: '800' }}>사이클 {cycle.cycleNo}</Text>
          <Text style={{ color: theme.textMuted, fontSize: 11.5, marginTop: 2 }}>
            {cycle.startDate} ~ {cycle.isClosed && cycle.endDate ? cycle.endDate : '진행중'}
          </Text>
        </View>
        <Pressable disabled={idx >= cycles.length - 1} hitSlop={8} onPress={() => goto(idx + 1)} style={[styles.navBtn, idx >= cycles.length - 1 && { opacity: 0.3 }]}>
          <Text style={{ color: theme.text, fontSize: 20 }}>›</Text>
        </Pressable>
      </View>

      <View style={styles.tileGrid}>
        <Tile label="V" value={usd(cycle.vValue)} sub={`밴드 ${usd(cycle.minBand, 0)}~${usd(cycle.maxBand, 0)}`} />
        <Tile
          label="말 평가금"
          value={summary.endVal != null ? usd(summary.endVal, 0) : '—'}
          sub={summary.state ? `${BAND_STATE_LABEL[summary.state]}${summary.outDays > 0 ? ` · 이탈 ${summary.outDays}일` : ''}` : undefined}
        />
        <Tile label="Pool" value={`${usd(cycle.poolStart, 0)} → ${summary.endPool != null ? usd(summary.endPool, 0) : '—'}`} sub={`적립금 ${usd(cycle.depositAmount, 0)}`} />
        <Tile label="체결" value={`매수 ${summary.buyCount}건`} sub={`거래액 ${usd(cycle.tradeAmount, 0)}`} />
      </View>

      <View onLayout={onLayout} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={{ color: theme.textMuted, fontSize: 12.5, fontWeight: '700', marginBottom: 10 }}>평가금 vs 밴드</Text>
        {zoomPoints.length > 1 ? (
          <BandTrendChart points={zoomPoints} cycles={[cycle]} width={cardWidth} height={200} />
        ) : (
          <Text style={{ color: theme.textMuted, fontSize: 12.5 }}>이 사이클의 평가금 기록이 아직 없어요</Text>
        )}
        {summary.hasEstimate ? <Text style={{ color: theme.textMuted, fontSize: 11.5, marginTop: 6 }}>점선 구간은 일봉으로 복원한 추정치예요.</Text> : null}
      </View>

      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, paddingVertical: 4 }]}>
        <Text style={{ color: theme.textMuted, fontSize: 12.5, fontWeight: '700', marginTop: 10, marginBottom: 4 }}>체결 · 입금 내역 ({cycleFills.length})</Text>
        {cycleFills.length === 0 ? (
          <Text style={{ color: theme.textMuted, fontSize: 12.5, paddingVertical: 12 }}>이 사이클엔 체결이 없어요</Text>
        ) : (
          cycleFills.map((f, i) => {
            const deposit = f.kind === 'DEPOSIT';
            const sell = f.kind === 'SELL';
            return (
              <View key={f.id} style={[styles.fillRow, i > 0 && { borderTopWidth: 1, borderColor: theme.border }]}>
                <View style={[styles.kindBadge, { backgroundColor: sell ? (theme.dark ? '#3A1A1E' : '#FDECEE') : deposit ? theme.bg : theme.brandSoft }]}>
                  <Text style={{ color: sell ? theme.danger : deposit ? theme.textMuted : theme.brand, fontSize: 11.5, fontWeight: '800' }}>{KIND_LABEL[f.kind] ?? f.kind}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ color: theme.text, fontSize: 13, fontWeight: '700' }}>
                    {md(f.fillDate)}
                    {deposit ? ` · ${usd(f.amount)}` : ` · ${usd(f.price)} × ${f.quantity}주`}
                  </Text>
                  <Text style={{ color: theme.textMuted, fontSize: 11.5, marginTop: 2 }}>
                    Pool {usd(f.poolAfter, 0)} · 보유 {f.qtyAfter}주{f.avgPriceAfter > 0 ? ` · 평단 ${usd(f.avgPriceAfter)}` : ''}
                  </Text>
                </View>
                {!deposit && <Text style={{ color: theme.text, fontSize: 13, fontWeight: '800' }}>{usd(f.amount)}</Text>}
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  navBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  tile: { width: '48%', borderWidth: 1, borderRadius: 12, padding: 12 },
  card: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 12 },
  fillRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  kindBadge: { minWidth: 52, alignItems: 'center', paddingVertical: 5, paddingHorizontal: 6, borderRadius: 8 },
});
