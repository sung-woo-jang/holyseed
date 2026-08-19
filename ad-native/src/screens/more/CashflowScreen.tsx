import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import EmptyState from '../../components/common/EmptyState';
import Segmented from '../../components/common/Segmented';
import HBar from '../../components/charts/HBar';
import TossEmoji from '../../components/common/TossEmoji';
import { useTheme } from '../../lib/theme';
import { useHouseholdData, type HouseholdTransaction } from '../../queries/useHouseholdData';
import { krwShort } from '../../lib/format';
import { getCategoryDef } from '../../lib/category-meta';
import { TE } from '../../lib/toss-emoji';

type Period = '이번달' | '올해' | '작년' | '3년' | '전체';

function filterByPeriod(txs: HouseholdTransaction[], period: Period): HouseholdTransaction[] {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  if (period === '이번달') return txs.filter((t) => t.date.startsWith(`${y}-${m}`));
  if (period === '올해') return txs.filter((t) => t.date.startsWith(`${y}`));
  if (period === '작년') return txs.filter((t) => t.date.startsWith(`${y - 1}`));
  if (period === '3년') return txs.filter((t) => Number(t.date.slice(0, 4)) >= y - 2);
  return txs;
}

export default function CashflowScreen() {
  const theme = useTheme();
  const data = useHouseholdData();
  const [period, setPeriod] = useState<Period>('올해');

  const filtered = useMemo(() => filterByPeriod(data.transactions, period), [data.transactions, period]);

  const income = filtered.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
  const expense = filtered.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
  const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;

  const catMap: Record<string, number> = {};
  filtered
    .filter((t) => t.type === 'EXPENSE')
    .forEach((t) => {
      catMap[t.category] = (catMap[t.category] ?? 0) + t.amount;
    });
  const catBreakdown = Object.entries(catMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);
  const maxCat = catBreakdown[0]?.[1] ?? 1;

  const monthMap: Record<string, { income: number; expense: number }> = {};
  filtered.forEach((t) => {
    const ym = t.date.slice(0, 7);
    if (!monthMap[ym]) monthMap[ym] = { income: 0, expense: 0 };
    if (t.type === 'INCOME') monthMap[ym].income += t.amount;
    if (t.type === 'EXPENSE') monthMap[ym].expense += t.amount;
  });
  const trend = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12);
  const maxTrend = Math.max(...trend.map(([, v]) => Math.max(v.income, v.expense)), 1);

  const hasData = filtered.length > 0;

  return (
    <ScrollView style={[styles.root, { backgroundColor: theme.bg }]} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={{ padding: 20, paddingBottom: 8 }}>
        <Segmented options={['이번달', '올해', '작년', '3년', '전체']} value={period} onChange={(v) => setPeriod(v as Period)} />
      </View>

      {!hasData && <EmptyState iconCode={TE.receipt} title="이 기간에는 거래가 없어요" desc="다른 기간을 선택하거나 가계부에서 거래를 추가해보세요" />}

      {hasData && (
        <>
          <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={{ color: theme.textMuted, fontSize: 12 }}>수입</Text>
                <Text style={{ color: theme.brand, fontSize: 16, fontWeight: '800' }}>{krwShort(income)}</Text>
              </View>
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
              <View style={styles.summaryItem}>
                <Text style={{ color: theme.textMuted, fontSize: 12 }}>지출</Text>
                <Text style={{ color: theme.danger, fontSize: 16, fontWeight: '800' }}>{krwShort(expense)}</Text>
              </View>
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
              <View style={styles.summaryItem}>
                <Text style={{ color: theme.textMuted, fontSize: 12 }}>저축률</Text>
                <Text style={{ color: savingsRate >= 0 ? theme.brand : theme.danger, fontSize: 16, fontWeight: '800' }}>{savingsRate.toFixed(1)}%</Text>
              </View>
            </View>
            {income > 0 && (
              <View style={[styles.stackBar, { backgroundColor: theme.border }]}>
                <View style={{ flex: expense / (income || 1), borderRadius: 4, backgroundColor: theme.danger }} />
                <View style={{ flex: Math.max(0, 1 - expense / (income || 1)), borderRadius: 4, backgroundColor: theme.brand }} />
              </View>
            )}
          </View>

          {trend.length > 1 && (
            <View style={[styles.section, { backgroundColor: theme.card }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>월별 추이</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.trendRow}>
                  {trend.map(([ym, vals]) => {
                    const incH = Math.max(4, (vals.income / maxTrend) * 80);
                    const expH = Math.max(4, (vals.expense / maxTrend) * 80);
                    return (
                      <View key={ym} style={styles.trendCol}>
                        <View style={styles.trendBars}>
                          <View style={[styles.trendBar, { height: incH, backgroundColor: theme.brand, marginRight: 2 }]} />
                          <View style={[styles.trendBar, { height: expH, backgroundColor: theme.danger }]} />
                        </View>
                        <Text style={{ color: theme.textMuted, fontSize: 10 }}>{ym.slice(2)}</Text>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          )}

          <View style={[styles.section, { backgroundColor: theme.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>지출 카테고리</Text>
            {catBreakdown.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 24, gap: 8 }}>
                <TossEmoji code={TE.chartBar} size={36} />
                <Text style={{ color: theme.textMuted, fontSize: 13 }}>해당 기간의 지출이 없어요</Text>
              </View>
            ) : (
              catBreakdown.map(([name, val]) => {
                const def = getCategoryDef(name);
                return (
                  <View key={name} style={styles.catRow}>
                    <TossEmoji code={def.iconCode} size={32} bg={def.color + '22'} />
                    <View style={{ flex: 1 }}>
                      <View style={styles.catTopRow}>
                        <Text style={{ color: theme.text, fontSize: 13, fontWeight: '600' }}>{name}</Text>
                        <Text style={{ color: theme.textMuted, fontSize: 11 }}>{expense > 0 ? ((val / expense) * 100).toFixed(1) : 0}%</Text>
                        <Text style={{ color: theme.danger, fontSize: 12, fontWeight: '700' }}>{krwShort(val)}</Text>
                      </View>
                      <HBar value={val} max={maxCat} color={def.color} />
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  summaryCard: { marginHorizontal: 20, borderRadius: 16, borderWidth: 1, padding: 16 },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center', gap: 4 },
  divider: { width: 1, height: 32 },
  stackBar: { flexDirection: 'row', height: 8, borderRadius: 4, marginTop: 14, gap: 2 },
  section: { marginHorizontal: 20, marginTop: 12, borderRadius: 16, padding: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 12 },
  trendRow: { flexDirection: 'row', gap: 10, paddingBottom: 4 },
  trendCol: { alignItems: 'center', width: 28 },
  trendBars: { flexDirection: 'row', alignItems: 'flex-end', height: 80 },
  trendBar: { width: 8, borderRadius: 2 },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  catTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
});
