import { useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import ListRow from '../../../components/ui/ListRow';
import Border from '../../../components/ui/Border';
import Loader from '../../../components/ui/Loader';
import EmptyState from '../../../components/common/EmptyState';
import AppToast from '../../../components/common/AppToast';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import Segmented from '../../../components/common/Segmented';
import WorklogEntryForm from './WorklogEntryForm';
import WorklogCategorySheet from './WorklogCategorySheet';
import { labWorklogApi, type WorklogRecord } from '../../../api/lab-worklog';
import { getWorklogSortPref, setWorklogSortPref } from '../../../lib/lab-prefs';
import { useTheme } from '../../../lib/theme';
import { krw } from '../../../lib/format';
import { toLocalDateString, todayLocal } from '../../../lib/date';
import { TE } from '../../../lib/toss-emoji';
import type { WorklogStackParamList } from '../../../navigation/WorklogStack';

type Props = NativeStackScreenProps<WorklogStackParamList, 'WorklogHome'>;

const PAY_STATUS_LABEL: Record<WorklogRecord['payStatus'], string> = {
  RECEIVED: '수령완료',
  EXPECTED: '수령예정',
  UNPAID: '미수령',
  DAYOFF: '휴무',
};

const SORT_OPTIONS: { key: string; label: string }[] = [
  { key: 'workDate', label: '날짜' },
  { key: 'amount', label: '금액' },
  { key: 'title', label: '현장명' },
  { key: 'category', label: '분류' },
];

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function sortRecords(records: WorklogRecord[], key: string, dir: 'asc' | 'desc'): WorklogRecord[] {
  const sorted = [...records].sort((a, b) => {
    let cmp = 0;
    if (key === 'amount') cmp = a.effectiveAmount - b.effectiveAmount;
    else if (key === 'title') cmp = a.title.localeCompare(b.title, 'ko');
    else if (key === 'category') cmp = a.category.localeCompare(b.category, 'ko');
    else cmp = a.workDate < b.workDate ? -1 : a.workDate > b.workDate ? 1 : 0;
    return dir === 'asc' ? cmp : -cmp;
  });
  return sorted;
}

export default function LabWorklogScreen({ navigation }: Props) {
  const theme = useTheme();
  const [ym, setYm] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  });
  const [formVisible, setFormVisible] = useState(false);
  const [editRecord, setEditRecord] = useState<WorklogRecord | null>(null);
  const [categorySheetVisible, setCategorySheetVisible] = useState(false);
  const [toast, setToast] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [view, setView] = useState<'목록' | '캘린더'>('목록');
  const [calendarSelectedDate, setCalendarSelectedDate] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState('workDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  useEffect(() => {
    getWorklogSortPref().then((pref) => {
      if (pref) {
        setSortKey(pref.key);
        setSortDir(pref.dir);
      }
    });
  }, []);

  const worklogQ = useQuery({
    queryKey: ['lab-worklog', ym.year, ym.month],
    queryFn: () => labWorklogApi.search(ym.year, ym.month),
  });

  const categoriesQ = useQuery({
    queryKey: ['lab-worklog-categories'],
    queryFn: () => labWorklogApi.categoryOptions(),
    staleTime: 300_000,
  });

  async function onRefresh() {
    setRefreshing(true);
    try {
      await Promise.all([worklogQ.refetch(), categoriesQ.refetch()]);
    } finally {
      setRefreshing(false);
    }
  }

  function changeMonth(delta: number) {
    setYm((prev) => {
      const d = new Date(prev.year, prev.month - 1 + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() + 1 };
    });
    setCalendarSelectedDate(null);
  }

  function changeSort(key: string) {
    setSortKey(key);
    setWorklogSortPref({ key, dir: sortDir });
  }

  function changeSortDir() {
    const next = sortDir === 'asc' ? 'desc' : 'asc';
    setSortDir(next);
    setWorklogSortPref({ key: sortKey, dir: next });
  }

  const records = worklogQ.data?.records ?? [];
  const summary = worklogQ.data?.summary;
  const categories = categoriesQ.data ?? [];
  const sortedRecords = sortRecords(records, sortKey, sortDir);
  const recordsByDate = new Map<string, WorklogRecord[]>();
  records.forEach((r) => {
    const list = recordsByDate.get(r.workDate) ?? [];
    list.push(r);
    recordsByDate.set(r.workDate, list);
  });

  function openAdd() {
    setEditRecord(null);
    setFormVisible(true);
  }

  function openEdit(record: WorklogRecord) {
    if (selectMode) {
      toggleSelect(record.id);
      return;
    }
    setEditRecord(record);
    setFormVisible(true);
  }

  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectMode() {
    setSelectMode((prev) => !prev);
    setSelectedIds(new Set());
  }

  const selectedTotal = records.filter((r) => selectedIds.has(r.id)).reduce((sum, r) => sum + r.effectiveAmount, 0);

  async function handleBulkDelete() {
    setBulkDeleting(true);
    try {
      await Promise.all(Array.from(selectedIds).map((id) => labWorklogApi.delete(id)));
      setToast(`${selectedIds.size}건을 삭제했어요`);
      setSelectedIds(new Set());
      setSelectMode(false);
      worklogQ.refetch();
    } catch {
      setToast('일부 삭제에 실패했어요');
    } finally {
      setBulkDeleteConfirm(false);
      setBulkDeleting(false);
    }
  }

  function renderRecordRow(r: WorklogRecord, isLast: boolean) {
    const checked = selectedIds.has(r.id);
    return (
      <View key={r.id}>
        <ListRow
          left={
            selectMode ? (
              <View style={[styles.checkCircle, { borderColor: checked ? theme.brand : theme.border, backgroundColor: checked ? theme.brand : 'transparent' }]}>
                {checked && <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>✓</Text>}
              </View>
            ) : (
              <View style={[styles.dateBox, { backgroundColor: theme.bg }]}>
                <Text style={{ color: theme.textMuted, fontSize: 10, fontWeight: '700' }}>{Number(r.workDate.slice(5, 7))}월</Text>
                <Text style={{ color: theme.text, fontSize: 15, fontWeight: '800' }}>{Number(r.workDate.slice(8, 10))}</Text>
              </View>
            )
          }
          contents={
            <View>
              <Text style={{ color: theme.text, fontSize: 14, fontWeight: '600' }}>{r.title}</Text>
              <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 2 }}>
                {r.category} · {PAY_STATUS_LABEL[r.payStatus]}
                {r.halfPay ? ' · 반액' : ''}
              </Text>
            </View>
          }
          right={<Text style={{ color: theme.text, fontSize: 14, fontWeight: '700' }}>{krw(r.effectiveAmount)}</Text>}
          onPress={() => openEdit(r)}
          verticalPadding="small"
        />
        {!isLast && <Border type="full" />}
      </View>
    );
  }

  const daysInMonth = new Date(ym.year, ym.month, 0).getDate();
  const firstWeekday = new Date(ym.year, ym.month - 1, 1).getDay();
  const cells: (number | null)[] = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);
  const today = todayLocal();
  const selectedDayRecords = calendarSelectedDate ? recordsByDate.get(calendarSelectedDate) ?? [] : [];

  return (
    <SafeAreaView edges={['top']} style={[styles.root, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <Pressable hitSlop={10} onPress={() => changeMonth(-1)} style={styles.navBtn}>
          <Text style={{ color: theme.text, fontSize: 20 }}>‹</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {ym.year}년 {ym.month}월
        </Text>
        <Pressable hitSlop={10} onPress={() => changeMonth(1)} style={styles.navBtn}>
          <Text style={{ color: theme.text, fontSize: 20 }}>›</Text>
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable style={[styles.addBtn, { backgroundColor: theme.brand }]} onPress={openAdd}>
          <Text style={styles.addBtnText}>+ 추가</Text>
        </Pressable>
      </View>

      <View style={styles.toolRow}>
        <Segmented options={['목록', '캘린더']} value={view} onChange={(v) => setView(v as '목록' | '캘린더')} small />
        <View style={{ flex: 1 }} />
        <Pressable style={[styles.toolChip, { borderColor: theme.border }]} onPress={() => setCategorySheetVisible(true)}>
          <Text style={{ color: theme.text, fontSize: 12, fontWeight: '700' }}>관리</Text>
        </Pressable>
        <Pressable style={[styles.toolChip, { borderColor: theme.brand }]} onPress={() => navigation.navigate('WorklogSettlement')}>
          <Text style={{ color: theme.brand, fontSize: 12, fontWeight: '700' }}>정산</Text>
        </Pressable>
        <Pressable style={[styles.toolChip, { borderColor: selectMode ? theme.brand : theme.border }]} onPress={toggleSelectMode}>
          <Text style={{ color: selectMode ? theme.brand : theme.text, fontSize: 12, fontWeight: '700' }}>{selectMode ? '선택 취소' : '선택'}</Text>
        </Pressable>
      </View>

      {view === '목록' && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortRow}>
          <View style={styles.chipRow}>
            {SORT_OPTIONS.map((o) => {
              const active = o.key === sortKey;
              return (
                <Pressable
                  key={o.key}
                  onPress={() => changeSort(o.key)}
                  style={[styles.chip, { borderColor: active ? theme.brand : theme.border, backgroundColor: active ? theme.brandSoft : theme.card }]}
                >
                  <Text style={{ fontSize: 12, lineHeight: 16, fontWeight: '700', color: active ? theme.brand : theme.text }}>{o.label}</Text>
                </Pressable>
              );
            })}
            <Pressable onPress={changeSortDir} style={[styles.chip, { borderColor: theme.border, backgroundColor: theme.card }]}>
              <Text style={{ fontSize: 12, lineHeight: 16, fontWeight: '700', color: theme.text }}>{sortDir === 'asc' ? '오름차순 ↑' : '내림차순 ↓'}</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}

      {worklogQ.isLoading ? (
        <View style={styles.center}>
          <Loader size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: selectMode && selectedIds.size > 0 ? 90 : 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.brand} colors={[theme.brand]} />}
        >
          {summary && (
            <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={{ color: theme.textMuted, fontSize: 12 }}>근무일수</Text>
                  <Text style={{ color: theme.text, fontSize: 15, fontWeight: '800' }}>{summary.workDays}일</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={{ color: theme.textMuted, fontSize: 12 }}>실수령 합계</Text>
                  <Text style={{ color: theme.text, fontSize: 15, fontWeight: '800' }}>{krw(summary.totalNet)}</Text>
                </View>
              </View>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={{ color: theme.textMuted, fontSize: 12 }}>수령완료</Text>
                  <Text style={{ color: theme.brand, fontSize: 13, fontWeight: '700' }}>{krw(summary.receivedNet)}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={{ color: theme.textMuted, fontSize: 12 }}>미수령</Text>
                  <Text style={{ color: theme.danger, fontSize: 13, fontWeight: '700' }}>{krw(summary.pendingNet)}</Text>
                </View>
              </View>
            </View>
          )}

          {view === '캘린더' ? (
            <View style={styles.sectionPad}>
              <View style={[styles.calCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.weekRow}>
                  {WEEKDAYS.map((w, i) => (
                    <Text key={w} style={[styles.weekLabel, { color: i === 0 ? theme.danger : i === 6 ? theme.brand : theme.textMuted }]}>
                      {w}
                    </Text>
                  ))}
                </View>
                <View style={styles.grid}>
                  {cells.map((day, i) => {
                    if (day == null) return <View key={i} style={styles.cell} />;
                    const dateStr = toLocalDateString(new Date(ym.year, ym.month - 1, day));
                    const dayRecords = recordsByDate.get(dateStr) ?? [];
                    const dayNet = dayRecords.reduce((sum, r) => sum + r.effectiveAmount, 0);
                    const selected = dateStr === calendarSelectedDate;
                    const isToday = dateStr === today;
                    return (
                      <Pressable key={i} style={styles.cell} onPress={() => setCalendarSelectedDate(selected ? null : dateStr)}>
                        <View style={[styles.dayCircle, selected && { backgroundColor: theme.brand }]}>
                          <Text style={{ color: selected ? '#fff' : theme.text, fontSize: 13, fontWeight: isToday || selected ? '700' : '500' }}>{day}</Text>
                        </View>
                        {dayRecords.length > 0 && <View style={[styles.dayDot, { backgroundColor: selected ? '#fff' : theme.brand }]} />}
                        {dayNet > 0 && (
                          <Text numberOfLines={1} style={{ color: selected ? '#fff' : theme.textMuted, fontSize: 8.5, marginTop: 1 }}>
                            {Math.round(dayNet / 10000)}만
                          </Text>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {calendarSelectedDate && (
                <View style={{ marginTop: 12 }}>
                  {selectedDayRecords.length === 0 ? (
                    <Text style={{ color: theme.textMuted, fontSize: 12.5 }}>이 날은 기록이 없어요</Text>
                  ) : (
                    <View style={[styles.listCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                      {selectedDayRecords.map((r, i) => renderRecordRow(r, i === selectedDayRecords.length - 1))}
                    </View>
                  )}
                </View>
              )}
            </View>
          ) : (
            <View style={styles.sectionPad}>
              {sortedRecords.length === 0 ? (
                <EmptyState iconCode={TE.briefcase} title="이 달 근무 기록이 없어요" desc="+ 추가로 등록해보세요" />
              ) : (
                <View style={[styles.listCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  {sortedRecords.map((r, i) => renderRecordRow(r, i === sortedRecords.length - 1))}
                </View>
              )}
            </View>
          )}
        </ScrollView>
      )}

      {selectMode && selectedIds.size > 0 && (
        <View style={[styles.bulkBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View>
            <Text style={{ color: theme.text, fontSize: 13, fontWeight: '700' }}>{selectedIds.size}건 선택</Text>
            <Text style={{ color: theme.textMuted, fontSize: 11.5 }}>합계 {krw(selectedTotal)}</Text>
          </View>
          <Pressable style={[styles.bulkDeleteBtn, { backgroundColor: theme.danger }]} onPress={() => setBulkDeleteConfirm(true)}>
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>삭제</Text>
          </Pressable>
        </View>
      )}

      <WorklogEntryForm
        visible={formVisible}
        record={editRecord}
        categories={categories}
        defaultDate={`${ym.year}-${String(ym.month).padStart(2, '0')}-01`}
        onClose={() => setFormVisible(false)}
        onSaved={(mode) => {
          setFormVisible(false);
          setToast(mode === 'edit' ? '근무 기록을 수정했어요' : mode === 'delete' ? '근무 기록을 삭제했어요' : '근무 기록을 추가했어요');
          worklogQ.refetch();
        }}
      />
      <WorklogCategorySheet visible={categorySheetVisible} onClose={() => setCategorySheetVisible(false)} />
      <ConfirmDialog
        visible={bulkDeleteConfirm}
        title={`선택한 ${selectedIds.size}건을 삭제할까요?`}
        confirmText="삭제하기"
        danger
        loading={bulkDeleting}
        onConfirm={handleBulkDelete}
        onClose={() => setBulkDeleteConfirm(false)}
      />
      <AppToast open={!!toast} text={toast} onClose={() => setToast('')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 4 },
  navBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  addBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  toolRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  toolChip: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, justifyContent: 'center' },
  sortRow: { paddingLeft: 16, marginBottom: 4, height: 44 },
  chipRow: { flexDirection: 'row', gap: 8, paddingRight: 16, paddingBottom: 4 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, borderWidth: 1, justifyContent: 'center' },
  summaryCard: { marginHorizontal: 20, marginTop: 8, borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  summaryRow: { flexDirection: 'row' },
  summaryItem: { flex: 1, gap: 4 },
  sectionPad: { paddingHorizontal: 20, paddingTop: 16 },
  listCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  dateBox: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  checkCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  calCard: { borderRadius: 14, borderWidth: 1, padding: 12 },
  weekRow: { flexDirection: 'row', marginBottom: 4 },
  weekLabel: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 0.85, alignItems: 'center', justifyContent: 'center' },
  dayCircle: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  dayDot: { width: 4, height: 4, borderRadius: 2, marginTop: 2 },
  bulkBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  bulkDeleteBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
});
