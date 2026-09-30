import { useMemo, useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import Loader from '../../../components/ui/Loader';
import EmptyState from '../../../components/common/EmptyState';
import LineChart from '../../../components/charts/LineChart';
import BandChart from '../../../components/charts/BandChart';
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
  const wealthQ = useQuery({ queryKey: ['vr-wealth-history'], queryFn: vrApi.wealthHistory });
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
  const wealth = wealthQ.data ?? [];
  const wealthPoints = wealth.map((w) => ({ date: w.date, value: w.tqqqValue }));
  const today = wealthPoints.length > 0 ? wealthPoints[wealthPoints.length - 1].date : '';
  // 사이클별 요약(시트 위쪽 표와 같은 항목) — 말 평가금이 그 사이클 밴드 안인지도 같이 표시
  const cycleRows = [...cycles]
    .sort((a, b) => b.cycleNo - a.cycleNo)
    .map((c) => {
      const end = c.isClosed && c.endDate ? c.endDate : today;
      const pts = wealthPoints.filter((p) => p.date >= c.startDate && p.date <= end);
      const lastPt = pts.length > 0 ? pts[pts.length - 1] : null;
      const inside = lastPt ? lastPt.value >= c.minBand && lastPt.value <= c.maxBand : null;
      return { c, lastPt, inside };
    });
  const outCount = wealthPoints.filter((p) => {
    const c = [...cycles].sort((a, b) => a.cycleNo - b.cycleNo).filter((x) => x.startDate <= p.date).pop();
    return c ? p.value < c.minBand || p.value > c.maxBand : false;
  }).length;
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

      {isAll && wealthPoints.length > 1 && (
        <>
          <View style={[styles.chartCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.bandHead}>
              <Text style={[styles.chartTitle, { color: theme.text, marginBottom: 0 }]}>평가금 vs V 밴드</Text>
              <View style={[styles.pill, { backgroundColor: outCount === 0 ? theme.brandSoft : theme.danger }]}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: outCount === 0 ? theme.brand : '#fff' }}>
                  {outCount === 0 ? `밴드 안 · 기록 ${wealthPoints.length}건 중 이탈 0건` : `밴드 밖 ${outCount}건`}
                </Text>
              </View>
            </View>
            <Text style={{ color: theme.textMuted, fontSize: 10.5, marginBottom: 6 }}>일별 평가금(선)과 사이클별 최소~최대 밴드(띠)</Text>
            <BandChart cycles={cycles} points={wealthPoints} width={chartWidth} height={210} dark={theme.dark} />
            <Text style={{ color: theme.textMuted, fontSize: 10.5, marginTop: 6 }}>
              평가금 기록은 계좌 스냅샷 기반이라 {wealthPoints[0].date}부터예요. 밴드 밖으로 나간 기록은 빨간 점으로 표시돼요.
            </Text>
          </View>
          <View style={[styles.chartCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.chartTitle, { color: theme.text }]}>사이클별 요약</Text>
            {cycleRows.map(({ c, lastPt, inside }, i) => (
              <View key={c.id} style={[styles.cyRow, i > 0 && { borderTopWidth: 1, borderColor: theme.border }]}>
                <View style={styles.cyTop}>
                  <Text style={{ color: theme.text, fontSize: 12.5, fontWeight: '800' }}>
                    사이클 {c.cycleNo} <Text style={{ color: theme.textMuted, fontWeight: '500', fontSize: 11 }}>{c.startDate.slice(5)} ~ {c.endDate?.slice(5) ?? '진행중'}</Text>
                  </Text>
                  {inside !== null && (
                    <View style={[styles.pill, { backgroundColor: inside ? theme.brandSoft : theme.danger }]}>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: inside ? theme.brand : '#fff' }}>{c.isClosed ? '' : '진행중 · '}{inside ? '밴드 안' : '밴드 밖'}</Text>
                    </View>
                  )}
                </View>
                <Text style={{ color: theme.textMuted, fontSize: 10.5, marginTop: 3, lineHeight: 16 }}>
                  V {usd(c.vValue)} · 밴드 {usd(c.minBand)}~{usd(c.maxBand)}{'\n'}
                  Pool {usd(c.poolStart)} → {c.poolEnd !== null ? usd(c.poolEnd) : '—'} · 거래액 {usd(c.tradeAmount)}
                  {lastPt ? ` · 말 평가금 ${usd(lastPt.value)}` : ''}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}

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
  bandHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2, gap: 8 },
  pill: { borderRadius: 999, paddingVertical: 2, paddingHorizontal: 8 },
  cyRow: { paddingVertical: 9 },
  cyTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
