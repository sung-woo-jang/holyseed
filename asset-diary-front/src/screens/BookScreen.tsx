import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Switch } from '@toss/tds-react-native';
import { useDataSource, useMockRole } from '../lib/data-source';
import { useTheme } from '../lib/theme';
import { krwShort, monthDayWeek } from '../lib/format';
import { getCategoryDef } from '../lib/category-meta';
import { TE } from '../lib/toss-emoji';
import TossEmoji from '../components/common/TossEmoji';
import AutoBadge from '../components/common/AutoBadge';
import { Icon } from '../components/common/Icon';
import AddTxSheet from '../components/sheets/AddTxSheet';
import AddRecurringSheet from '../components/sheets/AddRecurringSheet';
import { useToggleRecurring } from '../queries/mutations';

type BookTab = 'tx' | 'rec';

export default function BookScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const role = useMockRole();
  const data = useDataSource();
  const [tab, setTab] = useState<BookTab>('tx');
  const [addTxVisible, setAddTxVisible] = useState(false);
  const [addRecVisible, setAddRecVisible] = useState(false);
  const isViewer = role === 'VIEWER';
  const toggleRecurring = useToggleRecurring();

  const months = useMemo(() => {
    const set = new Set(data.transactions.map(t => t.date.slice(0, 7)));
    return [...set].sort().reverse();
  }, [data.transactions]);

  const [month, setMonth] = useState(months[0] ?? '2026-04');
  const monthIdx = months.indexOf(month);
  const canPrev = monthIdx < months.length - 1;
  const canNext = monthIdx > 0;

  const monthTx = useMemo(
    () => data.transactions.filter(t => t.date.startsWith(month)),
    [data.transactions, month]
  );

  const grouped: Record<string, typeof monthTx> = {};
  monthTx.forEach(t => {
    if (!grouped[t.date]) grouped[t.date] = [];
    grouped[t.date]!.push(t);
  });
  const dates = Object.keys(grouped).sort().reverse();

  const monthIncome = monthTx.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
  const monthExpense = monthTx.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
  const savingsRate = monthIncome > 0 ? Math.round(((monthIncome - monthExpense) / monthIncome) * 100) : 0;
  const monthLabel = `${parseInt(month.slice(5))}월 (${month.slice(0, 4)})`;

  const recurring = data.recurring;
  const activeRec = recurring.filter(r => r.active);
  const inactiveRec = recurring.filter(r => !r.active);
  const totalRec = activeRec.reduce((s, r) => s + r.amount, 0);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      {/* Tab selector */}
      <View style={[styles.tabRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {([['tx', '거래'], ['rec', '정기지출']] as [BookTab, string][]).map(([k, l]) => (
          <TouchableOpacity
            key={k}
            style={[styles.tabBtn, tab === k && { backgroundColor: theme.brand }]}
            onPress={() => setTab(k)}
          >
            <Text style={[styles.tabText, { color: tab === k ? '#fff' : theme.textMuted }]}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {tab === 'tx' && (
          <>
            {/* Month navigation */}
            <View style={styles.monthNav}>
              <TouchableOpacity
                style={[styles.monthBtn, { backgroundColor: theme.card, borderColor: theme.border, opacity: canPrev ? 1 : 0.4 }]}
                onPress={() => canPrev && setMonth(months[monthIdx + 1]!)}
                disabled={!canPrev}
              >
                <Text style={[styles.monthArrow, { color: theme.text }]}>‹</Text>
              </TouchableOpacity>
              <Text style={[styles.monthLabel, { color: theme.text }]}>{monthLabel}</Text>
              <TouchableOpacity
                style={[styles.monthBtn, { backgroundColor: theme.card, borderColor: theme.border, opacity: canNext ? 1 : 0.4 }]}
                onPress={() => canNext && setMonth(months[monthIdx - 1]!)}
                disabled={!canNext}
              >
                <Text style={[styles.monthArrow, { color: theme.text }]}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Cashflow summary */}
            <View style={styles.cfRow}>
              <View>
                <Text style={[styles.cfLabel, { color: theme.textMuted }]}>수입</Text>
                <Text style={[styles.cfValue, { color: theme.brand }]}>+{krwShort(monthIncome)}원</Text>
              </View>
              <View>
                <Text style={[styles.cfLabel, { color: theme.textMuted }]}>지출</Text>
                <Text style={[styles.cfValue, { color: theme.danger }]}>-{krwShort(monthExpense)}원</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.cfLabel, { color: theme.textMuted }]}>저축률</Text>
                <Text style={[styles.cfValue, { color: theme.text }]}>{savingsRate}%</Text>
              </View>
            </View>

            {dates.length === 0 ? (
              <View style={styles.empty}>
                <Text style={[styles.emptyText, { color: theme.textMuted }]}>이 달엔 거래가 없어요</Text>
              </View>
            ) : (
              dates.map(d => {
                const items = grouped[d] ?? [];
                const dayExp = items.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
                return (
                  <View key={d} style={styles.dayBlock}>
                    <View style={styles.dayHeader}>
                      <Text style={[styles.dayTitle, { color: theme.textMuted }]}>{monthDayWeek(d)}</Text>
                      <Text style={[styles.dayExp, { color: theme.textMuted }]}>-{krwShort(dayExp)}원</Text>
                    </View>
                    <View style={[styles.dayCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                      {items.map((t, i) => {
                        const catDef = getCategoryDef(t.category);
                        const fromAsset = data.assets.find(a => a.id === t.from);
                        return (
                          <View
                            key={t.id}
                            style={[styles.txRow, i < items.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }]}
                          >
                            <View style={[styles.txIcon, { backgroundColor: theme.bg }]}>
                              <TossEmoji code={catDef.iconCode} size={18} />
                            </View>
                            <View style={styles.txInfo}>
                              <View style={styles.txTitleRow}>
                                <Text style={[styles.txTitle, { color: theme.text }]} numberOfLines={1}>{t.title}</Text>
                                {t.auto && <AutoBadge />}
                              </View>
                              <Text style={[styles.txMeta, { color: theme.textMuted }]} numberOfLines={1}>
                                {t.category}{fromAsset ? ` · ${fromAsset.name}` : ''}{t.memo ? ` · ${t.memo}` : ''}
                              </Text>
                            </View>
                            <Text style={[styles.txAmount, { color: t.type === 'INCOME' ? theme.brand : t.type === 'TRANSFER' ? theme.textMuted : theme.text }]}>
                              {t.type === 'INCOME' ? '+' : t.type === 'EXPENSE' ? '-' : ''}{krwShort(t.amount)}원
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}

        {tab === 'rec' && (
          <>
            {/* Summary card */}
            <View style={styles.sectionPad}>
              <View style={[styles.recSummary, { backgroundColor: theme.brandSoft }]}>
                <Text style={[styles.recSummaryLabel, { color: theme.textMuted }]}>매월 고정으로 나가는 돈</Text>
                <Text style={[styles.recSummaryValue, { color: theme.brand }]}>-{krwShort(totalRec)}원</Text>
                <Text style={[styles.recSummaryMeta, { color: theme.textMuted }]}>활성 {activeRec.length}건 · 일시중지 {inactiveRec.length}건</Text>
              </View>
            </View>

            {/* Simulation button */}
            {!isViewer && (
              <View style={styles.sectionPad}>
                <TouchableOpacity style={[styles.simBtn, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <TossEmoji code={TE.lightning} size={16} />
                  <Text style={[styles.simBtnText, { color: theme.text }]}>자동 생성 시뮬레이션 (오늘이 17일이라면?)</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Recurring items */}
            <View style={styles.sectionPad}>
              <View style={[styles.dayCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                {recurring.map((r, i) => {
                  const catDef = getCategoryDef(r.category);
                  return (
                    <View
                      key={r.id}
                      style={[styles.recRow, i < recurring.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }]}
                    >
                      <View style={[styles.recIcon, { backgroundColor: theme.bg }]}>
                        <TossEmoji code={catDef.iconCode} size={22} />
                      </View>
                      <View style={styles.txInfo}>
                        <Text style={[styles.txTitle, { color: theme.text }]}>{r.title}</Text>
                        <Text style={[styles.txMeta, { color: theme.textMuted }]}>매월 {r.dayOfMonth}일 · 다음: {r.nextDate}</Text>
                      </View>
                      <View style={styles.recRight}>
                        <Text style={[styles.recAmount, { color: theme.text }]}>-{krwShort(r.amount)}원</Text>
                        {!isViewer && (
                          <Switch
                            checked={r.active}
                            onCheckedChange={() => toggleRecurring.mutate(Number(r.id))}
                            disabled={toggleRecurring.isPending}
                          />
                        )}
                        {isViewer && (
                          <View style={[styles.toggleChip, { backgroundColor: r.active ? theme.brand : theme.bg }]}>
                            <Text style={[styles.toggleText, { color: r.active ? '#fff' : theme.textMuted }]}>{r.active ? '활성' : '중지'}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* FAB */}
      {!isViewer && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.brand, bottom: insets.bottom + 16 }]}
          onPress={() => tab === 'tx' ? setAddTxVisible(true) : setAddRecVisible(true)}
        >
          {Icon.plus('#fff')}
        </TouchableOpacity>
      )}

      <AddTxSheet visible={addTxVisible} onClose={() => setAddTxVisible(false)} />
      <AddRecurringSheet visible={addRecVisible} onClose={() => setAddRecVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  tabRow: { flexDirection: 'row', gap: 4, padding: 4, marginHorizontal: 20, marginTop: 8, borderRadius: 12, borderWidth: 1 },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  tabText: { fontSize: 13, fontWeight: '700' },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 14 },
  monthBtn: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  monthArrow: { fontSize: 16, lineHeight: 20 },
  monthLabel: { fontSize: 14, fontWeight: '700' },
  cfRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 12 },
  cfLabel: { fontSize: 11, marginBottom: 4 },
  cfValue: { fontSize: 17, fontWeight: '700' },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 13 },
  dayBlock: { paddingHorizontal: 20, paddingBottom: 12 },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, paddingBottom: 6 },
  dayTitle: { fontSize: 12, fontWeight: '600' },
  dayExp: { fontSize: 11 },
  dayCard: { borderRadius: 12, borderWidth: 1 },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
  txIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  txInfo: { flex: 1, minWidth: 0 },
  txTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  txTitle: { fontSize: 13, fontWeight: '600', flex: 1 },
  txMeta: { fontSize: 11, marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: '700' },
  sectionPad: { paddingHorizontal: 20, paddingBottom: 12 },
  recSummary: { padding: 16, borderRadius: 14 },
  recSummaryLabel: { fontSize: 12, marginBottom: 4 },
  recSummaryValue: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  recSummaryMeta: { fontSize: 12 },
  simBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, borderRadius: 12, borderWidth: 1 },
  simBtnText: { fontSize: 13, fontWeight: '600' },
  recRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  recIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  recRight: { alignItems: 'flex-end', gap: 4 },
  recAmount: { fontSize: 14, fontWeight: '700' },
  toggleChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  toggleText: { fontSize: 11, fontWeight: '600' },
  fab: { position: 'absolute', right: 20, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: '#3182F6', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
});
