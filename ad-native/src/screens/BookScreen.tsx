import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BookStackParamList } from '../navigation/types';
import Border from '../components/ui/Border';
import ListRow from '../components/ui/ListRow';
import Switch from '../components/ui/Switch';
import { useHouseholdData, type HouseholdRecurring, type HouseholdTransaction } from '../queries/useHouseholdData';
import { useTheme } from '../lib/theme';
import { useAuthStore } from '../stores/auth.store';
import { krw } from '../lib/format';
import { TE } from '../lib/toss-emoji';
import { getCategoryDef, resolveCategoryVisual, resolveRootCategoryId } from '../lib/category-meta';
import TossEmoji from '../components/common/TossEmoji';
import CategoryIcon from '../components/common/CategoryIcon';
import { Icon } from '../components/common/Icon';
import WorkCalendar, { type CalLog } from '../components/WorkCalendar';
import Segmented from '../components/common/Segmented';
import AddTxSheet from '../components/sheets/AddTxSheet';
import AddRecurringSheet from '../components/sheets/AddRecurringSheet';
import MissedRecurringSheet from '../components/sheets/MissedRecurringSheet';
import { recurringApi } from '../api';
import { qk } from '../queries/keys';
import EmptyState from '../components/common/EmptyState';
import ActionSheet from '../components/common/ActionSheet';
import ConfirmDialog from '../components/common/ConfirmDialog';
import AppToast from '../components/common/AppToast';
import { useToggleRecurring, useDeleteRecurring, useDeleteTx } from '../queries/mutations';
import { todayLocal } from '../lib/date';

function todayMonth(): string {
  return todayLocal().slice(0, 7);
}
const pad = (n: number) => String(n).padStart(2, '0');

function recurringActiveOn(r: HouseholdRecurring, dateStr: string): boolean {
  if (!r.active) return false;
  if (r.startDate && dateStr < r.startDate) return false;
  if (r.endDate && dateStr > r.endDate) return false;
  return true;
}

type DayItem =
  | { kind: 'tx'; id: string; title: string; amount: number; type: 'INCOME' | 'EXPENSE'; category: string; categoryId: number | null; sub?: string }
  | { kind: 'rec'; id: string; title: string; amount: number; type: 'INCOME' | 'EXPENSE'; rec: HouseholdRecurring };

type Props = NativeStackScreenProps<BookStackParamList, 'BookHome'>;

export default function BookScreen({ navigation }: Props) {
  const theme = useTheme();
  const data = useHouseholdData();
  const currentHousehold = useAuthStore((s) => s.currentHousehold);
  const isViewer = currentHousehold?.role === 'VIEWER';
  const hid = currentHousehold?.id;

  const [month, setMonth] = useState(todayMonth());
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [typeFilter, setTypeFilter] = useState<'all' | 'INCOME' | 'EXPENSE'>('all');
  const [catFilter, setCatFilter] = useState<Set<string>>(new Set());
  const [recOpen, setRecOpen] = useState(false);

  const [addTxVisible, setAddTxVisible] = useState(false);
  const [editTx, setEditTx] = useState<HouseholdTransaction | null>(null);
  const [actionTx, setActionTx] = useState<HouseholdTransaction | null>(null);
  const [deleteTxState, setDeleteTxState] = useState<HouseholdTransaction | null>(null);
  const [addRecVisible, setAddRecVisible] = useState(false);
  const [editRec, setEditRec] = useState<HouseholdRecurring | null>(null);
  const [actionRec, setActionRec] = useState<HouseholdRecurring | null>(null);
  const [deleteRec, setDeleteRec] = useState<HouseholdRecurring | null>(null);
  const [addPicker, setAddPicker] = useState(false);
  const [missedVisible, setMissedVisible] = useState(false);
  const [toast, setToast] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const missedQ = useQuery({
    queryKey: qk.recurringMissed(hid!),
    queryFn: () => recurringApi.missed(hid!),
    enabled: !!hid,
  });
  const missed = missedQ.data ?? [];

  const toggleRecurring = useToggleRecurring();
  const deleteRecurring = useDeleteRecurring();
  const deleteTx = useDeleteTx();

  async function onRefresh() {
    setRefreshing(true);
    try {
      await Promise.all([data.refetch(), missedQ.refetch()]);
    } finally {
      setRefreshing(false);
    }
  }

  function handleTxAction(value: string) {
    const t = actionTx;
    setActionTx(null);
    if (!t) return;
    if (value === 'edit') {
      setEditTx(t);
      setAddTxVisible(true);
    } else if (value === 'delete') setDeleteTxState(t);
  }
  async function confirmDeleteTx() {
    if (!deleteTxState) return;
    try {
      await deleteTx.mutateAsync(Number(deleteTxState.id));
      setToast('거래를 삭제했어요');
    } catch {
      setToast('삭제에 실패했어요');
    } finally {
      setDeleteTxState(null);
    }
  }

  const monthTx = useMemo(() => data.transactions.filter((t) => t.date.startsWith(month)), [data.transactions, month]);

  function rootCategoryName(t: HouseholdTransaction): string {
    const rootId = resolveRootCategoryId(t.categoryId, data.categories);
    const rootCat = rootId != null ? data.categories.find((c) => c.id === rootId) : undefined;
    return rootCat?.name ?? t.category;
  }

  const monthCats = useMemo(
    () => [...new Set((typeFilter === 'all' ? monthTx : monthTx.filter((t) => t.type === typeFilter)).map((t) => rootCategoryName(t)))],
    [monthTx, typeFilter, data.categories],
  );

  function handleTypeFilter(v: 'all' | 'INCOME' | 'EXPENSE') {
    setTypeFilter(v);
    const scopedCats = new Set((v === 'all' ? monthTx : monthTx.filter((t) => t.type === v)).map((t) => rootCategoryName(t)));
    setCatFilter((prev) => new Set([...prev].filter((c) => scopedCats.has(c))));
  }

  const filteredTx = useMemo(
    () =>
      monthTx.filter((t) => {
        if (typeFilter !== 'all' && t.type !== typeFilter) return false;
        if (catFilter.size > 0 && !catFilter.has(rootCategoryName(t))) return false;
        return true;
      }),
    [monthTx, typeFilter, catFilter, data.categories],
  );

  const recurring = data.recurring;
  const [y, m] = month.split('-').map(Number);
  const lastDay = new Date(y!, m!, 0).getDate();
  function recDateForMonth(r: HouseholdRecurring): string {
    return `${month}-${pad(Math.min(r.dayOfMonth, lastDay))}`;
  }

  function shiftMonth(delta: number) {
    const yy = y ?? new Date().getFullYear();
    const mm = m ?? 1;
    const d = new Date(yy, mm - 1 + delta, 1);
    setMonth(`${d.getFullYear()}-${pad(d.getMonth() + 1)}`);
    setSelectedDate(undefined);
    setTypeFilter('all');
    setCatFilter(new Set());
  }
  const monthLabel = `${Number(month.slice(5))}월 (${month.slice(0, 4)})`;

  const monthIncome = monthTx.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
  const monthExpense = monthTx.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);

  const catBreakdownDrilled = catFilter.size > 0;
  const catBreakdown = useMemo(() => {
    const sums = new Map<string, number>();
    for (const t of filteredTx) {
      if (t.type !== 'EXPENSE') continue;
      const key = catBreakdownDrilled ? t.category : rootCategoryName(t);
      sums.set(key, (sums.get(key) ?? 0) + t.amount);
    }
    return [...sums.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [filteredTx, catBreakdownDrilled, data.categories]);

  const groupedTx = useMemo(() => {
    const map = new Map<string, HouseholdTransaction[]>();
    for (const t of filteredTx) {
      const arr = map.get(t.date) ?? [];
      arr.push(t);
      map.set(t.date, arr);
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredTx]);

  const calLogs: CalLog[] = useMemo(() => {
    const out: CalLog[] = [];
    for (const t of monthTx) {
      out.push({ id: `t${t.id}`, date: t.date, colorLabel: resolveCategoryVisual(t.categoryId, t.category, data.categories).color, settled: true });
    }
    for (const r of recurring) {
      const d = recDateForMonth(r);
      if (recurringActiveOn(r, d)) {
        out.push({ id: `r${r.id}`, date: d, colorLabel: theme.textMuted, settled: true });
      }
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthTx, recurring, month, theme, data.categories]);

  const dayItems: DayItem[] = useMemo(() => {
    if (!selectedDate) return [];
    const items: DayItem[] = [];
    monthTx
      .filter((t) => t.date === selectedDate)
      .forEach((t) => {
        const from = data.assets.find((a) => a.id === t.from);
        items.push({ kind: 'tx', id: t.id, title: t.title, amount: t.amount, type: t.type === 'INCOME' ? 'INCOME' : 'EXPENSE', category: t.category, categoryId: t.categoryId, sub: from ? from.name : undefined });
      });
    recurring
      .filter((r) => recDateForMonth(r) === selectedDate && recurringActiveOn(r, selectedDate))
      .forEach((r) => {
        items.push({ kind: 'rec', id: r.id, title: r.title, amount: r.amount, type: r.type === 'INCOME' ? 'INCOME' : 'EXPENSE', rec: r });
      });
    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, monthTx, recurring, data.assets]);

  const incomeRec = recurring.filter((r) => r.type === 'INCOME');
  const expenseRec = recurring.filter((r) => r.type !== 'INCOME');
  const totalRecIncome = incomeRec.filter((r) => r.active).reduce((s, r) => s + r.amount, 0);
  const totalRecExpense = expenseRec.filter((r) => r.active).reduce((s, r) => s + r.amount, 0);

  function handleSelectDay(date: string) {
    setSelectedDate((cur) => (cur === date ? undefined : date));
  }

  function toggleCatFilter(cat: string) {
    setCatFilter((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }
  function resetFilters() {
    setTypeFilter('all');
    setCatFilter(new Set());
  }

  function openAddForDay() {
    if (!selectedDate) setSelectedDate(todayLocal());
    setAddPicker(true);
  }
  function handleAddPick(value: string) {
    setAddPicker(false);
    if (value === 'tx') setAddTxVisible(true);
    else if (value === 'rec') setAddRecVisible(true);
  }

  function handleRecAction(value: string) {
    const r = actionRec;
    setActionRec(null);
    if (!r) return;
    if (value === 'edit') {
      setEditRec(r);
      setAddRecVisible(true);
    } else if (value === 'delete') setDeleteRec(r);
  }
  async function confirmDeleteRec() {
    if (!deleteRec) return;
    try {
      await deleteRecurring.mutateAsync(Number(deleteRec.id));
      setToast('정기 항목을 삭제했어요');
    } catch {
      setToast('삭제에 실패했어요');
    } finally {
      setDeleteRec(null);
    }
  }

  const selectedLabel = selectedDate ? `${Number(selectedDate.slice(5, 7))}월 ${Number(selectedDate.slice(8, 10))}일` : '';

  function openTxEdit(txId: string) {
    const tx = data.transactions.find((t) => t.id === txId);
    if (tx) {
      setEditTx(tx);
      setAddTxVisible(true);
    }
  }

  function renderTxRow(tx: HouseholdTransaction, i: number, total: number) {
    const isInc = tx.type === 'INCOME';
    const visual = resolveCategoryVisual(tx.categoryId, tx.category, data.categories);
    const canEdit = !isViewer;
    return (
      <View key={tx.id}>
        <ListRow
          left={
            <View style={[styles.itemIcon, { backgroundColor: theme.bg }]}>
              <CategoryIcon icon={visual.icon} size={18} />
            </View>
          }
          contents={
            <View>
              <Text style={{ color: theme.text, fontSize: 14, fontWeight: '600' }}>{tx.title}</Text>
              <Text style={{ color: theme.textMuted, fontSize: 11 }}>{tx.category}</Text>
            </View>
          }
          right={
            <View style={styles.recRight}>
              <Text style={{ color: isInc ? theme.brand : theme.text, fontSize: 14, fontWeight: '700' }}>
                {isInc ? '+' : '-'}
                {krw(tx.amount)}
              </Text>
              {canEdit && (
                <Pressable hitSlop={8} onPress={() => setActionTx(tx)}>
                  <Text style={{ color: theme.textMuted, fontSize: 18, fontWeight: '700' }}>⋯</Text>
                </Pressable>
              )}
            </View>
          }
          onPress={() => navigation.navigate('TransactionDetail', { id: tx.id })}
          verticalPadding="small"
        />
        {i < total - 1 && <Border type="full" />}
      </View>
    );
  }

  function renderDayItem(item: DayItem, i: number, total: number) {
    const isInc = item.type === 'INCOME';
    const visual =
      item.kind === 'tx'
        ? resolveCategoryVisual(item.categoryId, item.category, data.categories)
        : resolveCategoryVisual(item.rec.categoryId, item.rec.category, data.categories);
    const canEditTx = item.kind === 'tx' && !isViewer;
    return (
      <View key={`${item.kind}-${item.id}`}>
        <ListRow
          left={
            <View style={[styles.itemIcon, { backgroundColor: theme.bg }]}>
              <CategoryIcon icon={visual.icon} size={18} />
            </View>
          }
          contents={
            <View>
              <View style={styles.itemTitleRow}>
                <Text style={{ color: theme.text, fontSize: 14, fontWeight: '600' }}>{item.title}</Text>
                {item.kind === 'rec' && (
                  <View style={[styles.tagChip, { backgroundColor: theme.brandSoft }]}>
                    <Text style={{ color: theme.brand, fontSize: 10, fontWeight: '700' }}>정기</Text>
                  </View>
                )}
              </View>
              {item.kind === 'tx' && item.sub ? <Text style={{ color: theme.textMuted, fontSize: 11 }}>{item.sub}</Text> : null}
            </View>
          }
          right={
            <View style={styles.recRight}>
              <Text style={{ color: isInc ? theme.brand : theme.text, fontSize: 14, fontWeight: '700' }}>
                {isInc ? '+' : '-'}
                {krw(item.amount)}
              </Text>
              {canEditTx && (
                <Pressable
                  hitSlop={8}
                  onPress={() => {
                    const tx = data.transactions.find((t) => t.id === item.id);
                    if (tx) setActionTx(tx);
                  }}
                >
                  <Text style={{ color: theme.textMuted, fontSize: 18, fontWeight: '700' }}>⋯</Text>
                </Pressable>
              )}
            </View>
          }
          onPress={item.kind === 'tx' ? () => navigation.navigate('TransactionDetail', { id: item.id }) : item.kind === 'rec' ? () => setActionRec(item.rec) : undefined}
          verticalPadding="small"
        />
        {i < total - 1 && <Border type="full" />}
      </View>
    );
  }

  function renderRecRow(r: HouseholdRecurring, i: number, total: number) {
    const visual = resolveCategoryVisual(r.categoryId, r.category, data.categories);
    const isInc = r.type === 'INCOME';
    return (
      <View key={r.id}>
        <ListRow
          left={
            <View style={[styles.itemIcon, { backgroundColor: theme.bg }]}>
              <CategoryIcon icon={visual.icon} size={22} />
            </View>
          }
          contents={
            <View>
              <Text style={{ color: theme.text, fontSize: 14, fontWeight: '600' }}>{r.title}</Text>
              <Text style={{ color: theme.textMuted, fontSize: 11 }}>
                매월 {r.dayOfMonth}일{r.endDate ? ` · ~${r.endDate.slice(0, 7)}` : ''}
              </Text>
            </View>
          }
          right={
            <View style={styles.recRight}>
              <Text style={{ color: isInc ? theme.brand : theme.text, fontSize: 14, fontWeight: '700' }}>
                {isInc ? '+' : '-'}
                {krw(r.amount)}
              </Text>
              {!isViewer ? (
                <>
                  <Switch checked={r.active} onCheckedChange={() => toggleRecurring.mutate(Number(r.id))} disabled={toggleRecurring.isPending} />
                  <Pressable hitSlop={8} onPress={() => setActionRec(r)}>
                    <Text style={{ color: theme.textMuted, fontSize: 18, fontWeight: '700' }}>⋯</Text>
                  </Pressable>
                </>
              ) : (
                <View style={[styles.toggleChip, { backgroundColor: r.active ? theme.brand : theme.bg }]}>
                  <Text style={{ color: r.active ? '#fff' : theme.textMuted, fontSize: 11, fontWeight: '700' }}>{r.active ? '활성' : '중지'}</Text>
                </View>
              )}
            </View>
          }
          verticalPadding="small"
        />
        {i < total - 1 && <Border type="full" />}
      </View>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={[styles.root, { backgroundColor: theme.bg }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.brand} colors={[theme.brand]} />}
      >
        <View style={styles.monthNav}>
          <Pressable style={[styles.monthBtn, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => shiftMonth(-1)}>
            <Text style={{ color: theme.text, fontSize: 18 }}>‹</Text>
          </Pressable>
          <Text style={[styles.monthLabel, { color: theme.text }]}>{monthLabel}</Text>
          <Pressable style={[styles.monthBtn, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => shiftMonth(1)}>
            <Text style={{ color: theme.text, fontSize: 18 }}>›</Text>
          </Pressable>
        </View>

        <View style={styles.sectionPad}>
          <View style={[styles.summary, { backgroundColor: theme.brandSoft }]}>
            <View>
              <Text style={{ color: theme.textMuted, fontSize: 12 }}>수입</Text>
              <Text style={{ color: theme.brand, fontSize: 16, fontWeight: '800' }}>+{krw(monthIncome)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: theme.textMuted, fontSize: 12 }}>지출</Text>
              <Text style={{ color: theme.danger, fontSize: 16, fontWeight: '800' }}>-{krw(monthExpense)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionPad}>
          <Segmented options={['캘린더', '리스트']} value={viewMode === 'calendar' ? '캘린더' : '리스트'} onChange={(v) => setViewMode(v === '캘린더' ? 'calendar' : 'list')} small />
        </View>

        {viewMode === 'calendar' ? (
          <>
            <View style={[styles.calCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <WorkCalendar month={month} logs={calLogs} selectedDate={selectedDate} onSelectDay={handleSelectDay} />
            </View>

            {selectedDate && (
              <View style={styles.sectionPad}>
                <View style={styles.dayHeader}>
                  <Text style={[styles.dayTitle, { color: theme.text }]}>{selectedLabel}</Text>
                  {!isViewer && (
                    <Pressable onPress={openAddForDay}>
                      <Text style={{ color: theme.brand, fontSize: 13, fontWeight: '700' }}>+ 등록</Text>
                    </Pressable>
                  )}
                </View>
                {dayItems.length === 0 ? (
                  <EmptyState compact iconCode={TE.ledger} title="이 날 기록이 없어요" desc={isViewer ? undefined : '+ 등록으로 추가해보세요'} />
                ) : (
                  <View style={[styles.dayCard, { backgroundColor: theme.card, borderColor: theme.border }]}>{dayItems.map((it, i) => renderDayItem(it, i, dayItems.length))}</View>
                )}
              </View>
            )}
          </>
        ) : (
          <>
            <View style={styles.sectionPad}>
              <Segmented
                options={['전체', '수입', '지출']}
                value={typeFilter === 'all' ? '전체' : typeFilter === 'INCOME' ? '수입' : '지출'}
                onChange={(v) => handleTypeFilter(v === '전체' ? 'all' : v === '수입' ? 'INCOME' : 'EXPENSE')}
                small
                alignment="fluid"
              />
              {monthCats.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow} style={{ marginTop: 8 }}>
                  {monthCats.map((cat) => {
                    const active = catFilter.has(cat);
                    const def = getCategoryDef(cat);
                    return (
                      <Pressable
                        key={cat}
                        onPress={() => toggleCatFilter(cat)}
                        style={[styles.chip, { borderColor: active ? theme.brand : theme.border, backgroundColor: active ? theme.brandSoft : theme.card }]}
                      >
                        <View style={[styles.chipDot, { backgroundColor: def.color }]} />
                        <Text style={{ fontSize: 11.5, fontWeight: '700', color: active ? theme.brand : theme.textMuted }}>{cat}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              )}
            </View>

            {catBreakdown.length > 0 && (
              <View style={styles.sectionPad}>
                <View style={[styles.catCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <Text style={[styles.catCardTitle, { color: theme.text }]}>
                    {catBreakdownDrilled && catFilter.size === 1 ? `${[...catFilter][0]} 세부 지출` : '카테고리별 지출'}
                  </Text>
                  {catBreakdown.map(([cat, amt], i) => {
                    const def = getCategoryDef(cat);
                    const max = catBreakdown[0]![1];
                    return (
                      <View key={cat} style={[styles.catBarRow, i === catBreakdown.length - 1 && { marginBottom: 0 }]}>
                        <Text style={[styles.catBarName, { color: theme.textMuted }]} numberOfLines={1}>
                          {cat}
                        </Text>
                        <View style={[styles.catBarTrack, { backgroundColor: theme.bg }]}>
                          <View style={[styles.catBarFill, { width: `${(amt / max) * 100}%`, backgroundColor: def.color }]} />
                        </View>
                        <Text style={[styles.catBarAmt, { color: theme.textMuted }]}>{krw(amt)}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            <View style={styles.sectionPad}>
              {monthTx.length === 0 ? (
                <EmptyState compact iconCode={TE.ledger} title="이 달 거래가 없어요" desc={isViewer ? undefined : 'FAB로 추가해보세요'} />
              ) : groupedTx.length === 0 ? (
                <View style={{ alignItems: 'center' }}>
                  <EmptyState compact iconCode={TE.ledger} title="조건에 맞는 거래가 없어요" />
                  <Pressable onPress={resetFilters} style={[styles.resetBtn, { borderColor: theme.brand }]}>
                    <Text style={{ color: theme.brand, fontSize: 12, fontWeight: '700' }}>필터 초기화</Text>
                  </Pressable>
                </View>
              ) : (
                groupedTx.map(([date, txs]) => {
                  const dayExp = txs.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
                  return (
                    <View key={date} style={{ marginBottom: 12 }}>
                      <View style={styles.dayHeader}>
                        <Text style={{ color: theme.textMuted, fontSize: 12, fontWeight: '700' }}>
                          {Number(date.slice(5, 7))}월 {Number(date.slice(8, 10))}일
                        </Text>
                        {dayExp > 0 && <Text style={{ color: theme.textMuted, fontSize: 12 }}>-{krw(dayExp)}</Text>}
                      </View>
                      <View style={[styles.dayCard, { backgroundColor: theme.card, borderColor: theme.border }]}>{txs.map((t, i) => renderTxRow(t, i, txs.length))}</View>
                    </View>
                  );
                })
              )}
            </View>
          </>
        )}

        <View style={styles.sectionPad}>
          {!isViewer && missed.length > 0 && (
            <Pressable style={[styles.missedBanner, { backgroundColor: theme.danger + '14' }]} onPress={() => setMissedVisible(true)}>
              <TossEmoji code={TE.lightning} size={18} />
              <Text style={{ color: theme.danger, fontSize: 12.5, fontWeight: '700', flex: 1 }}>미반영 정기거래 {missed.length}건이 있어요</Text>
              <Text style={{ color: theme.danger, fontSize: 12, fontWeight: '700' }}>확인하기</Text>
            </Pressable>
          )}
          <Pressable style={[styles.recHeader, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => setRecOpen((v) => !v)}>
            <View>
              <Text style={{ color: theme.text, fontSize: 14, fontWeight: '700' }}>정기 항목 관리</Text>
              <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 2 }}>
                수입 +{krw(totalRecIncome)} · 지출 -{krw(totalRecExpense)}
              </Text>
            </View>
            <Text style={{ color: theme.textMuted }}>{recOpen ? '▴' : '▾'}</Text>
          </Pressable>

          {recOpen && (
            <View style={{ marginTop: 8 }}>
              {recurring.length === 0 ? (
                <EmptyState compact iconCode={TE.repeat} title="등록된 정기 항목이 없어요" desc={isViewer ? undefined : '아래 버튼으로 추가해보세요'} />
              ) : (
                <>
                  {incomeRec.length > 0 && (
                    <>
                      <Text style={styles.recSectionTitle}>정기수입</Text>
                      <View style={[styles.dayCard, { backgroundColor: theme.card, borderColor: theme.border }]}>{incomeRec.map((r, i) => renderRecRow(r, i, incomeRec.length))}</View>
                    </>
                  )}
                  {expenseRec.length > 0 && (
                    <>
                      <Text style={[styles.recSectionTitle, { color: theme.textMuted }]}>정기지출</Text>
                      <View style={[styles.dayCard, { backgroundColor: theme.card, borderColor: theme.border }]}>{expenseRec.map((r, i) => renderRecRow(r, i, expenseRec.length))}</View>
                    </>
                  )}
                </>
              )}
              {!isViewer && (
                <Pressable style={[styles.recAddBtn, { borderColor: theme.brand }]} onPress={() => setAddRecVisible(true)}>
                  <Text style={{ color: theme.brand, fontSize: 13, fontWeight: '700' }}>+ 정기 항목 추가</Text>
                </Pressable>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {!isViewer && (
        <Pressable style={[styles.fab, { backgroundColor: theme.brand }]} onPress={openAddForDay}>
          {Icon.plus('#fff')}
        </Pressable>
      )}

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
        onClose={() => {
          setAddTxVisible(false);
          setEditTx(null);
        }}
        onSaved={(mode) => setToast(mode === 'edit' ? '거래를 수정했어요' : '거래를 저장했어요')}
      />
      <AddRecurringSheet
        visible={addRecVisible}
        editRec={editRec ?? undefined}
        onClose={() => {
          setAddRecVisible(false);
          setEditRec(null);
        }}
        onSaved={(mode) => setToast(mode === 'edit' ? '정기 항목을 수정했어요' : '정기 항목을 저장했어요')}
      />
      <MissedRecurringSheet visible={missedVisible} onClose={() => setMissedVisible(false)} onApplied={(count) => setToast(`누락된 정기거래 ${count}건을 반영했어요`)} />

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
      <ConfirmDialog visible={!!deleteTxState} title="거래를 삭제할까요?" confirmText="삭제하기" danger loading={deleteTx.isPending} onConfirm={confirmDeleteTx} onClose={() => setDeleteTxState(null)} />

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingBottom: 100 },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, paddingTop: 12 },
  monthBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  monthLabel: { fontSize: 15, fontWeight: '700', minWidth: 90, textAlign: 'center' },
  sectionPad: { paddingHorizontal: 20, paddingTop: 16 },
  summary: { flexDirection: 'row', justifyContent: 'space-between', borderRadius: 14, padding: 16 },
  calCard: { marginHorizontal: 20, marginTop: 16, borderRadius: 16, borderWidth: 1 },
  dayHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  dayTitle: { fontSize: 14, fontWeight: '700' },
  dayCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  itemIcon: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  itemTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tagChip: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  recRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  toggleChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  missedBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, padding: 12, marginBottom: 12 },
  recHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 14, borderWidth: 1, padding: 14 },
  recSectionTitle: { fontSize: 12, fontWeight: '700', marginTop: 12, marginBottom: 8, color: '#8B95A1' },
  recAddBtn: { borderWidth: 1.4, borderRadius: 12, alignItems: 'center', paddingVertical: 12, marginTop: 12 },
  fab: { position: 'absolute', bottom: 20, right: 20, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  chipRow: { flexDirection: 'row', gap: 6 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  chipDot: { width: 6, height: 6, borderRadius: 3 },
  catCard: { borderRadius: 14, borderWidth: 1, padding: 14 },
  catCardTitle: { fontSize: 12.5, fontWeight: '700', marginBottom: 10 },
  catBarRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 7 },
  catBarName: { fontSize: 11, width: 46 },
  catBarTrack: { flex: 1, height: 7, borderRadius: 4, overflow: 'hidden' },
  catBarFill: { height: '100%', borderRadius: 4 },
  catBarAmt: { fontSize: 10.5, minWidth: 58, textAlign: 'right' },
  resetBtn: { marginTop: 4, borderWidth: 1.4, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 },
});
