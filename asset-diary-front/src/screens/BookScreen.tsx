import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Border, ListRow, SegmentedControl, Switch } from '@toss/tds-react-native';
import { useDataSource, useMockRole } from '../lib/data-source';
import { useTheme } from '../lib/theme';
import { krwShort, monthDayWeek } from '../lib/format';
import { TE } from '../lib/toss-emoji';
import { getCategoryDef } from '../lib/category-meta';
import TossEmoji from '../components/common/TossEmoji';
import AutoBadge from '../components/common/AutoBadge';
import { Icon } from '../components/common/Icon';
import AddTxSheet from '../components/sheets/AddTxSheet';
import AddRecurringSheet from '../components/sheets/AddRecurringSheet';
import EmptyState from '../components/common/EmptyState';
import ActionSheet from '../components/common/ActionSheet';
import ConfirmDialog from '../components/common/ConfirmDialog';
import AppToast from '../components/common/AppToast';
import { useToggleRecurring, useDeleteRecurring } from '../queries/mutations';
import type { MockRecurring } from '../lib/mock-data';

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
  const deleteRecurring = useDeleteRecurring();
  const [actionRec, setActionRec] = useState<MockRecurring | null>(null);
  const [deleteRec, setDeleteRec] = useState<MockRecurring | null>(null);
  const [toast, setToast] = useState('');

  function handleRecAction(value: string) {
    const r = actionRec;
    setActionRec(null);
    if (!r) return;
    if (value === 'delete') setDeleteRec(r);
  }

  async function confirmDeleteRec() {
    if (!deleteRec) return;
    try {
      await deleteRecurring.mutateAsync(Number(deleteRec.id));
      setToast('정기지출을 삭제했어요');
    } catch {
      setToast('삭제에 실패했어요');
    } finally {
      setDeleteRec(null);
    }
  }

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
  const incomeRec = recurring.filter(r => r.type === 'INCOME');
  const expenseRec = recurring.filter(r => r.type !== 'INCOME');
  const totalRecIncome = incomeRec.filter(r => r.active).reduce((s, r) => s + r.amount, 0);
  const totalRecExpense = expenseRec.filter(r => r.active).reduce((s, r) => s + r.amount, 0);

  function renderRecRow(r: typeof recurring[number], i: number, total: number) {
    const catDef = getCategoryDef(r.category);
    const isInc = r.type === 'INCOME';
    return (
      <React.Fragment key={r.id}>
        <ListRow
          left={
            <View style={[styles.recIcon, { backgroundColor: theme.bg }]}>
              <TossEmoji code={catDef.iconCode} size={22} />
            </View>
          }
          contents={
            <View>
              <Text style={[styles.txTitle, { color: theme.text }]}>{r.title}</Text>
              <Text style={[styles.txMeta, { color: theme.textMuted }]}>매월 {r.dayOfMonth}일 · 다음: {r.nextDate}</Text>
            </View>
          }
          right={
            <View style={styles.recRight}>
              <Text style={[styles.recAmount, { color: isInc ? theme.brand : theme.text }]}>
                {isInc ? '+' : '-'}{krwShort(r.amount)}원
              </Text>
              {!isViewer ? (
                <>
                  <Switch
                    checked={r.active}
                    onCheckedChange={() => toggleRecurring.mutate(Number(r.id))}
                    disabled={toggleRecurring.isPending}
                  />
                  <TouchableOpacity
                    onPress={() => setActionRec(r)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={[styles.kebabIcon, { color: theme.textMuted }]}>⋯</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={[styles.toggleChip, { backgroundColor: r.active ? theme.brand : theme.bg }]}>
                  <Text style={[styles.toggleText, { color: r.active ? '#fff' : theme.textMuted }]}>{r.active ? '활성' : '중지'}</Text>
                </View>
              )}
            </View>
          }
          verticalPadding="small"
        />
        {i < total - 1 && <Border type="full" />}
      </React.Fragment>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      {/* Tab SegmentedControl */}
      <View style={styles.segWrap}>
        <SegmentedControl.Root
          value={tab}
          onChange={(v) => setTab(v as BookTab)}
          name="bookTab"
          size="large"
          alignment="fixed"
        >
          <SegmentedControl.Item value="tx">거래</SegmentedControl.Item>
          <SegmentedControl.Item value="rec">정기지출</SegmentedControl.Item>
        </SegmentedControl.Root>
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
                    {items.map((t, i) => {
                      const catDef = getCategoryDef(t.category);
                      const fromAsset = data.assets.find(a => a.id === t.from);
                      return (
                        <React.Fragment key={t.id}>
                          <ListRow
                            left={
                              <View style={[styles.txIcon, { backgroundColor: theme.bg }]}>
                                <TossEmoji code={catDef.iconCode} size={18} />
                              </View>
                            }
                            contents={
                              <View>
                                <View style={styles.txTitleRow}>
                                  <Text style={[styles.txTitle, { color: theme.text }]} numberOfLines={1}>{t.title}</Text>
                                  {t.auto && <AutoBadge />}
                                </View>
                                <Text style={[styles.txMeta, { color: theme.textMuted }]} numberOfLines={1}>
                                  {t.category}{fromAsset ? ` · ${fromAsset.name}` : ''}{t.memo ? ` · ${t.memo}` : ''}
                                </Text>
                              </View>
                            }
                            right={
                              <Text style={[styles.txAmount, { color: t.type === 'INCOME' ? theme.brand : t.type === 'TRANSFER' ? theme.textMuted : theme.text }]}>
                                {t.type === 'INCOME' ? '+' : t.type === 'EXPENSE' ? '-' : ''}{krwShort(t.amount)}원
                              </Text>
                            }
                            verticalPadding="small"
                          />
                          {i < items.length - 1 && <Border type="full" />}
                        </React.Fragment>
                      );
                    })}
                  </View>
                );
              })
            )}
          </>
        )}

        {tab === 'rec' && (
          <>
            {/* Summary card */}
            {recurring.length > 0 && (
              <View style={styles.sectionPad}>
                <View style={[styles.recSummary, { backgroundColor: theme.brandSoft }]}>
                  <View style={styles.recSummaryRow}>
                    <Text style={[styles.recSummaryLabel, { color: theme.textMuted }]}>매월 고정 수입</Text>
                    <Text style={[styles.recSummaryValue, { color: theme.brand }]}>+{krwShort(totalRecIncome)}원</Text>
                  </View>
                  <View style={styles.recSummaryRow}>
                    <Text style={[styles.recSummaryLabel, { color: theme.textMuted }]}>매월 고정 지출</Text>
                    <Text style={[styles.recSummaryValue, { color: theme.danger }]}>-{krwShort(totalRecExpense)}원</Text>
                  </View>
                </View>
              </View>
            )}

            {/* 빈 상태 */}
            {recurring.length === 0 && (
              <EmptyState
                iconCode={TE.repeat}
                title="등록된 정기 항목이 없어요"
                desc={isViewer ? '소유자가 정기 항목을 추가하면 표시돼요' : '아래 + 버튼으로 매월 고정 수입·지출을 등록해보세요'}
              />
            )}

            {/* 수입 섹션 */}
            {incomeRec.length > 0 && (
              <>
                <Text style={[styles.recSectionTitle, { color: theme.textMuted }]}>정기수입</Text>
                {incomeRec.map((r, i) => renderRecRow(r, i, incomeRec.length))}
              </>
            )}

            {/* 지출 섹션 */}
            {expenseRec.length > 0 && (
              <>
                <Text style={[styles.recSectionTitle, { color: theme.textMuted }]}>정기지출</Text>
                {expenseRec.map((r, i) => renderRecRow(r, i, expenseRec.length))}
              </>
            )}
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

      {/* 정기지출 행 액션 */}
      <ActionSheet
        visible={!!actionRec}
        title={actionRec?.title}
        items={[
          { iconCode: TE.trash, label: '정기지출 삭제', value: 'delete', danger: true },
        ]}
        onSelect={handleRecAction}
        onClose={() => setActionRec(null)}
      />
      <ConfirmDialog
        visible={!!deleteRec}
        title="정기지출을 삭제할까요?"
        description="더 이상 자동으로 기록되지 않아요."
        confirmText="삭제하기"
        danger
        loading={deleteRecurring.isPending}
        onConfirm={confirmDeleteRec}
        onClose={() => setDeleteRec(null)}
      />
      <AppToast open={!!toast} text={toast} onClose={() => setToast('')} />
    </View>
  );
}

const styles = StyleSheet.create({
  segWrap: { paddingHorizontal: 20, paddingVertical: 8 },
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
  txIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  txTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  txTitle: { fontSize: 13, fontWeight: '600', flex: 1 },
  txMeta: { fontSize: 11, marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: '700' },
  sectionPad: { paddingHorizontal: 20, paddingBottom: 12 },
  recSummary: { padding: 16, borderRadius: 14, gap: 8 },
  recSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recSummaryLabel: { fontSize: 13 },
  recSummaryValue: { fontSize: 18, fontWeight: '700' },
  recSummaryMeta: { fontSize: 12 },
  recSectionTitle: { fontSize: 12, fontWeight: '600', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  recIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  recRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  kebabIcon: { fontSize: 20, fontWeight: '700' },
  recAmount: { fontSize: 14, fontWeight: '700' },
  toggleChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  toggleText: { fontSize: 11, fontWeight: '600' },
  fab: { position: 'absolute', right: 20, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: '#3182F6', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
});
