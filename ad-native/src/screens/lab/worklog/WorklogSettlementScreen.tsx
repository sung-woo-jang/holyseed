import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { labWorklogApi, type PayStatus, type WorklogRecord } from '../../../api/lab-worklog';
import { useTheme } from '../../../lib/theme';
import { krw } from '../../../lib/format';
import { todayLocal } from '../../../lib/date';
import { TE } from '../../../lib/toss-emoji';
import type { WorklogStackParamList } from '../../../navigation/WorklogStack';

type Props = NativeStackScreenProps<WorklogStackParamList, 'WorklogSettlement'>;

const PAY_STATUS_LABEL: Record<PayStatus, string> = {
  RECEIVED: '수령완료',
  EXPECTED: '수령예정',
  UNPAID: '미수령',
  DAYOFF: '휴무',
};

const STATUS_OPTIONS: PayStatus[] = ['RECEIVED', 'EXPECTED', 'UNPAID'];
const SCOPE_OPTIONS = ['월별', '미수령 전체'];

export default function WorklogSettlementScreen({ navigation }: Props) {
  const theme = useTheme();
  const [scope, setScope] = useState<'월별' | '미수령 전체'>('월별');
  const [ym, setYm] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  });
  const [targetStatus, setTargetStatus] = useState<PayStatus>('RECEIVED');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');

  function changeMonth(delta: number) {
    setYm((prev) => {
      const d = new Date(prev.year, prev.month - 1 + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() + 1 };
    });
  }

  const dataQ = useQuery({
    queryKey: ['lab-worklog-settlement', scope, ym.year, ym.month],
    queryFn: () =>
      scope === '월별'
        ? labWorklogApi.query({ year: ym.year, month: ym.month })
        : labWorklogApi.query({ from: '2000-01-01', to: todayLocal() }),
  });

  const candidates = useMemo(() => {
    const records = dataQ.data?.records ?? [];
    return records
      .filter((r) => r.payStatus === 'EXPECTED' || r.payStatus === 'UNPAID')
      .sort((a, b) => (a.workDate < b.workDate ? 1 : a.workDate > b.workDate ? -1 : 0));
  }, [dataQ.data]);

  // 스코프 전환/데이터 로드 시 후보 전체를 기본 선택 상태로
  useEffect(() => {
    setSelectedIds(new Set(candidates.map((r) => r.id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataQ.data, scope]);

  const allSelected = candidates.length > 0 && selectedIds.size === candidates.length;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable hitSlop={8} onPress={() => setSelectedIds(allSelected ? new Set() : new Set(candidates.map((r) => r.id)))}>
          <Text style={{ color: theme.brand, fontSize: 13, fontWeight: '700' }}>{allSelected ? '전체 해제' : '전체 선택'}</Text>
        </Pressable>
      ),
    });
  }, [navigation, allSelected, candidates, theme.brand]);

  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const selectedRecords = candidates.filter((r) => selectedIds.has(r.id));
  const selectedTotal = selectedRecords.reduce((sum, r) => sum + r.effectiveAmount, 0);
  const candidateTotal = candidates.reduce((sum, r) => sum + r.effectiveAmount, 0);

  async function handleConfirm() {
    setSubmitting(true);
    try {
      await Promise.all(Array.from(selectedIds).map((id) => labWorklogApi.update(id, { payStatus: targetStatus })));
      setToast(`${selectedIds.size}건을 ${PAY_STATUS_LABEL[targetStatus]}로 처리했어요`);
      await dataQ.refetch();
    } catch {
      setToast('일부 처리에 실패했어요');
    } finally {
      setConfirmVisible(false);
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView edges={['bottom']} style={[styles.root, { backgroundColor: theme.bg }]}>
      <View style={styles.segWrap}>
        <Segmented options={SCOPE_OPTIONS} value={scope} onChange={(v) => setScope(v as '월별' | '미수령 전체')} />
      </View>

      {scope === '월별' && (
        <View style={styles.monthNav}>
          <Pressable hitSlop={10} onPress={() => changeMonth(-1)} style={styles.monthNavBtn}>
            <Text style={{ color: theme.text, fontSize: 18 }}>‹</Text>
          </Pressable>
          <Text style={{ color: theme.text, fontSize: 14, fontWeight: '700' }}>
            {ym.year}년 {ym.month}월
          </Text>
          <Pressable hitSlop={10} onPress={() => changeMonth(1)} style={styles.monthNavBtn}>
            <Text style={{ color: theme.text, fontSize: 18 }}>›</Text>
          </Pressable>
        </View>
      )}

      <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={{ color: theme.textMuted, fontSize: 12 }}>미수령 건수</Text>
            <Text style={{ color: theme.text, fontSize: 16, fontWeight: '800' }}>{candidates.length}건</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={{ color: theme.textMuted, fontSize: 12 }}>미수령 합계</Text>
            <Text style={{ color: theme.text, fontSize: 16, fontWeight: '800' }}>{krw(candidateTotal)}</Text>
          </View>
        </View>
      </View>

      {dataQ.isLoading ? (
        <View style={styles.center}>
          <Loader size="large" />
        </View>
      ) : candidates.length === 0 ? (
        <EmptyState iconCode={TE.receipt} title="정산할 미수령 기록이 없어요" />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
          <View style={[styles.listCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {candidates.map((r, i) => (
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
                  right={
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Text style={{ color: theme.text, fontSize: 13.5, fontWeight: '700' }}>{krw(r.effectiveAmount)}</Text>
                      <View
                        style={[
                          styles.checkBox,
                          { borderColor: selectedIds.has(r.id) ? theme.brand : theme.border, backgroundColor: selectedIds.has(r.id) ? theme.brand : 'transparent' },
                        ]}
                      >
                        {selectedIds.has(r.id) && <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>✓</Text>}
                      </View>
                    </View>
                  }
                  onPress={() => toggleSelect(r.id)}
                  verticalPadding="small"
                />
                {i < candidates.length - 1 && <Border type="full" />}
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {selectedIds.size > 0 && (
        <View style={[styles.footerBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.statusChipRow}>
            {STATUS_OPTIONS.map((s) => {
              const active = s === targetStatus;
              return (
                <Pressable
                  key={s}
                  onPress={() => setTargetStatus(s)}
                  style={[styles.statusChip, { borderColor: active ? theme.brand : theme.border, backgroundColor: active ? theme.brandSoft : theme.bg }]}
                >
                  <Text style={{ fontSize: 11.5, fontWeight: '700', color: active ? theme.brand : theme.text }}>{PAY_STATUS_LABEL[s]}</Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.sumRow}>
            <Text style={{ color: theme.textMuted, fontSize: 12, fontWeight: '600' }}>{selectedIds.size}건 선택</Text>
            <Text style={{ color: theme.text, fontSize: 15, fontWeight: '800' }}>{krw(selectedTotal)}</Text>
          </View>
          <Pressable style={[styles.ctaBtn, { backgroundColor: theme.brand }]} onPress={() => setConfirmVisible(true)}>
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>선택한 {selectedIds.size}건 {PAY_STATUS_LABEL[targetStatus]}로 처리</Text>
          </Pressable>
        </View>
      )}

      <ConfirmDialog
        visible={confirmVisible}
        title={`${selectedIds.size}건을 ${PAY_STATUS_LABEL[targetStatus]}로 처리할까요?`}
        description={`합계 ${krw(selectedTotal)} · 선택한 근무 기록의 수령여부가 한 번에 바뀌어요`}
        confirmText="처리하기"
        loading={submitting}
        onConfirm={handleConfirm}
        onClose={() => setConfirmVisible(false)}
      />
      <AppToast open={!!toast} text={toast} onClose={() => setToast('')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  segWrap: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, paddingBottom: 10 },
  monthNavBtn: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  summaryCard: { marginHorizontal: 16, borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 12 },
  summaryRow: { flexDirection: 'row' },
  summaryItem: { flex: 1, gap: 4 },
  listCard: { marginHorizontal: 16, borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  dateBox: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  checkBox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  footerBar: { borderTopWidth: 1, padding: 14, gap: 10 },
  statusChipRow: { flexDirection: 'row', gap: 8 },
  statusChip: { flex: 1, borderWidth: 1, borderRadius: 999, paddingVertical: 7, alignItems: 'center' },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  ctaBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
});
