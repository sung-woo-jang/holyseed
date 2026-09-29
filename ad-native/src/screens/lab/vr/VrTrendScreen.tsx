import { useMemo, useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import Loader from '../../../components/ui/Loader';
import EmptyState from '../../../components/common/EmptyState';
import LineChart from '../../../components/charts/LineChart';
import { vrApi } from '../../../api/vr';
import { useTheme } from '../../../lib/theme';
import { TE } from '../../../lib/toss-emoji';

function usd(v: number): string {
  return `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const chartWidth = Dimensions.get('window').width - 32 - 28;

function Tile({ label, value, theme }: { label: string; value: string; theme: ReturnType<typeof useTheme> }) {
  return (
    <View style={[styles.tile, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={{ color: theme.textMuted, fontSize: 11 }}>{label}</Text>
      <Text style={{ color: theme.text, fontSize: 13.5, fontWeight: '700', marginTop: 2 }}>{value}</Text>
    </View>
  );
}

export default function VrTrendScreen() {
  const theme = useTheme();
  const cyclesQ = useQuery({ queryKey: ['vr-cycles'], queryFn: vrApi.cycles });
  const fillsQ = useQuery({ queryKey: ['vr-fills'], queryFn: vrApi.fills });
  const [selected, setSelected] = useState<number | 'all'>('all');

  const cycles = cyclesQ.data ?? [];
  const fills = fillsQ.data ?? [];
  const isAll = selected === 'all';
  const latestCycleNo = cycles.reduce((max, c) => Math.max(max, c.cycleNo), 0);
  const activeCycleNo = isAll ? latestCycleNo : selected;
  const cycle = cycles.find((c) => c.cycleNo === activeCycleNo);

  // 전체 보기: 입금(DEPOSIT)은 평단이 안 바뀌는 점(첫 입금은 평단 0)이라 빼고 매수/매도 체결만 이어 붙인다
  const allFills = useMemo(
    () =>
      fills
        .filter((f) => f.kind !== 'DEPOSIT')
        .slice()
        .sort((a, b) => (a.fillDate < b.fillDate ? -1 : a.fillDate > b.fillDate ? 1 : a.id - b.id)),
    [fills],
  );
  const bands = useMemo(() => {
    const groups: { cycleNo: number | null; from: number; to: number }[] = [];
    allFills.forEach((f, i) => {
      const last = groups[groups.length - 1];
      if (last && last.cycleNo === f.cycleNo) last.to = i;
      else groups.push({ cycleNo: f.cycleNo, from: i, to: i });
    });
    return groups.map((g) => ({ from: g.from, to: g.to, label: g.cycleNo === null ? '' : String(g.cycleNo) }));
  }, [allFills]);

  const cycleFills = useMemo(
    () =>
      fills
        .filter((f) => f.cycleNo === activeCycleNo)
        .slice()
        .sort((a, b) => (a.fillDate < b.fillDate ? -1 : a.fillDate > b.fillDate ? 1 : a.id - b.id)),
    [fills, activeCycleNo],
  );

  if (cyclesQ.isLoading || fillsQ.isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <Loader size="large" />
      </View>
    );
  }

  if (cycles.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <EmptyState iconCode={TE.chartBar} title="등록된 사이클이 없어요" />
      </View>
    );
  }

  const avgPriceData = cycleFills.map((f) => ({ date: f.fillDate, value: f.avgPriceAfter }));
  const qtyData = cycleFills.map((f) => ({ date: f.fillDate, value: f.qtyAfter }));
  const poolData = cycleFills.map((f) => ({ date: f.fillDate, value: f.poolAfter }));
  const openCycleCount = cycles.filter((c) => !c.isClosed).length;
  const hasOpenCycle = openCycleCount > 0;
  const lastEndDate = cycles.reduce((m, c) => (c.endDate && c.endDate > m ? c.endDate : m), '');

  return (
    <ScrollView style={[styles.root, { backgroundColor: theme.bg }]} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        <View style={styles.chipRow}>
          <Pressable
            onPress={() => setSelected('all')}
            style={[styles.chip, { borderColor: isAll ? theme.brand : theme.border, backgroundColor: isAll ? theme.brandSoft : theme.card }]}
          >
            <Text style={{ fontSize: 12.5, fontWeight: '700', color: isAll ? theme.brand : theme.text }}>전체</Text>
          </Pressable>
          {[...cycles].sort((a, b) => b.cycleNo - a.cycleNo).map((c) => {
            const active = !isAll && c.cycleNo === activeCycleNo;
            return (
              <Pressable
                key={c.id}
                onPress={() => setSelected(c.cycleNo)}
                style={[styles.chip, { borderColor: active ? theme.brand : theme.border, backgroundColor: active ? theme.brandSoft : theme.card }]}
              >
                <Text style={{ fontSize: 12.5, fontWeight: '700', color: active ? theme.brand : theme.text }}>
                  사이클 {c.cycleNo}
                  {!c.isClosed ? ' (진행중)' : ''}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {isAll ? (
        allFills.length < 2 ? (
          <Text style={{ color: theme.textMuted, fontSize: 12.5, marginTop: 8 }}>체결이 2건 미만이라 그래프를 그릴 수 없어요</Text>
        ) : (
          <>
            <View style={styles.tileGrid}>
              <Tile theme={theme} label="기간" value={`${allFills[0].fillDate} ~ ${hasOpenCycle ? '진행중' : lastEndDate}`} />
              <Tile theme={theme} label="평단 (처음 → 지금)" value={`${usd(allFills[0].avgPriceAfter)} → ${usd(allFills[allFills.length - 1].avgPriceAfter)}`} />
              <Tile theme={theme} label="보유수량" value={`${allFills[allFills.length - 1].qtyAfter}주`} />
              <Tile theme={theme} label="사이클" value={`${cycles.length}개${openCycleCount > 0 ? ` (진행중 ${openCycleCount})` : ''}`} />
            </View>
            <View style={[styles.chartCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.chartTitle, { color: theme.text }]}>평단 추이 · 전체</Text>
              <LineChart
                data={allFills.map((f) => ({ date: f.fillDate, value: f.avgPriceAfter }))}
                series2={allFills.map((f) => ({ date: f.fillDate, value: f.price }))}
                legendLabels={['평단', '체결가']}
                bands={bands}
                width={chartWidth}
                height={170}
                color={theme.brand}
                dark={theme.dark}
                formatValue={usd}
              />
            </View>
            <View style={[styles.chartCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.chartTitle, { color: theme.text }]}>보유수량 추이 · 전체</Text>
              <LineChart
                data={allFills.map((f) => ({ date: f.fillDate, value: f.qtyAfter }))}
                bands={bands}
                width={chartWidth}
                height={150}
                color="#A78BFA"
                dark={theme.dark}
                formatValue={(v) => `${Math.round(v)}주`}
              />
            </View>
            <Text style={{ color: theme.textMuted, fontSize: 11.5 }}>점선 세로줄은 사이클 경계(위 숫자가 사이클 번호)예요. 입금은 빼고 매수·매도 체결만 이어 그려요.</Text>
          </>
        )
      ) : (
        <>
      {cycle && (
        <View style={styles.tileGrid}>
          <Tile theme={theme} label="기간" value={`${cycle.startDate} ~ ${cycle.endDate ?? '진행중'}`} />
          <Tile theme={theme} label="V" value={usd(cycle.vValue)} />
          <Tile theme={theme} label="Pool 시작" value={usd(cycle.poolStart)} />
          <Tile theme={theme} label="적립금" value={usd(cycle.depositAmount)} />
        </View>
      )}

      {cycleFills.length < 2 ? (
        <Text style={{ color: theme.textMuted, fontSize: 12.5, marginTop: 8 }}>체결이 2건 미만이라 그래프를 그릴 수 없어요</Text>
      ) : (
        <>
          <View style={[styles.chartCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.chartTitle, { color: theme.text }]}>평단 추이</Text>
            <LineChart data={avgPriceData} width={chartWidth} height={140} color={theme.brand} dark={theme.dark} formatValue={usd} />
          </View>
          <View style={[styles.chartCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.chartTitle, { color: theme.text }]}>보유수량 추이</Text>
            <LineChart data={qtyData} width={chartWidth} height={140} color="#A78BFA" dark={theme.dark} formatValue={(v) => `${v}주`} />
          </View>
          <View style={[styles.chartCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.chartTitle, { color: theme.text }]}>Pool 추이</Text>
            <LineChart data={poolData} width={chartWidth} height={140} color="#0AB39C" dark={theme.dark} formatValue={usd} />
          </View>
        </>
      )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  tile: { width: '48%', borderWidth: 1, borderRadius: 12, padding: 12 },
  chartCard: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 12 },
  chartTitle: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
});
