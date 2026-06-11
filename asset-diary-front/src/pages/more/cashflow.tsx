import React, { useMemo, useState } from 'react';
import { createRoute } from '@granite-js/react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import ScreenHeader from '../../components/common/ScreenHeader';
import EmptyState from '../../components/common/EmptyState';
import Segmented from '../../components/common/Segmented';
import HBar from '../../components/charts/HBar';
import TossEmoji from '../../components/common/TossEmoji';
import { useTheme } from '../../lib/theme';
import { useDataSource } from '../../lib/data-source';
import { krwShort } from '../../lib/format';
import { getCategoryDef } from '../../lib/category-meta';
import { TE } from '../../lib/toss-emoji';
import type { MockTransaction } from '../../lib/mock-data';

type Period = '이번달' | '올해' | '작년' | '3년' | '전체';

function filterByPeriod(txs: MockTransaction[], period: Period): MockTransaction[] {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  if (period === '이번달') return txs.filter((t) => t.date.startsWith(`${y}-${m}`));
  if (period === '올해') return txs.filter((t) => t.date.startsWith(`${y}`));
  if (period === '작년') return txs.filter((t) => t.date.startsWith(`${y - 1}`));
  if (period === '3년') return txs.filter((t) => Number(t.date.slice(0, 4)) >= y - 2);
  return txs;
}

function CashflowScreen() {
  const navigation = Route.useNavigation();
  const theme = useTheme();
  const data = useDataSource();
  const [period, setPeriod] = useState<Period>('올해');

  const filtered = useMemo(() => filterByPeriod(data.transactions, period), [data.transactions, period]);

  const income = filtered.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
  const expense = filtered.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
  const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;

  // 카테고리 breakdown
  const catMap: Record<string, number> = {};
  filtered.filter((t) => t.type === 'EXPENSE').forEach((t) => {
    catMap[t.category] = (catMap[t.category] ?? 0) + t.amount;
  });
  const catBreakdown = Object.entries(catMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);
  const maxCat = catBreakdown[0]?.[1] ?? 1;

  // 월별 trend (최근 12개월)
  const monthMap: Record<string, { income: number; expense: number }> = {};
  filtered.forEach((t) => {
    const ym = t.date.slice(0, 7);
    if (!monthMap[ym]) monthMap[ym] = { income: 0, expense: 0 };
    if (t.type === 'INCOME') monthMap[ym].income += t.amount;
    if (t.type === 'EXPENSE') monthMap[ym].expense += t.amount;
  });
  const trend = Object.entries(monthMap).sort(([a], [b]) => a.localeCompare(b)).slice(-12);
  const maxTrend = Math.max(...trend.map(([, v]) => Math.max(v.income, v.expense)), 1);

  const hasData = filtered.length > 0;

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <ScreenHeader title="현금흐름" onBack={() => navigation?.goBack?.()} />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 기간 Segmented */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
          <Segmented
            options={['이번달', '올해', '작년', '3년', '전체']}
            value={period}
            onChange={(v) => setPeriod(v as Period)}
          />
        </View>

        {!hasData && (
          <EmptyState
            iconCode={TE.receipt}
            title="이 기간에는 거래가 없어요"
            desc="다른 기간을 선택하거나 가계부에서 거래를 추가해보세요"
          />
        )}

        {/* Income vs Expense 카드 */}
        {hasData && (<>
        <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>수입</Text>
              <Text style={[styles.summaryValue, { color: theme.brand }]}>{krwShort(income)}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>지출</Text>
              <Text style={[styles.summaryValue, { color: theme.danger }]}>{krwShort(expense)}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>저축률</Text>
              <Text style={[styles.summaryValue, { color: savingsRate >= 0 ? theme.brand : theme.danger }]}>
                {savingsRate.toFixed(1)}%
              </Text>
            </View>
          </View>
          {income > 0 && (
            <View style={[styles.stackBar, { backgroundColor: theme.border }]}>
              <View style={[styles.stackExpense, { flex: expense / (income || 1), backgroundColor: theme.danger }]} />
              <View style={[styles.stackSavings, { flex: Math.max(0, 1 - expense / (income || 1)), backgroundColor: theme.brand }]} />
            </View>
          )}
        </View>

        {/* 월별 trend */}
        {trend.length > 1 && (
          <View style={[styles.section, { backgroundColor: theme.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>월별 추이</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
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
                      <Text style={[styles.trendLabel, { color: theme.textMuted }]}>{ym.slice(2)}</Text>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        )}

        {/* 카테고리 breakdown */}
        <View style={[styles.section, { backgroundColor: theme.card, marginBottom: 32 }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>지출 카테고리</Text>
          {catBreakdown.length === 0 ? (
            <View style={styles.emptyRow}>
              <TossEmoji code={TE.chartBar} size={36} />
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>해당 기간의 지출이 없어요</Text>
            </View>
          ) : (
            catBreakdown.map(([name, val]) => {
              const def = getCategoryDef(name);
              return (
                <View key={name} style={styles.catRow}>
                  <TossEmoji code={def.iconCode} size={32} bg={def.color + '22'} />
                  <View style={styles.catInfo}>
                    <View style={styles.catTopRow}>
                      <Text style={[styles.catName, { color: theme.text }]}>{name}</Text>
                      <Text style={[styles.catPct, { color: theme.textMuted }]}>
                        {expense > 0 ? ((val / expense) * 100).toFixed(1) : 0}%
                      </Text>
                      <Text style={[styles.catVal, { color: theme.danger }]}>{krwShort(val)}</Text>
                    </View>
                    <HBar value={val} max={maxCat} color={def.color} />
                  </View>
                </View>
              );
            })
          )}
        </View>
        </>)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  summaryCard: { marginHorizontal: 20, marginTop: 8, borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 8 },
  summaryRow: { flexDirection: 'row', marginBottom: 12 },
  summaryItem: { flex: 1, alignItems: 'center', gap: 4 },
  summaryLabel: { fontSize: 12 },
  summaryValue: { fontSize: 18, fontWeight: '700' },
  divider: { width: 1, marginVertical: 4 },
  stackBar: { height: 8, borderRadius: 4, flexDirection: 'row', overflow: 'hidden' },
  stackExpense: { borderRadius: 4 },
  stackSavings: { borderRadius: 4 },
  section: { marginHorizontal: 20, marginTop: 8, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  trendRow: { flexDirection: 'row', gap: 8, paddingBottom: 8, alignItems: 'flex-end' },
  trendCol: { alignItems: 'center', gap: 4 },
  trendBars: { flexDirection: 'row', alignItems: 'flex-end', height: 80 },
  trendBar: { width: 8, borderRadius: 3 },
  trendLabel: { fontSize: 9 },
  emptyRow: { paddingVertical: 24, alignItems: 'center', gap: 10 },
  emptyText: { fontSize: 13 },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  catInfo: { flex: 1, gap: 6 },
  catTopRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  catName: { flex: 1, fontSize: 14, fontWeight: '600' },
  catPct: { fontSize: 12 },
  catVal: { fontSize: 13, fontWeight: '700' },
});

export const Route = createRoute('/more/cashflow', {
  component: CashflowScreen,
});
