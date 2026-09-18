import type { ReactNode } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
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
function pct(v: number): string {
  return `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`;
}

const chartWidth = Dimensions.get('window').width - 32 - 28;

function Section({ title, sub, theme, children }: { title: string; sub?: string; theme: ReturnType<typeof useTheme>; children: ReactNode }) {
  return (
    <View style={{ marginBottom: 28 }}>
      <Text style={{ color: theme.textMuted, fontSize: 12, fontWeight: '700', marginBottom: 2 }}>{title}</Text>
      {sub && <Text style={{ color: theme.textMuted, fontSize: 11, marginBottom: 10 }}>{sub}</Text>}
      {children}
    </View>
  );
}

function Tile({ label, value, positive, theme }: { label: string; value: string; positive?: boolean; theme: ReturnType<typeof useTheme> }) {
  return (
    <View style={[styles.tile, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={{ color: theme.textMuted, fontSize: 11 }}>{label}</Text>
      <Text style={{ color: positive ? theme.brand : theme.text, fontSize: 13.5, fontWeight: '700', marginTop: 2 }}>{value}</Text>
    </View>
  );
}

function ChartCard({ title, theme, children }: { title: string; theme: ReturnType<typeof useTheme>; children: ReactNode }) {
  return (
    <View style={[styles.chartCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.chartTitle, { color: theme.text }]}>{title}</Text>
      {children}
    </View>
  );
}

/**
 * 실험용 — 사이클을 이어붙인 장기 추이(VrTrendScreen은 사이클 1개만 보여줌) + 평가금/투자원금 +
 * SPY 베타 비교. 검증 끝나면 정식 탭으로 옮기거나 여기서 폐기.
 */
export default function VrTestScreen() {
  const theme = useTheme();
  const cyclesQ = useQuery({ queryKey: ['vr-cycles'], queryFn: vrApi.cycles });
  const wealthQ = useQuery({ queryKey: ['vr-wealth-history'], queryFn: vrApi.wealthHistory });
  const spyQ = useQuery({ queryKey: ['vr-spy-comparison'], queryFn: vrApi.spyComparison });

  if (cyclesQ.isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <Loader size="large" />
      </View>
    );
  }

  const cycles = (cyclesQ.data ?? []).slice().sort((a, b) => a.cycleNo - b.cycleNo);
  const wealth = wealthQ.data ?? [];
  const spy = spyQ.data ?? [];

  if (cycles.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <EmptyState iconCode={TE.chartBar} title="등록된 사이클이 없어요" />
      </View>
    );
  }

  const firstCycle = cycles[0];
  const lastCycle = cycles[cycles.length - 1];
  const lastWealth = wealth[wealth.length - 1];
  const lastSpy = spy[spy.length - 1];
  const vGrowthPct = ((lastCycle.vValue / firstCycle.vValue - 1) * 100).toFixed(1);

  return (
    <ScrollView style={[styles.root, { backgroundColor: theme.bg }]} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <Section title="사이클 누적 V값" sub={`${firstCycle.startDate} ~ ${lastCycle.endDate ?? '진행중'} (${cycles.length}사이클)`} theme={theme}>
        <View style={styles.tileGrid}>
          <Tile theme={theme} label="진행 사이클" value={`${lastCycle.cycleNo}회차${lastCycle.isClosed ? '' : ' (진행중)'}`} />
          <Tile theme={theme} label="V값 성장률" value={`+${vGrowthPct}%`} positive />
          <Tile theme={theme} label="현재 Pool" value={usd(lastCycle.poolEnd ?? lastCycle.poolStart)} />
          <Tile theme={theme} label="누적 적립금" value={usd(cycles.reduce((s, c) => s + c.depositAmount, 0))} />
        </View>
        {cycles.length < 2 ? (
          <Text style={{ color: theme.textMuted, fontSize: 12.5 }}>사이클이 2개 이상 쌓이면 그래프가 나타나요</Text>
        ) : (
          <ChartCard title="V값 추이 (사이클별)" theme={theme}>
            <LineChart
              data={cycles.map((c) => ({ date: c.startDate, value: c.vValue }))}
              width={chartWidth}
              height={140}
              color={theme.brand}
              dark={theme.dark}
              formatValue={usd}
            />
          </ChartCard>
        )}
      </Section>

      <Section title="평가금 · 투자원금" sub={wealth.length ? `실계좌 일별 스냅샷 · ${wealth[0].date} ~ ${lastWealth.date}` : undefined} theme={theme}>
        {wealth.length < 2 ? (
          <Text style={{ color: theme.textMuted, fontSize: 12.5 }}>
            매일 06:00 KST 자산 스냅샷이 쌓이는 중이에요 — 이틀 치 이상 모이면 그래프가 나타나요
          </Text>
        ) : (
          <>
            <View style={styles.tileGrid}>
              <Tile theme={theme} label="TQQQ 평가금 (오늘)" value={usd(lastWealth.tqqqValue)} />
              <Tile theme={theme} label="누적 투자원금" value={usd(lastWealth.cumulativePrincipal)} />
              <Tile
                theme={theme}
                label="평가손익"
                value={`${lastWealth.tqqqValue - lastWealth.cumulativePrincipal >= 0 ? '+' : ''}${usd(lastWealth.tqqqValue - lastWealth.cumulativePrincipal)}`}
                positive={lastWealth.tqqqValue - lastWealth.cumulativePrincipal >= 0}
              />
              <Tile theme={theme} label="데이터 축적" value={`${wealth.length}일치`} />
            </View>
            <ChartCard title="TQQQ 평가금 추이" theme={theme}>
              <LineChart data={wealth.map((w) => ({ date: w.date, value: w.tqqqValue }))} width={chartWidth} height={140} color={theme.brand} dark={theme.dark} formatValue={usd} />
            </ChartCard>
            <ChartCard title="누적 투자원금 추이" theme={theme}>
              <LineChart
                data={wealth.map((w) => ({ date: w.date, value: w.cumulativePrincipal }))}
                width={chartWidth}
                height={140}
                color={theme.textMuted}
                dark={theme.dark}
                formatValue={usd}
              />
            </ChartCard>
          </>
        )}
      </Section>

      <Section title="베타(SPY) 대비 비교" sub="첫 공통일 = 0% 정규화 · Pool(현금) 미포함, 보유주식 평가금만 비교" theme={theme}>
        {spy.length < 2 ? (
          <Text style={{ color: theme.textMuted, fontSize: 12.5 }}>
            SPY 가격은 매일 06:10 KST 자동 수집돼요 — 스냅샷과 겹치는 날짜가 이틀 이상 쌓이면 그래프가 나타나요
          </Text>
        ) : (
          <>
            <View style={styles.tileGrid}>
              <Tile theme={theme} label="TQQQ 평가금 수익률" value={pct(lastSpy.tqqqPct)} positive={lastSpy.tqqqPct >= 0} />
              <Tile theme={theme} label="SPY 수익률" value={pct(lastSpy.spyPct)} positive={lastSpy.spyPct >= 0} />
            </View>
            <ChartCard title="TQQQ 평가금 수익률 (%)" theme={theme}>
              <LineChart data={spy.map((s) => ({ date: s.date, value: s.tqqqPct }))} width={chartWidth} height={140} color={theme.brand} dark={theme.dark} formatValue={pct} />
            </ChartCard>
            <ChartCard title="SPY 수익률 (%)" theme={theme}>
              <LineChart data={spy.map((s) => ({ date: s.date, value: s.spyPct }))} width={chartWidth} height={140} color={theme.textMuted} dark={theme.dark} formatValue={pct} />
            </ChartCard>
          </>
        )}
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  tile: { width: '48%', borderWidth: 1, borderRadius: 12, padding: 12 },
  chartCard: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 12 },
  chartTitle: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
});
