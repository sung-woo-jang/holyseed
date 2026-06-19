import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Border, ListRow, Switch } from '@toss/tds-react-native';
import { useDataSource, useMockRole } from '../lib/data-source';
import { useTheme } from '../lib/theme';
import { useAuthStore } from '../stores/auth.store';
import { krwShort } from '../lib/format';
import { TE } from '../lib/toss-emoji';
import { getCategoryDef } from '../lib/category-meta';
import TossEmoji from '../components/common/TossEmoji';
import { Icon } from '../components/common/Icon';
import WorkCalendar, { type CalLog } from '../components/WorkCalendar';
import AddTxSheet from '../components/sheets/AddTxSheet';
import AddRecurringSheet from '../components/sheets/AddRecurringSheet';
import EmptyState from '../components/common/EmptyState';
import ActionSheet from '../components/common/ActionSheet';
import ConfirmDialog from '../components/common/ConfirmDialog';
import AppToast from '../components/common/AppToast';
import { useToggleRecurring, useDeleteRecurring } from '../queries/mutations';
import type { MockRecurring } from '../lib/mock-data';

function todayMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function todayDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
const pad = (n: number) => String(n).padStart(2, '0');

/** 통합 선택일 리스트 항목 */
type DayItem =
  | { kind: 'tx'; id: string; title: string; amount: number; type: 'INCOME' | 'EXPENSE'; category: string; sub?: string }
  | { kind: 'rec'; id: string; title: string; amount: number; type: 'INCOME' | 'EXPENSE'; rec: MockRecurring };

export default function BookScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const role = useMockRole();
  const data = useDataSource();
  const { useMock } = useAuthStore();
  const isViewer = role === 'VIEWER';

  const initialMonth = useMock && data.transactions[0]?.date
    ? data.transactions[0].date.slice(0, 7)
    : todayMonth();
  const [month, setMonth] = useState(initialMonth);
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  const [recOpen, setRecOpen] = useState(false);

  // 시트 상태
  const [addTxVisible, setAddTxVisible] = useState(false);
  const [addRecVisible, setAddRecVisible] = useState(false);
  const [actionRec, setActionRec] = useState<MockRecurring | null>(null);
  const [deleteRec, setDeleteRec] = useState<MockRecurring | null>(null);
  const [addPicker, setAddPicker] = useState(false);
  const [toast, setToast] = useState('');

  const toggleRecurring = useToggleRecurring();
  const deleteRecurring = useDeleteRecurring();

  // 거래
  const monthTx = useMemo(() => data.transactions.filter((t) => t.date.startsWith(month)), [data.transactions, month]);

  // 정기 (월 결제일 → 가상 발생)
  const recurring = data.recurring;
  const activeRec = recurring.filter((r) => r.active);
  const [y, m] = month.split('-').map(Number);
  const lastDay = new Date(y!, m!, 0).getDate();
  function recDateForMonth(r: MockRecurring): string {
    return `${month}-${pad(Math.min(r.dayOfMonth, lastDay))}`;
  }

  // 월 네비
  function shiftMonth(delta: number) {
    const yy = y ?? new Date().getFullYear();
    const mm = m ?? 1;
    const d = new Date(yy, (mm - 1) + delta, 1);
    setMonth(`${d.getFullYear()}-${pad(d.getMonth() + 1)}`);
    setSelectedDate(undefined);
  }
  const monthLabel = `${Number(month.slice(5))}월 (${month.slice(0, 4)})`;

  // 요약 (수입/지출)
  const monthIncome = monthTx.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
  const monthExpense = monthTx.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);

  // 캘린더 점
  const calLogs: CalLog[] = useMemo(() => {
    const out: CalLog[] = [];
    for (const t of monthTx) {
      out.push({ id: `t${t.id}`, date: t.date, colorLabel: getCategoryDef(t.category).color, settled: true });
    }
    for (const r of activeRec) {
      out.push({ id: `r${r.id}`, date: recDateForMonth(r), colorLabel: theme.textMuted, settled: true });
    }
    return out;
  }, [monthTx, activeRec, month, theme]);

  // 선택일 항목 통합
  const dayItems: DayItem[] = useMemo(() => {
    if (!selectedDate) return [];
    const items: DayItem[] = [];
    monthTx.filter((t) => t.date === selectedDate).forEach((t) => {
      const from = data.assets.find((a) => a.id === t.from);
      items.push({ kind: 'tx', id: t.id, title: t.title, amount: t.amount, type: t.type === 'INCOME' ? 'INCOME' : 'EXPENSE', category: t.category, sub: from ? from.name : undefined });
    });
    activeRec.filter((r) => recDateForMonth(r) === selectedDate).forEach((r) => {
      items.push({ kind: 'rec', id: r.id, title: r.title, amount: r.amount, type: r.type === 'INCOME' ? 'INCOME' : 'EXPENSE', rec: r });
    });
    return items;
  }, [selectedDate, monthTx, activeRec, data.assets]);

  // 정기 섹션 데이터
  const incomeRec = recurring.filter((r) => r.type === 'INCOME');
  const expenseRec = recurring.filter((r) => r.type !== 'INCOME');
  const totalRecIncome = incomeRec.filter((r) => r.active).reduce((s, r) => s + r.amount, 0);
  const totalRecExpense = expenseRec.filter((r) => r.active).reduce((s, r) => s + r.amount, 0);

  function handleSelectDay(date: string) {
    setSelectedDate((cur) => (cur === date ? undefined : date));
  }

  // 선택일 등록
  function openAddForDay() {
    if (!selectedDate) setSelectedDate(todayDate());
    setAddPicker(true);
  }
  function handleAddPick(value: string) {
    setAddPicker(false);
    if (value === 'tx') setAddTxVisible(true);
    else if (value === 'rec') setAddRecVisible(true);
  }

  // 정기 액션
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
      setToast('정기 항목을 삭제했어요');
    } catch { setToast('삭제에 실패했어요'); }
    finally { setDeleteRec(null); }
  }

  const selectedLabel = selectedDate ? `${Number(selectedDate.slice(5, 7))}월 ${Number(selectedDate.slice(8, 10))}일` : '';

  function renderDayItem(item: DayItem, i: number, total: number) {
    const isInc = item.type === 'INCOME';
    const catName = item.kind === 'tx' ? item.category : item.rec.category;
    const def = getCategoryDef(catName);
    const right = (
      <Text style={[styles.itemAmount, { color: isInc ? theme.brand : theme.text }]}>
        {isInc ? '+' : '-'}{krwShort(item.amount)}원
      </Text>
    );
    return (
      <React.Fragment key={`${item.kind}-${item.id}`}>
        <ListRow
          left={<View style={[styles.itemIcon, { backgroundColor: theme.bg }]}><TossEmoji code={def.iconCode} size={18} /></View>}
          contents={
            <View>
              <View style={styles.itemTitleRow}>
                <Text style={[styles.itemTitle, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
                {item.kind === 'rec' && <View style={[styles.tagChip, { backgroundColor: theme.brandSoft }]}><Text style={[styles.tagText, { color: theme.brand }]}>정기</Text></View>}
              </View>
              {item.kind === 'tx' && item.sub ? <Text style={[styles.itemSub, { color: theme.textMuted }]} numberOfLines={1}>{item.sub}</Text> : null}
            </View>
          }
          right={right}
          verticalPadding="small"
        />
        {i < total - 1 && <Border type="full" />}
      </React.Fragment>
    );
  }

  function renderRecRow(r: MockRecurring, i: number, total: number) {
    const def = getCategoryDef(r.category);
    const isInc = r.type === 'INCOME';
    return (
      <React.Fragment key={r.id}>
        <ListRow
          left={<View style={[styles.itemIcon, { backgroundColor: theme.bg }]}><TossEmoji code={def.iconCode} size={22} /></View>}
          contents={
            <View>
              <Text style={[styles.itemTitle, { color: theme.text }]}>{r.title}</Text>
              <Text style={[styles.itemSub, { color: theme.textMuted }]}>매월 {r.dayOfMonth}일</Text>
            </View>
          }
          right={
            <View style={styles.recRight}>
              <Text style={[styles.itemAmount, { color: isInc ? theme.brand : theme.text }]}>
                {isInc ? '+' : '-'}{krwShort(r.amount)}원
              </Text>
              {!isViewer ? (
                <>
                  <Switch checked={r.active} onCheckedChange={() => toggleRecurring.mutate(Number(r.id))} disabled={toggleRecurring.isPending} />
                  <TouchableOpacity onPress={() => setActionRec(r)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Text style={[styles.kebab, { color: theme.textMuted }]}>⋯</Text>
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
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* 월 네비 */}
        <View style={styles.monthNav}>
          <TouchableOpacity style={[styles.monthBtn, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => shiftMonth(-1)}>
            <Text style={[styles.monthArrow, { color: theme.text }]}>‹</Text>
          </TouchableOpacity>
          <Text style={[styles.monthLabel, { color: theme.text }]}>{monthLabel}</Text>
          <TouchableOpacity style={[styles.monthBtn, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => shiftMonth(1)}>
            <Text style={[styles.monthArrow, { color: theme.text }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* 요약 */}
        <View style={styles.sectionPad}>
          <View style={[styles.summary, { backgroundColor: theme.brandSoft }]}>
            <View style={{ alignItems: 'flex-start' }}>
              <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>수입</Text>
              <Text style={[styles.summaryValue, { color: theme.brand }]}>+{krwShort(monthIncome)}원</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>지출</Text>
              <Text style={[styles.summaryValue, { color: theme.danger }]}>-{krwShort(monthExpense)}원</Text>
            </View>
          </View>
        </View>

        {/* 캘린더 */}
        <View style={[styles.calCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <WorkCalendar month={month} logs={calLogs} selectedDate={selectedDate} onSelectDay={handleSelectDay} />
        </View>

        {/* 선택일 항목 */}
        {selectedDate && (
          <View style={styles.sectionPad}>
            <View style={styles.dayHeader}>
              <Text style={[styles.dayTitle, { color: theme.text }]}>{selectedLabel}</Text>
              {!isViewer && (
                <TouchableOpacity onPress={openAddForDay} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={[styles.addLink, { color: theme.brand }]}>+ 등록</Text>
                </TouchableOpacity>
              )}
            </View>
            {dayItems.length === 0 ? (
              <EmptyState compact iconCode={TE.ledger} title="이 날 기록이 없어요" desc={isViewer ? undefined : '+ 등록으로 추가해보세요'} />
            ) : (
              <View style={[styles.dayCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                {dayItems.map((it, i) => renderDayItem(it, i, dayItems.length))}
              </View>
            )}
          </View>
        )}

        {/* 정기 항목 관리 (접이식) */}
        <View style={styles.sectionPad}>
          <TouchableOpacity
            style={[styles.recHeader, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => setRecOpen((v) => !v)}
            activeOpacity={0.7}
          >
            <View>
              <Text style={[styles.recHeaderTitle, { color: theme.text }]}>정기 항목 관리</Text>
              <Text style={[styles.recHeaderSub, { color: theme.textMuted }]}>
                수입 +{krwShort(totalRecIncome)} · 지출 -{krwShort(totalRecExpense)}
              </Text>
            </View>
            <Text style={[styles.recChevron, { color: theme.textMuted }]}>{recOpen ? '▴' : '▾'}</Text>
          </TouchableOpacity>

          {recOpen && (
            <View style={styles.recBody}>
              {recurring.length === 0 ? (
                <EmptyState compact iconCode={TE.repeat} title="등록된 정기 항목이 없어요" desc={isViewer ? undefined : '아래 버튼으로 추가해보세요'} />
              ) : (
                <>
                  {incomeRec.length > 0 && (
                    <>
                      <Text style={[styles.recSectionTitle, { color: theme.textMuted }]}>정기수입</Text>
                      <View style={[styles.dayCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        {incomeRec.map((r, i) => renderRecRow(r, i, incomeRec.length))}
                      </View>
                    </>
                  )}
                  {expenseRec.length > 0 && (
                    <>
                      <Text style={[styles.recSectionTitle, { color: theme.textMuted }]}>정기지출</Text>
                      <View style={[styles.dayCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        {expenseRec.map((r, i) => renderRecRow(r, i, expenseRec.length))}
                      </View>
                    </>
                  )}
                </>
              )}
              {!isViewer && (
                <TouchableOpacity style={[styles.recAddBtn, { borderColor: theme.brand }]} onPress={() => setAddRecVisible(true)}>
                  <Text style={[styles.recAddText, { color: theme.brand }]}>+ 정기 항목 추가</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      {!isViewer && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.brand, bottom: insets.bottom + 16 }]}
          onPress={openAddForDay}
        >
          {Icon.plus('#fff')}
        </TouchableOpacity>
      )}

      {/* 등록 종류 선택 */}
      <ActionSheet
        visible={addPicker}
        title={`${selectedLabel || '오늘'} 등록`}
        items={[
          { iconCode: TE.ledger, label: '거래 (수입·지출)', value: 'tx' },
          { iconCode: TE.repeat, label: '정기 항목', value: 'rec' },
        ]}
        onSelect={handleAddPick}
        onClose={() => setAddPicker(false)}
      />

      <AddTxSheet visible={addTxVisible} date={selectedDate} onClose={() => setAddTxVisible(false)} />
      <AddRecurringSheet visible={addRecVisible} onClose={() => setAddRecVisible(false)} />

      {/* 정기 액션 */}
      <ActionSheet
        visible={!!actionRec}
        title={actionRec?.title}
        items={[{ iconCode: TE.trash, label: '정기 항목 삭제', value: 'delete', danger: true }]}
        onSelect={handleRecAction}
        onClose={() => setActionRec(null)}
      />
      <ConfirmDialog
        visible={!!deleteRec}
        title="정기 항목을 삭제할까요?"
        description="더 이상 캘린더에 표시되지 않아요."
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
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 8 },
  monthBtn: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  monthArrow: { fontSize: 16, lineHeight: 20 },
  monthLabel: { fontSize: 14, fontWeight: '700' },
  sectionPad: { paddingHorizontal: 20, paddingBottom: 12 },
  summary: { padding: 16, borderRadius: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 13, marginBottom: 2 },
  summaryValue: { fontSize: 18, fontWeight: '700' },
  calCard: { marginHorizontal: 20, marginBottom: 12, borderRadius: 14, borderWidth: 1, paddingVertical: 12 },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  dayTitle: { fontSize: 15, fontWeight: '700' },
  addLink: { fontSize: 14, fontWeight: '700' },
  dayCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  itemIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  itemTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemTitle: { fontSize: 14, fontWeight: '600' },
  itemSub: { fontSize: 11, marginTop: 2 },
  itemAmount: { fontSize: 14, fontWeight: '700' },
  tagChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tagText: { fontSize: 10, fontWeight: '700' },
  recRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  kebab: { fontSize: 20, fontWeight: '700' },
  toggleChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  toggleText: { fontSize: 11, fontWeight: '600' },
  recHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14 },
  recHeaderTitle: { fontSize: 15, fontWeight: '700' },
  recHeaderSub: { fontSize: 12, marginTop: 3 },
  recChevron: { fontSize: 14 },
  recBody: { marginTop: 12, gap: 8 },
  recSectionTitle: { fontSize: 12, fontWeight: '600', marginTop: 4, marginBottom: 4 },
  recAddBtn: { borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  recAddText: { fontSize: 14, fontWeight: '700' },
  fab: { position: 'absolute', right: 20, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: '#3182F6', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
});
