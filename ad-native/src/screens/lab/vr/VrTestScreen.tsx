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

const screenWidth = Dimensions.get('window').width;
const contentWidth = screenWidth - 32; // ScrollView 좌우 padding 16씩
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

/**
 * 실험용 — 누적 정리(계좌총액/투자금/수익률 표 + 차트)를 참고 이미지 레이아웃 그대로.
 * 검증 끝나면 정식 탭으로 옮기거나 여기서 폐기.
 */
export default function VrTestScreen() {
  const theme = useTheme();
  const stateQ = useQuery({ queryKey: ['vr-state'], queryFn: vrApi.state, refetchInterval: 30_000 });
  const wealthQ = useQuery({ queryKey: ['vr-wealth-history'], queryFn: vrApi.wealthHistory });

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
  const lastWealth = wealth[wealth.length - 1] ?? null;

  const accountTotal = lastWealth ? lastWealth.tqqqValue + state.pool : null;
  const profitAmount = accountTotal != null && lastWealth ? accountTotal - lastWealth.cumulativePrincipal : null;
  const profitPct = accountTotal != null && lastWealth && lastWealth.cumulativePrincipal > 0 ? (accountTotal / lastWealth.cumulativePrincipal - 1) * 100 : null;
  const isNeg = profitAmount != null && profitAmount < 0;

  return (
    <ScrollView style={[styles.root, { backgroundColor: theme.bg }]} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
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

  summaryBox: { flexDirection: 'row', gap: 10 },
  summaryTable: { width: summaryTableWidth, borderWidth: 1, borderRadius: 10, overflow: 'hidden' },
  summaryRow: { flexDirection: 'row', borderBottomWidth: 1 },
  summaryK: { flex: 1, fontSize: 11, fontWeight: '600', paddingVertical: 7, paddingHorizontal: 8 },
  summaryV: { flex: 1, fontSize: 11, fontWeight: '800', textAlign: 'right', paddingVertical: 7, paddingHorizontal: 8 },
  summaryChart: { flex: 1, borderWidth: 1, borderRadius: 10, padding: 8, justifyContent: 'center' },
});
