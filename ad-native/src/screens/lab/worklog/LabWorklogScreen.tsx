import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import ListRow from '../../../components/ui/ListRow';
import Border from '../../../components/ui/Border';
import Loader from '../../../components/ui/Loader';
import EmptyState from '../../../components/common/EmptyState';
import AppToast from '../../../components/common/AppToast';
import WorklogEntryForm from './WorklogEntryForm';
import { labWorklogApi, type WorklogRecord } from '../../../api/lab-worklog';
import { useTheme } from '../../../lib/theme';
import { krw } from '../../../lib/format';
import { TE } from '../../../lib/toss-emoji';

const PAY_STATUS_LABEL: Record<WorklogRecord['payStatus'], string> = {
  RECEIVED: '수령완료',
  EXPECTED: '수령예정',
  UNPAID: '미수령',
  DAYOFF: '휴무',
};

export default function LabWorklogScreen() {
  const theme = useTheme();
  const [ym, setYm] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  });
  const [formVisible, setFormVisible] = useState(false);
  const [editRecord, setEditRecord] = useState<WorklogRecord | null>(null);
  const [toast, setToast] = useState('');
  const [refreshing, setRefreshing] = useState(false);

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
  }

  const records = worklogQ.data?.records ?? [];
  const summary = worklogQ.data?.summary;
  const categories = categoriesQ.data ?? [];

  function openAdd() {
    setEditRecord(null);
    setFormVisible(true);
  }

  function openEdit(record: WorklogRecord) {
    setEditRecord(record);
    setFormVisible(true);
  }

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

      {worklogQ.isLoading ? (
        <View style={styles.center}>
          <Loader size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 32 }}
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

          <View style={styles.sectionPad}>
            {records.length === 0 ? (
              <EmptyState iconCode={TE.briefcase} title="이 달 근무 기록이 없어요" desc="+ 추가로 등록해보세요" />
            ) : (
              <View style={[styles.listCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                {records.map((r, i) => (
                  <View key={r.id}>
                    <ListRow
                      left={
                        <View style={[styles.dateBox, { backgroundColor: theme.bg }]}>
                          <Text style={{ color: theme.textMuted, fontSize: 10, fontWeight: '700' }}>{Number(r.workDate.slice(5, 7))}월</Text>
                          <Text style={{ color: theme.text, fontSize: 15, fontWeight: '800' }}>{Number(r.workDate.slice(8, 10))}</Text>
                        </View>
                      }
                      contents={
                        <View>
                          <Text style={{ color: theme.text, fontSize: 14, fontWeight: '600' }}>{r.title}</Text>
                          <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 2 }}>
                            {r.category} · {PAY_STATUS_LABEL[r.payStatus]}
                          </Text>
                        </View>
                      }
                      right={<Text style={{ color: theme.text, fontSize: 14, fontWeight: '700' }}>{krw(r.effectiveAmount)}</Text>}
                      onPress={() => openEdit(r)}
                      verticalPadding="small"
                    />
                    {i < records.length - 1 && <Border type="full" />}
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
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
  summaryCard: { marginHorizontal: 20, marginTop: 8, borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  summaryRow: { flexDirection: 'row' },
  summaryItem: { flex: 1, gap: 4 },
  sectionPad: { paddingHorizontal: 20, paddingTop: 16 },
  listCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  dateBox: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
