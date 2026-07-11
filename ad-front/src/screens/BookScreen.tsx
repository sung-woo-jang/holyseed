import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Border from '../components/ui/Border';
import ListRow from '../components/ui/ListRow';
import Switch from '../components/ui/Switch';
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
import MissedRecurringSheet from '../components/sheets/MissedRecurringSheet';
import { recurringApi } from '../api';
import { qk } from '../queries/keys';
import EmptyState from '../components/common/EmptyState';
import ActionSheet from '../components/common/ActionSheet';
import ConfirmDialog from '../components/common/ConfirmDialog';
import AppToast from '../components/common/AppToast';
import { useToggleRecurring, useDeleteRecurring, useDeleteTx } from '../queries/mutations';
import type { MockRecurring, MockTransaction } from '../lib/mock-data';
import { todayLocal } from '../lib/date';
import styles from './BookScreen.module.css';

function todayMonth(): string {
  return todayLocal().slice(0, 7);
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
  const role = useMockRole();
  const data = useDataSource();
  const { useMock, currentHousehold } = useAuthStore();
  const isViewer = role === 'VIEWER';
  const hid = currentHousehold?.id;

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
  const [missedVisible, setMissedVisible] = useState(false);
  const [toast, setToast] = useState('');

  // 누락 정기거래 (cron 미실행 등으로 미생성된 회차)
  const { data: missed = [] } = useQuery({
    queryKey: qk.recurringMissed(hid!),
    queryFn: () => recurringApi.missed(hid!),
    enabled: !useMock && !!hid,
  });

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (!selectedDate) setSelectedDate(todayLocal());
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
          left={<div className={styles.itemIcon} style={{ backgroundColor: theme.bg }}><TossEmoji code={def.iconCode} size={18} /></div>}
          contents={
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <span className={styles.itemTitle} style={{ color: theme.text }}>{tx.title}</span>
              <span className={styles.itemSub} style={{ color: theme.textMuted }}>
                {tx.category}{from ? ` · ${from.name}` : ''}
              </span>
            </div>
          }
          right={
            <div className={styles.recRight}>
              <span className={styles.itemAmount} style={{ color: isInc ? theme.brand : theme.text }}>
                {isInc ? '+' : '-'}{krwShort(tx.amount)}원
              </span>
              {canEdit && (
                <button type="button" className={styles.kebabBtn} onClick={(e) => { e.stopPropagation(); setActionTx(tx); }}>
                  <span className={styles.kebab} style={{ color: theme.textMuted }}>⋯</span>
                </button>
              )}
            </div>
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
      <div className={styles.recRight}>
        <span className={styles.itemAmount} style={{ color: isInc ? theme.brand : theme.text }}>
          {isInc ? '+' : '-'}{krwShort(item.amount)}원
        </span>
        {canEditTx && (
          <button
            type="button"
            className={styles.kebabBtn}
            onClick={(e) => { e.stopPropagation(); const tx = data.transactions.find((t) => t.id === item.id); if (tx) setActionTx(tx); }}
          >
            <span className={styles.kebab} style={{ color: theme.textMuted }}>⋯</span>
          </button>
        )}
      </div>
    );
    return (
      <React.Fragment key={`${item.kind}-${item.id}`}>
        <ListRow
          left={<div className={styles.itemIcon} style={{ backgroundColor: theme.bg }}><TossEmoji code={def.iconCode} size={18} /></div>}
          contents={
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <div className={styles.itemTitleRow}>
                <span className={styles.itemTitle} style={{ color: theme.text }}>{item.title}</span>
                {item.kind === 'rec' && <span className={styles.tagChip} style={{ backgroundColor: theme.brandSoft, color: theme.brand }}>정기</span>}
              </div>
              {item.kind === 'tx' && item.sub ? <span className={styles.itemSub} style={{ color: theme.textMuted }}>{item.sub}</span> : null}
            </div>
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
          left={<div className={styles.itemIcon} style={{ backgroundColor: theme.bg }}><TossEmoji code={def.iconCode} size={22} /></div>}
          contents={
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <span className={styles.itemTitle} style={{ color: theme.text }}>{r.title}</span>
              <span className={styles.itemSub} style={{ color: theme.textMuted }}>매월 {r.dayOfMonth}일{r.endDate ? ` · ~${r.endDate.slice(0, 7)}` : ''}</span>
            </div>
          }
          right={
            <div className={styles.recRight}>
              <span className={styles.itemAmount} style={{ color: isInc ? theme.brand : theme.text }}>
                {isInc ? '+' : '-'}{krwShort(r.amount)}원
              </span>
              {!isViewer ? (
                <>
                  <Switch checked={r.active} onCheckedChange={() => toggleRecurring.mutate(Number(r.id))} disabled={toggleRecurring.isPending} />
                  <button type="button" className={styles.kebabBtn} onClick={(e) => { e.stopPropagation(); setActionRec(r); }}>
                    <span className={styles.kebab} style={{ color: theme.textMuted }}>⋯</span>
                  </button>
                </>
              ) : (
                <span className={styles.toggleChip} style={{ backgroundColor: r.active ? theme.brand : theme.bg, color: r.active ? '#fff' : theme.textMuted }}>
                  {r.active ? '활성' : '중지'}
                </span>
              )}
            </div>
          }
          verticalPadding="small"
        />
        {i < total - 1 && <Border type="full" />}
      </React.Fragment>
    );
  }

  return (
    <div className={styles.root} style={{ backgroundColor: theme.bg }}>
      <div className={styles.scroll}>
        {/* 월 네비 */}
        <div className={styles.monthNav}>
          <button type="button" className={styles.monthBtn} style={{ backgroundColor: theme.card, borderColor: theme.border }} onClick={() => shiftMonth(-1)}>
            <span className={styles.monthArrow} style={{ color: theme.text }}>‹</span>
          </button>
          <span className={styles.monthLabel} style={{ color: theme.text }}>{monthLabel}</span>
          <button type="button" className={styles.monthBtn} style={{ backgroundColor: theme.card, borderColor: theme.border }} onClick={() => shiftMonth(1)}>
            <span className={styles.monthArrow} style={{ color: theme.text }}>›</span>
          </button>
        </div>

        {/* 요약 */}
        <div className={styles.sectionPad}>
          <div className={styles.summary} style={{ backgroundColor: theme.brandSoft }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span className={styles.summaryLabel} style={{ color: theme.textMuted }}>수입</span>
              <span className={styles.summaryValue} style={{ color: theme.brand }}>+{krwShort(monthIncome)}원</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span className={styles.summaryLabel} style={{ color: theme.textMuted }}>지출</span>
              <span className={styles.summaryValue} style={{ color: theme.danger }}>-{krwShort(monthExpense)}원</span>
            </div>
          </div>
        </div>

        {/* 뷰 토글 */}
        <div className={styles.sectionPad}>
          <Segmented
            options={['캘린더', '리스트']}
            value={viewMode === 'calendar' ? '캘린더' : '리스트'}
            onChange={(v) => setViewMode(v === '캘린더' ? 'calendar' : 'list')}
            small
          />
        </div>

        {viewMode === 'calendar' ? (
          <>
            {/* 캘린더 */}
            <div className={styles.calCard} style={{ backgroundColor: theme.card, borderColor: theme.border }}>
              <WorkCalendar month={month} logs={calLogs} selectedDate={selectedDate} onSelectDay={handleSelectDay} />
            </div>

            {/* 선택일 항목 */}
            {selectedDate && (
              <div className={styles.sectionPad}>
                <div className={styles.dayHeader}>
                  <span className={styles.dayTitle} style={{ color: theme.text }}>{selectedLabel}</span>
                  {!isViewer && (
                    <button type="button" onClick={openAddForDay}>
                      <span className={styles.addLink} style={{ color: theme.brand }}>+ 등록</span>
                    </button>
                  )}
                </div>
                {dayItems.length === 0 ? (
                  <EmptyState compact iconCode={TE.ledger} title="이 날 기록이 없어요" desc={isViewer ? undefined : '+ 등록으로 추가해보세요'} />
                ) : (
                  <div className={styles.dayCard} style={{ backgroundColor: theme.card, borderColor: theme.border }}>
                    {dayItems.map((it, i) => renderDayItem(it, i, dayItems.length))}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            {/* 카테고리별 지출 통계 */}
            {catBreakdown.length > 0 && (
              <div className={styles.sectionPad}>
                <div className={styles.dayCard} style={{ backgroundColor: theme.card, borderColor: theme.border, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <span className={styles.statTitle} style={{ color: theme.text }}>카테고리별 지출</span>
                  {catBreakdown.map((c) => {
                    const pctW = monthExpense > 0 ? Math.round((c.value / monthExpense) * 100) : 0;
                    return (
                      <div key={c.name} className={styles.statRow}>
                        <div className={styles.statRowTop}>
                          <span className={styles.statName} style={{ color: theme.text }}>{c.name}</span>
                          <span className={styles.statAmount} style={{ color: theme.textMuted }}>{krwShort(c.value)}원 · {pctW}%</span>
                        </div>
                        <div className={styles.statBarBg} style={{ backgroundColor: theme.bg }}>
                          <div className={styles.statBarFill} style={{ backgroundColor: c.color, width: `${pctW}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 일별 거래 리스트 */}
            <div className={styles.sectionPad}>
              {groupedTx.length === 0 ? (
                <EmptyState compact iconCode={TE.ledger} title="이 달 거래가 없어요" desc={isViewer ? undefined : 'FAB로 추가해보세요'} />
              ) : (
                groupedTx.map(([date, txs]) => {
                  const dayExp = txs.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
                  return (
                    <div key={date} style={{ marginBottom: 12 }}>
                      <div className={styles.dayHeader}>
                        <span className={styles.listDayTitle} style={{ color: theme.textMuted }}>
                          {Number(date.slice(5, 7))}월 {Number(date.slice(8, 10))}일
                        </span>
                        {dayExp > 0 && <span className={styles.listDayExp} style={{ color: theme.textMuted }}>-{krwShort(dayExp)}원</span>}
                      </div>
                      <div className={styles.dayCard} style={{ backgroundColor: theme.card, borderColor: theme.border }}>
                        {txs.map((t, i) => renderTxRow(t, i, txs.length))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* 정기 항목 관리 (접이식) */}
        <div className={styles.sectionPad}>
          {!isViewer && missed.length > 0 && (
            <button
              type="button"
              className={styles.missedBanner}
              style={{ backgroundColor: theme.danger + '14' }}
              onClick={() => setMissedVisible(true)}
            >
              <TossEmoji code={TE.lightning} size={18} />
              <span className={styles.missedBannerText} style={{ color: theme.danger }}>
                미반영 정기거래 {missed.length}건이 있어요
              </span>
              <span className={styles.missedBannerAction} style={{ color: theme.danger }}>확인하기</span>
            </button>
          )}
          <button
            type="button"
            className={styles.recHeader}
            style={{ backgroundColor: theme.card, borderColor: theme.border }}
            onClick={() => setRecOpen((v) => !v)}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span className={styles.recHeaderTitle} style={{ color: theme.text }}>정기 항목 관리</span>
              <span className={styles.recHeaderSub} style={{ color: theme.textMuted }}>
                수입 +{krwShort(totalRecIncome)} · 지출 -{krwShort(totalRecExpense)}
              </span>
            </div>
            <span className={styles.recChevron} style={{ color: theme.textMuted }}>{recOpen ? '▴' : '▾'}</span>
          </button>

          {recOpen && (
            <div className={styles.recBody}>
              {recurring.length === 0 ? (
                <EmptyState compact iconCode={TE.repeat} title="등록된 정기 항목이 없어요" desc={isViewer ? undefined : '아래 버튼으로 추가해보세요'} />
              ) : (
                <>
                  {incomeRec.length > 0 && (
                    <>
                      <span className={styles.recSectionTitle} style={{ color: theme.textMuted }}>정기수입</span>
                      <div className={styles.dayCard} style={{ backgroundColor: theme.card, borderColor: theme.border }}>
                        {incomeRec.map((r, i) => renderRecRow(r, i, incomeRec.length))}
                      </div>
                    </>
                  )}
                  {expenseRec.length > 0 && (
                    <>
                      <span className={styles.recSectionTitle} style={{ color: theme.textMuted }}>정기지출</span>
                      <div className={styles.dayCard} style={{ backgroundColor: theme.card, borderColor: theme.border }}>
                        {expenseRec.map((r, i) => renderRecRow(r, i, expenseRec.length))}
                      </div>
                    </>
                  )}
                </>
              )}
              {!isViewer && (
                <button type="button" className={styles.recAddBtn} style={{ borderColor: theme.brand }} onClick={() => setAddRecVisible(true)}>
                  <span className={styles.recAddText} style={{ color: theme.brand }}>+ 정기 항목 추가</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* FAB */}
      {!isViewer && (
        <button type="button" className={styles.fab} style={{ backgroundColor: theme.brand }} onClick={openAddForDay}>
          {Icon.plus('#fff')}
        </button>
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
        onSaved={(mode) => setToast(mode === 'edit' ? '거래를 수정했어요' : '거래를 저장했어요')}
      />
      <AddRecurringSheet
        visible={addRecVisible}
        editRec={editRec ?? undefined}
        onClose={() => { setAddRecVisible(false); setEditRec(null); }}
        onSaved={(mode) => setToast(mode === 'edit' ? '정기 항목을 수정했어요' : '정기 항목을 저장했어요')}
      />
      <MissedRecurringSheet
        visible={missedVisible}
        onClose={() => setMissedVisible(false)}
        onApplied={(count) => setToast(`누락된 정기거래 ${count}건을 반영했어요`)}
      />

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
    </div>
  );
}
