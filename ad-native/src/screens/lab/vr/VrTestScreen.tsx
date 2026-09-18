import type { ReactNode } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import Loader from '../../../components/ui/Loader';
import EmptyState from '../../../components/common/EmptyState';
import LineChart from '../../../components/charts/LineChart';
import { vrApi, VR_BENCHMARK_SYMBOLS } from '../../../api/vr';
import { buildBuyLadder, buildSellLadder } from '../../../lib/vr-ladder';
import { useTheme } from '../../../lib/theme';
import { TE } from '../../../lib/toss-emoji';

function usd(v: number): string {
  return `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function pct(v: number): string {
  return `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`;
}

const LADDER_STEPS = 8;
const BENCHMARK_COLORS: Record<(typeof VR_BENCHMARK_SYMBOLS)[number], string> = {
  VOO: '#3182F6',
  QQQM: '#F5A623',
  QLD: '#8B5CF6',
};

const screenWidth = Dimensions.get('window').width;
const contentWidth = screenWidth - 32; // ScrollView 좌우 padding 16씩
const chartWidth = contentWidth - 28; // ChartCard 좌우 padding 14씩
const summaryTableWidth = 132;
const summaryChartWidth = contentWidth - summaryTableWidth - 10 - 16;

function Section({ title, sub, theme, children }: { title: string; sub?: string; theme: ReturnType<typeof useTheme>; children: ReactNode }) {
  return (
    <View style={{ marginBottom: 28 }}>
      <Text style={{ color: theme.textMuted, fontSize: 12, fontWeight: '700', marginBottom: 2 }}>{title}</Text>
      {sub && <Text style={{ color: theme.textMuted, fontSize: 11, marginBottom: 10 }}>{sub}</Text>}
      {children}
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

interface PlanRow {
  qty: number;
  trigger: number | null;
  pool: number;
  isCurrent: boolean;
}

function PlanTable({
  title,
  bandLabel,
  rows,
  kind,
  theme,
  highlightBg,
}: {
  title: string;
  bandLabel: string;
  rows: PlanRow[];
  kind: 'buy' | 'sell';
  theme: ReturnType<typeof useTheme>;
  highlightBg: string;
}) {
  const accent = kind === 'buy' ? theme.danger : theme.brand;
  return (
    <View style={[styles.planCol, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.planTitle, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.planLim, { color: theme.textMuted }]}>{bandLabel}</Text>
      <View style={[styles.ladderHeaderRow, { borderColor: theme.border }]}>
        <Text style={[styles.ladderCell, styles.ladderCellLeft, styles.ladderHeaderText, { color: theme.textMuted }]}>잔여</Text>
        <Text style={[styles.ladderCell, styles.ladderHeaderText, { color: theme.textMuted }]}>{kind === 'buy' ? '매수점' : '매도점'}</Text>
        <Text style={[styles.ladderCell, styles.ladderHeaderText, { color: theme.textMuted }]}>Pool</Text>
      </View>
      {rows.map((r, i) => (
        <View key={i} style={[styles.ladderRow, { borderColor: theme.border }, r.isCurrent && { backgroundColor: highlightBg }]}>
          <Text style={[styles.ladderCell, styles.ladderCellLeft, { color: r.isCurrent ? theme.text : theme.textMuted, fontWeight: r.isCurrent ? '800' : '400' }]}>
            {r.qty}
            {r.isCurrent ? '(현재)' : ''}
          </Text>
          <Text style={[styles.ladderCell, { color: r.isCurrent ? theme.text : accent, fontWeight: r.isCurrent ? '800' : '700' }]}>
            {r.trigger != null ? r.trigger.toFixed(2) : '—'}
          </Text>
          <Text style={[styles.ladderCell, { color: r.isCurrent ? theme.text : theme.text, fontWeight: r.isCurrent ? '800' : '400' }]}>
            {r.pool.toFixed(2)}
          </Text>
        </View>
      ))}
    </View>
  );
}

/**
 * 실험용 — 매수/매도 계획(사다리) + 베타(VOO/QQQM/QLD) 비교 + 누적 정리를 참고 이미지 3장
 * 레이아웃 그대로 한 화면에. 검증 끝나면 정식 탭으로 옮기거나 여기서 폐기.
 */
export default function VrTestScreen() {
  const theme = useTheme();
  const stateQ = useQuery({ queryKey: ['vr-state'], queryFn: vrApi.state, refetchInterval: 30_000 });
  const wealthQ = useQuery({ queryKey: ['vr-wealth-history'], queryFn: vrApi.wealthHistory });
  const benchmarkQ = useQuery({ queryKey: ['vr-benchmark-comparison'], queryFn: vrApi.benchmarkComparison });

  if (stateQ.isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <Loader size="large" />
      </View>
    );
  }

  const state = stateQ.data;
  if (!state) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <EmptyState iconCode={TE.chartBar} title="상태를 불러오지 못했어요" />
      </View>
    );
  }

  const wealth = wealthQ.data ?? [];
  const benchmark = benchmarkQ.data ?? [];
  const lastWealth = wealth[wealth.length - 1] ?? null;
  const lastBenchmark = benchmark[benchmark.length - 1] ?? null;
  const highlightBg = theme.dark ? '#4a3c00' : '#FFF3B0';

  const buyLadder = buildBuyLadder({ quantity: state.quantity, minBand: state.minBand, pool: state.pool, usablePool: state.usablePool, steps: LADDER_STEPS });
  const sellLadder = buildSellLadder({ quantity: state.quantity, maxBand: state.maxBand, pool: state.pool, steps: LADDER_STEPS });

  const buyRows: PlanRow[] = [
    { qty: state.quantity, trigger: null, pool: state.pool, isCurrent: true },
    ...buyLadder.map((r) => ({ qty: r.qtyAfter, trigger: r.triggerPrice, pool: r.poolAfter, isCurrent: false })),
  ];
  const sellRows: PlanRow[] = [
    { qty: state.quantity, trigger: null, pool: state.pool, isCurrent: true },
    ...sellLadder.map((r) => ({ qty: r.qtyAfter, trigger: r.triggerPrice, pool: r.poolAfter, isCurrent: false })),
  ];

  const accountTotal = lastWealth ? lastWealth.tqqqValue + state.pool : null;
  const profitAmount = accountTotal != null && lastWealth ? accountTotal - lastWealth.cumulativePrincipal : null;
  const profitPct = accountTotal != null && lastWealth && lastWealth.cumulativePrincipal > 0 ? (accountTotal / lastWealth.cumulativePrincipal - 1) * 100 : null;
  const isNeg = profitAmount != null && profitAmount < 0;

  return (
    <ScrollView style={[styles.root, { backgroundColor: theme.bg }]} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <Section title={`매수/매도 계획 · ${LADDER_STEPS}개씩`} sub="트리거가 = 밴드 ÷ 그 시점 보유수량 · 매수한도 75%(Pool 기준)" theme={theme}>
        <View style={styles.plans}>
          <PlanTable title="매수계획" bandLabel={`최소밴드 ${usd(state.minBand)}`} rows={buyRows} kind="buy" theme={theme} highlightBg={highlightBg} />
          <PlanTable title="매도계획" bandLabel={`최대밴드 ${usd(state.maxBand)}`} rows={sellRows} kind="sell" theme={theme} highlightBg={highlightBg} />
        </View>
      </Section>

      <Section title="베타(VOO) 수익과 비교" sub="첫 공통일 = 0% 정규화 · 보유 주식 평가금 기준(Pool 미포함)" theme={theme}>
        {benchmark.length < 2 ? (
          <Text style={{ color: theme.textMuted, fontSize: 12.5 }}>
            벤치마크 가격은 매일 06:10 KST 자동 수집돼요 — 스냅샷과 겹치는 날짜가 이틀 이상 쌓이면 그래프가 나타나요
          </Text>
        ) : (
          <>
            <ChartCard title="TQQQ 평가금 vs VOO · QQQM · QLD 수익률 (%)" theme={theme}>
              <LineChart
                data={benchmark.map((b) => ({ date: b.date, value: b.tqqqPct }))}
                extraSeries={VR_BENCHMARK_SYMBOLS.map((symbol) => ({
                  data: benchmark.map((b) => ({ date: b.date, value: b.benchmarks[symbol] })),
                  color: BENCHMARK_COLORS[symbol],
                  label: symbol,
                }))}
                width={chartWidth}
                height={150}
                color={theme.danger}
                dark={theme.dark}
                formatValue={pct}
                legendLabels={['TQQQ']}
              />
            </ChartCard>
            {lastBenchmark && (
              <View style={styles.pillGrid}>
                <View style={[styles.pill, { borderColor: theme.border }]}>
                  <Text style={[styles.pillLabel, { color: theme.textMuted }]}>TQQQ</Text>
                  <Text style={[styles.pillValue, { color: theme.danger }]}>{pct(lastBenchmark.tqqqPct)}</Text>
                </View>
                {VR_BENCHMARK_SYMBOLS.map((symbol) => (
                  <View key={symbol} style={[styles.pill, { borderColor: theme.border }]}>
                    <Text style={[styles.pillLabel, { color: theme.textMuted }]}>{symbol}</Text>
                    <Text style={[styles.pillValue, { color: BENCHMARK_COLORS[symbol] }]}>{pct(lastBenchmark.benchmarks[symbol])}</Text>
                  </View>
                ))}
              </View>
            )}
            <Text style={{ color: theme.textMuted, fontSize: 11, lineHeight: 16, marginTop: 8 }}>
              보유주식 평가금 기준({lastBenchmark?.date}). Pool을 포함한 계좌총액 기준 수익률은 아래 "누적 정리" 참고 — 서로 다른 지표라 숫자가
              다릅니다.
            </Text>
          </>
        )}
      </Section>

      <Section title="누적 정리" sub={lastWealth ? `${lastWealth.date} 기준` : undefined} theme={theme}>
        {!lastWealth || accountTotal == null || profitAmount == null || profitPct == null ? (
          <Text style={{ color: theme.textMuted, fontSize: 12.5 }}>
            매일 06:00 KST 자산 스냅샷이 쌓이는 중이에요 — 데이터가 모이면 요약이 나타나요
          </Text>
        ) : (
          <View style={styles.summaryBox}>
            <View style={[styles.summaryTable, { borderColor: theme.border }]}>
              {[
                { k: 'TQQQ 평가금', v: usd(lastWealth.tqqqValue) },
                { k: 'Pool', v: usd(state.pool) },
                { k: '계좌총액', v: usd(accountTotal), highlight: true },
                { k: '투자금', v: usd(lastWealth.cumulativePrincipal) },
                { k: '수익률', v: pct(profitPct), neg: isNeg },
                { k: '수익금', v: `${isNeg ? '-' : '+'}${usd(Math.abs(profitAmount))}`, neg: isNeg },
              ].map((row, i, arr) => (
                <View
                  key={row.k}
                  style={[styles.summaryRow, { borderColor: theme.border }, i === arr.length - 1 && { borderBottomWidth: 0 }]}
                >
                  <Text style={[styles.summaryK, { color: theme.textMuted, backgroundColor: theme.bg }]}>{row.k}</Text>
                  <Text
                    style={[
                      styles.summaryV,
                      { color: row.neg ? theme.danger : row.highlight ? theme.brand : theme.text },
                      row.highlight && { backgroundColor: theme.brandSoft },
                    ]}
                  >
                    {row.v}
                  </Text>
                </View>
              ))}
            </View>
            <View style={[styles.summaryChart, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <LineChart
                data={wealth.map((w) => ({ date: w.date, value: w.tqqqValue }))}
                series2={wealth.map((w) => ({ date: w.date, value: w.cumulativePrincipal }))}
                width={summaryChartWidth}
                height={110}
                color={theme.danger}
                color2={theme.textMuted}
                dark={theme.dark}
                formatValue={usd}
                interactive={false}
              />
            </View>
          </View>
        )}
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  chartCard: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 12 },
  chartTitle: { fontSize: 13, fontWeight: '700', marginBottom: 8 },

  plans: { flexDirection: 'row', gap: 8 },
  planCol: { flex: 1, borderWidth: 1, borderRadius: 12, padding: 10 },
  planTitle: { fontSize: 12, fontWeight: '800', textAlign: 'center', marginBottom: 2 },
  planLim: { fontSize: 9.5, textAlign: 'center', marginBottom: 8 },
  ladderHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, paddingBottom: 3 },
  ladderRow: { flexDirection: 'row', borderBottomWidth: 1, paddingVertical: 3.5 },
  ladderCell: { flex: 1, textAlign: 'right', fontSize: 10 },
  ladderCellLeft: { textAlign: 'left' },
  ladderHeaderText: { fontSize: 9, fontWeight: '700' },

  pillGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  pill: { flexBasis: '47%', flexGrow: 1, borderWidth: 1, borderRadius: 10, padding: 8, alignItems: 'center' },
  pillLabel: { fontSize: 10.5, fontWeight: '700', marginBottom: 2 },
  pillValue: { fontSize: 15, fontWeight: '800' },

  summaryBox: { flexDirection: 'row', gap: 10 },
  summaryTable: { width: summaryTableWidth, borderWidth: 1, borderRadius: 10, overflow: 'hidden' },
  summaryRow: { flexDirection: 'row', borderBottomWidth: 1 },
  summaryK: { flex: 1, fontSize: 11, fontWeight: '600', paddingVertical: 7, paddingHorizontal: 8 },
  summaryV: { flex: 1, fontSize: 11, fontWeight: '800', textAlign: 'right', paddingVertical: 7, paddingHorizontal: 8 },
  summaryChart: { flex: 1, borderWidth: 1, borderRadius: 10, padding: 8, justifyContent: 'center' },
});
