import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Badge, Border, ListRow } from '@toss/tds-react-native';
import { useTheme } from '../lib/theme';
import { useDataSource, useMockRole } from '../lib/data-source';
import { useAuthStore } from '../stores/auth.store';
import { workLogsApi } from '../api';
import { qk } from '../queries/keys';
import { krw, krwShort } from '../lib/format';
import { Icon } from '../components/common/Icon';
import WorkCalendar from '../components/WorkCalendar';
import LogWorkSheet from '../components/sheets/LogWorkSheet';
import ActionSheet from '../components/common/ActionSheet';
import ConfirmDialog from '../components/common/ConfirmDialog';
import AppToast from '../components/common/AppToast';
import EmptyState from '../components/common/EmptyState';
import { TE } from '../lib/toss-emoji';
import { useSettleWorkLog, useDeleteWorkLog } from '../queries/mutations';
import type { WorkLog } from '../types/api';
import type { MockWorkLog } from '../lib/mock-data';

function todayMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function todayDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** MockWorkLog → WorkLog 형태로 정규화 */
function normalizeMock(w: MockWorkLog): WorkLog {
  return {
    id: Number(w.id.replace(/\D/g, '')) || 0,
    householdId: 0,
    date: w.date,
    title: w.title,
    amount: w.amount,
    colorLabel: w.colorLabel ?? null,
    settled: w.settled,
    settledTransactionId: null,
    workMinutes: w.workMinutes ?? null,
    hourlyRate: w.hourlyRate ?? null,
    toAssetId: null,
    categoryId: null,
    memo: w.memo ?? null,
  };
}

export default function WorkScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const role = useMockRole();
  const data = useDataSource();
  const { currentHousehold, useMock } = useAuthStore();
  const hid = currentHousehold?.id;
  const isViewer = role === 'VIEWER';

  // mock 모드면 mock 데이터가 있는 월로 시작 (없으면 이번 달)
  const initialMonth = useMock && data.workLogs[0]?.date
    ? data.workLogs[0].date.slice(0, 7)
    : todayMonth();
  const [month, setMonth] = useState(initialMonth);
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  const [logSheetOpen, setLogSheetOpen] = useState(false);
  const [editLog, setEditLog] = useState<WorkLog | null>(null);
  const [actionLog, setActionLog] = useState<WorkLog | null>(null);
  const [deleteLog, setDeleteLog] = useState<WorkLog | null>(null);
  const [toast, setToast] = useState('');

  const settleWorkLog = useSettleWorkLog(month);
  const deleteWorkLog = useDeleteWorkLog(month);

  const workQ = useQuery({
    queryKey: qk.workLogs(hid ?? 0, month),
    queryFn: () => workLogsApi.list(hid!, month),
    enabled: !!hid && !useMock,
    staleTime: 30_000,
  });

  // mock이면 persona에서 월필터, 아니면 쿼리 결과
  const logs: WorkLog[] = useMock
    ? data.workLogs.filter((w) => w.date.startsWith(month)).map(normalizeMock)
    : (Array.isArray(workQ.data) ? workQ.data : []);

  const presets = useMemo(() => [...new Set(logs.map((l) => l.title))], [logs]);

  // 월 네비
  function shiftMonth(delta: number) {
    const parts = month.split('-').map(Number);
    const y = parts[0] ?? new Date().getFullYear();
    const mo = parts[1] ?? 1;
    const d = new Date(y, (mo - 1) + delta, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    setSelectedDate(undefined);
  }
  const monthLabel = `${Number(month.slice(5))}월 (${month.slice(0, 4)})`;

  // 요약
  const workedDays = new Set(logs.map((l) => l.date)).size;
  const paidTotal = logs.filter((l) => l.settled).reduce((s, l) => s + Number(l.amount), 0);
  const unpaidTotal = logs.filter((l) => !l.settled).reduce((s, l) => s + Number(l.amount), 0);

  const dayLogs = selectedDate ? logs.filter((l) => l.date === selectedDate) : [];

  function handleSelectDay(date: string) {
    setSelectedDate(date);
  }
  function handleAddForDay() {
    if (!selectedDate) {
      setSelectedDate(todayDate());
    }
    setEditLog(null);
    setLogSheetOpen(true);
  }
  function handleAction(value: string) {
    const l = actionLog;
    setActionLog(null);
    if (!l) return;
    if (value === 'edit') { setEditLog(l); setLogSheetOpen(true); }
    else if (value === 'settle') {
      settleWorkLog.mutate({ id: l.id }, { onSuccess: () => setToast('수령 처리했어요') });
    }
    else if (value === 'delete') setDeleteLog(l);
  }
  async function confirmDelete() {
    if (!deleteLog) return;
    try {
      await deleteWorkLog.mutateAsync(deleteLog.id);
      setToast('근무 기록을 삭제했어요');
    } catch {
      setToast('삭제에 실패했어요');
    } finally {
      setDeleteLog(null);
    }
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

        {/* 요약 카드 */}
        <View style={styles.sectionPad}>
          <View style={[styles.summary, { backgroundColor: theme.brandSoft }]}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>근무일</Text>
              <Text style={[styles.summaryValue, { color: theme.text }]}>{workedDays}일</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>수령</Text>
              <Text style={[styles.summaryValue, { color: theme.brand }]}>+{krwShort(paidTotal)}원</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>미수금</Text>
              <Text style={[styles.summaryValue, { color: theme.danger }]}>{krwShort(unpaidTotal)}원</Text>
            </View>
          </View>
        </View>

        {/* 캘린더 */}
        <View style={[styles.calCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <WorkCalendar month={month} logs={logs} selectedDate={selectedDate} onSelectDay={handleSelectDay} />
        </View>

        {/* 선택일 항목 */}
        {selectedDate && (
          <View style={styles.sectionPad}>
            <Text style={[styles.dayTitle, { color: theme.text }]}>{selectedDate.slice(5).replace('-', '월 ')}일</Text>
            {dayLogs.length === 0 ? (
              <EmptyState compact iconCode={TE.ledger} title="이 날 근무 기록이 없어요" desc={isViewer ? undefined : '아래 + 버튼으로 추가해보세요'} />
            ) : (
              dayLogs.map((l, i) => (
                <React.Fragment key={l.id}>
                  <ListRow
                    left={<View style={[styles.colorDot, { backgroundColor: l.colorLabel || theme.brand }]} />}
                    contents={
                      <View>
                        <Text style={[styles.logTitle, { color: theme.text }]}>{l.title}</Text>
                        {l.memo ? <Text style={[styles.logMeta, { color: theme.textMuted }]}>{l.memo}</Text> : null}
                      </View>
                    }
                    right={
                      <View style={styles.logRight}>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={[styles.logAmount, { color: theme.text }]}>{krw(Number(l.amount))}</Text>
                          <Badge type={l.settled ? 'blue' : 'yellow'} badgeStyle="weak" size="tiny">
                            {l.settled ? '수령' : '미수금'}
                          </Badge>
                        </View>
                        {!isViewer && (
                          <TouchableOpacity onPress={() => setActionLog(l)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <Text style={[styles.kebab, { color: theme.textMuted }]}>⋯</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    }
                    verticalPadding="small"
                  />
                  {i < dayLogs.length - 1 && <Border type="full" />}
                </React.Fragment>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      {!isViewer && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.brand, bottom: insets.bottom + 16 }]}
          onPress={handleAddForDay}
        >
          {Icon.plus('#fff')}
        </TouchableOpacity>
      )}

      <LogWorkSheet
        visible={logSheetOpen}
        date={selectedDate ?? todayDate()}
        month={month}
        existing={editLog}
        presets={presets}
        onClose={() => { setLogSheetOpen(false); setEditLog(null); }}
        onSaved={() => setToast(editLog ? '근무 기록을 수정했어요' : '근무 기록을 추가했어요')}
      />

      <ActionSheet
        visible={!!actionLog}
        title={actionLog?.title}
        items={[
          ...(actionLog && !actionLog.settled ? [{ iconCode: TE.check, label: '수령 처리', value: 'settle' }] : []),
          { iconCode: TE.pencil, label: '수정', value: 'edit' },
          { iconCode: TE.trash, label: '삭제', value: 'delete', danger: true },
        ]}
        onSelect={handleAction}
        onClose={() => setActionLog(null)}
      />
      <ConfirmDialog
        visible={!!deleteLog}
        title="근무 기록을 삭제할까요?"
        description={deleteLog?.settled ? '수령 처리된 수입 거래도 함께 삭제돼요.' : undefined}
        confirmText="삭제하기"
        danger
        loading={deleteWorkLog.isPending}
        onConfirm={confirmDelete}
        onClose={() => setDeleteLog(null)}
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
  summary: { padding: 16, borderRadius: 14, gap: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 13 },
  summaryValue: { fontSize: 16, fontWeight: '700' },
  calCard: { marginHorizontal: 20, marginBottom: 12, borderRadius: 14, borderWidth: 1, paddingVertical: 12 },
  dayTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  colorDot: { width: 12, height: 12, borderRadius: 6 },
  logTitle: { fontSize: 14, fontWeight: '600' },
  logMeta: { fontSize: 11, marginTop: 2 },
  logRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logAmount: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  kebab: { fontSize: 20, fontWeight: '700' },
  fab: { position: 'absolute', right: 20, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: '#3182F6', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
});
