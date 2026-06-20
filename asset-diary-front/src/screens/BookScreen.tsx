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
import Segmented from '../components/common/Segmented';
import AddTxSheet from '../components/sheets/AddTxSheet';
import AddRecurringSheet from '../components/sheets/AddRecurringSheet';
import EmptyState from '../components/common/EmptyState';
import ActionSheet from '../components/common/ActionSheet';
import ConfirmDialog from '../components/common/ConfirmDialog';
import AppToast from '../components/common/AppToast';
import { useToggleRecurring, useDeleteRecurring, useDeleteTx } from '../queries/mutations';
import type { MockRecurring, MockTransaction } from '../lib/mock-data';

function todayMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function todayDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
const pad = (n: number) => String(n).padStart(2, '0');

/** 정기항목이 해당 날짜에 유효한지 (활성 + 시작≤날≤종료) */
function recurringActiveOn(r: MockRecurring, dateStr: string): boolean {
  if (!r.active) return false;
  if (r.startDate && dateStr < r.startDate) return false;
  if (r.endDate && dateStr > r.endDate) return false;
  return true;
}

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
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [recOpen, setRecOpen] = useState(false);

  // 시트 상태
  const [addTxVisible, setAddTxVisible] = useState(false);
  const [editTx, setEditTx] = useState<MockTransaction | null>(null);
  const [actionTx, setActionTx] = useState<MockTransaction | null>(null);
  const [deleteTxState, setDeleteTxState] = useState<MockTransaction | null>(null);
  const [addRecVisible, setAddRecVisible] = useState(false);
  const [editRec, setEditRec] = useState<MockRecurring | null>(null);
  const [actionRec, setActionRec] = useState<MockRecurring | null>(null);
  const [deleteRec, setDeleteRec] = useState<MockRecurring | null>(null);
  const [addPicker, setAddPicker] = useState(false);
  const [toast, setToast] = useState('');

  const toggleRecurring = useToggleRecurring();
  const deleteRecurring = useDeleteRecurring();
  const deleteTx = useDeleteTx();

  function handleTxAction(value: string) {
    const t = actionTx;
    setActionTx(null);
    if (!t) return;
    if (value === 'edit') { setEditTx(t); setAddTxVisible(true); }
    else if (value === 'delete') setDeleteTxState(t);
  }
  async function confirmDeleteTx() {
    if (!deleteTxState) return;
    try {
      await deleteTx.mutateAsync(Number(deleteTxState.id));
      setToast('거래를 삭제했어요');
    } catch { setToast('삭제에 실패했어요'); }
    finally { setDeleteTxState(null); }
  }

  // 거래
  const monthTx = useMemo(() => data.transactions.filter((t) => t.date.startsWith(month)), [data.transactions, month]);

  // 정기 (월 결제일 → 가상 발생)
  const recurring = data.recurring;
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

  // 리스트 뷰: 일별 그룹(최신순)
  const groupedTx = useMemo(() => {
    const map = new Map<string, MockTransaction[]>();
    for (const t of monthTx) {
      const arr = map.get(t.date) ?? [];
      arr.push(t);
      map.set(t.date, arr);
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [monthTx]);

  // 리스트 뷰: 카테고리별 지출 통계 (top 5)
  const catBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    monthTx.filter((t) => t.type === 'EXPENSE').forEach((t) => map.set(t.category, (map.get(t.category) ?? 0) + t.amount));
    return [...map.entries()]
      .map(([name, value]) => ({ name, value, color: getCategoryDef(name).color }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [monthTx]);

  // 캘린더 점
  const calLogs: CalLog[] = useMemo(() => {
    const out: CalLog[] = [];
    for (const t of monthTx) {
      out.push({ id: `t${t.id}`, date: t.date, colorLabel: getCategoryDef(t.category).color, settled: true });
    }
    for (const r of recurring) {
      const d = recDateForMonth(r);
      if (recurringActiveOn(r, d)) {
        out.push({ id: `r${r.id}`, date: d, colorLabel: theme.textMuted, settled: true });
      }
    }
    return out;
  }, [monthTx, recurring, month, theme]);

  // 선택일 항목 통합
  const dayItems: DayItem[] = useMemo(() => {
    if (!selectedDate) return [];
    const items: DayItem[] = [];
    monthTx.filter((t) => t.date === selectedDate).forEach((t) => {
      const from = data.assets.find((a) => a.id === t.from);
      items.push({ kind: 'tx', id: t.id, title: t.title, amount: t.amount, type: t.type === 'INCOME' ? 'INCOME' : 'EXPENSE', category: t.category, sub: from ? from.name : undefined });
    });
    recurring.filter((r) => recDateForMonth(r) === selectedDate && recurringActiveOn(r, selectedDate)).forEach((r) => {
      items.push({ kind: 'rec', id: r.id, title: r.title, amount: r.amount, type: r.type === 'INCOME' ? 'INCOME' : 'EXPENSE', rec: r });
    });
    return items;
  }, [selectedDate, monthTx, recurring, data.assets]);

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
    if (value === 'edit') { setEditRec(r); setAddRecVisible(true); }
    else if (value === 'delete') setDeleteRec(r);
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

  function openTxEdit(txId: string) {
    const tx = data.transactions.find((t) => t.id === txId);
    if (tx) { setEditTx(tx); setAddTxVisible(true); }
  }

  // 거래 행 (캘린더 선택일·리스트 뷰 공용)
  function renderTxRow(tx: MockTransaction, i: number, total: number) {
    const isInc = tx.type === 'INCOME';
    const def = getCategoryDef(tx.category);
    const from = tx.from ? data.assets.find((a) => a.id === tx.from) : undefined;
    const canEdit = !isViewer && !useMock;
    return (
      <React.Fragment key={tx.id}>
        <ListRow
          left={<View style={[styles.itemIcon, { backgroundColor: theme.bg }]}><TossEmoji code={def.iconCode} size={18} /></View>}
          contents={
            <View>
              <Text style={[styles.itemTitle, { color: theme.text }]} numberOfLines={1}>{tx.title}</Text>
              <Text style={[styles.itemSub, { color: theme.textMuted }]} numberOfLines={1}>
                {tx.category}{from ? ` · ${from.name}` : ''}
              </Text>
            </View>
          }
          right={
            <View style={styles.recRight}>
              <Text style={[styles.itemAmount, { color: isInc ? theme.brand : theme.text }]}>
                {isInc ? '+' : '-'}{krwShort(tx.amount)}원
              </Text>
              {canEdit && (
                <TouchableOpacity onPress={() => setActionTx(tx)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Text style={[styles.kebab, { color: theme.textMuted }]}>⋯</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          onPress={canEdit ? () => openTxEdit(tx.id) : undefined}
          verticalPadding="small"
        />
        {i < total - 1 && <Border type="full" />}
      </React.Fragment>
    );
  }

  function renderDayItem(item: DayItem, i: number, total: number) {
    const isInc = item.type === 'INCOME';
    const catName = item.kind === 'tx' ? item.category : item.rec.category;
    const def = getCategoryDef(catName);
    const canEditTx = item.kind === 'tx' && !isViewer && !useMock;
    const right = (
      <View style={styles.recRight}>
        <Text style={[styles.itemAmount, { color: isInc ? theme.brand : theme.text }]}>
          {isInc ? '+' : '-'}{krwShort(item.amount)}원
        </Text>
        {canEditTx && (
          <TouchableOpacity onPress={() => { const tx = data.transactions.find((t) => t.id === item.id); if (tx) setActionTx(tx); }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={[styles.kebab, { color: theme.textMuted }]}>⋯</Text>
          </TouchableOpacity>
        )}
      </View>
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
          onPress={item.kind === 'tx' && canEditTx ? () => openTxEdit(item.id) : item.kind === 'rec' ? () => setActionRec(item.rec) : undefined}
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
              <Text style={[styles.itemSub, { color: theme.textMuted }]}>매월 {r.dayOfMonth}일{r.endDate ? ` · ~${r.endDate.slice(0, 7)}` : ''}</Text>
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

        {/* 뷰 토글 */}
        <View style={styles.sectionPad}>
          <Segmented
            options={['캘린더', '리스트']}
            value={viewMode === 'calendar' ? '캘린더' : '리스트'}
            onChange={(v) => setViewMode(v === '캘린더' ? 'calendar' : 'list')}
            small
          />
        </View>

        {viewMode === 'calendar' ? (
          <>
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
          </>
        ) : (
          <>
            {/* 카테고리별 지출 통계 */}
            {catBreakdown.length > 0 && (
              <View style={styles.sectionPad}>
                <View style={[styles.dayCard, { backgroundColor: theme.card, borderColor: theme.border, padding: 16, gap: 12 }]}>
                  <Text style={[styles.statTitle, { color: theme.text }]}>카테고리별 지출</Text>
                  {catBreakdown.map((c) => {
                    const pctW = monthExpense > 0 ? Math.round((c.value / monthExpense) * 100) : 0;
                    return (
                      <View key={c.name} style={styles.statRow}>
                        <View style={styles.statRowTop}>
                          <Text style={[styles.statName, { color: theme.text }]}>{c.name}</Text>
                          <Text style={[styles.statAmount, { color: theme.textMuted }]}>{krwShort(c.value)}원 · {pctW}%</Text>
                        </View>
                        <View style={[styles.statBarBg, { backgroundColor: theme.bg }]}>
                          <View style={[styles.statBarFill, { backgroundColor: c.color, width: `${pctW}%` }]} />
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* 일별 거래 리스트 */}
            <View style={styles.sectionPad}>
              {groupedTx.length === 0 ? (
                <EmptyState compact iconCode={TE.ledger} title="이 달 거래가 없어요" desc={isViewer ? undefined : 'FAB로 추가해보세요'} />
              ) : (
                groupedTx.map(([date, txs]) => {
                  const dayExp = txs.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
                  return (
                    <View key={date} style={{ marginBottom: 12 }}>
                      <View style={styles.dayHeader}>
                        <Text style={[styles.listDayTitle, { color: theme.textMuted }]}>
                          {Number(date.slice(5, 7))}월 {Number(date.slice(8, 10))}일
                        </Text>
                        {dayExp > 0 && <Text style={[styles.listDayExp, { color: theme.textMuted }]}>-{krwShort(dayExp)}원</Text>}
                      </View>
                      <View style={[styles.dayCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        {txs.map((t, i) => renderTxRow(t, i, txs.length))}
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </>
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

      <AddTxSheet
        visible={addTxVisible}
        date={editTx ? undefined : selectedDate}
        editTx={editTx ?? undefined}
        onClose={() => { setAddTxVisible(false); setEditTx(null); }}
      />
      <AddRecurringSheet visible={addRecVisible} editRec={editRec ?? undefined} onClose={() => { setAddRecVisible(false); setEditRec(null); }} />

      {/* 거래 액션 */}
      <ActionSheet
        visible={!!actionTx}
        title={actionTx?.title}
        items={[
          { iconCode: TE.pencil, label: '거래 수정', value: 'edit' },
          { iconCode: TE.trash, label: '거래 삭제', value: 'delete', danger: true },
        ]}
        onSelect={handleTxAction}
        onClose={() => setActionTx(null)}
      />
      <ConfirmDialog
        visible={!!deleteTxState}
        title="거래를 삭제할까요?"
        confirmText="삭제하기"
        danger
        loading={deleteTx.isPending}
        onConfirm={confirmDeleteTx}
        onClose={() => setDeleteTxState(null)}
      />

      {/* 정기 액션 */}
      <ActionSheet
        visible={!!actionRec}
        title={actionRec?.title}
        items={[
          { iconCode: TE.pencil, label: '정기 항목 수정', value: 'edit' },
          { iconCode: TE.trash, label: '정기 항목 삭제', value: 'delete', danger: true },
        ]}
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
  listDayTitle: { fontSize: 13, fontWeight: '700' },
  listDayExp: { fontSize: 12, fontWeight: '600' },
  statTitle: { fontSize: 14, fontWeight: '700' },
  statRow: { gap: 6 },
  statRowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statName: { fontSize: 13, fontWeight: '600' },
  statAmount: { fontSize: 12 },
  statBarBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  statBarFill: { height: 6, borderRadius: 3 },
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
