import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Button from '../ui/Button';
import Loader from '../ui/Loader';
import SheetModal from './SheetModal';
import EmptyState from '../common/EmptyState';
import { useTheme } from '../../lib/theme';
import { useAuthStore } from '../../stores/auth.store';
import { recurringApi } from '../../api';
import { qk } from '../../queries/keys';
import { useApplyMissed } from '../../queries/mutations';
import { krw } from '../../lib/format';
import { toLocalDateString } from '../../lib/date';
import { getErrorMessage } from '../../lib/error';
import { TE } from '../../lib/toss-emoji';
import { Icon } from '../common/Icon';
import type { MissedOccurrence } from '../../types/api';

interface MissedRecurringSheetProps {
  visible: boolean;
  onClose: () => void;
  onApplied?: (count: number) => void;
}

const RANGES = [
  { label: '전체', months: null },
  { label: '1개월', months: 1 },
  { label: '3개월', months: 3 },
  { label: '6개월', months: 6 },
] as const;

function fromDateFor(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return toLocalDateString(d);
}

const keyOf = (m: Pick<MissedOccurrence, 'recurringId' | 'date'>) => `${m.recurringId}:${m.date}`;

export default function MissedRecurringSheet({ visible, onClose, onApplied }: MissedRecurringSheetProps) {
  const theme = useTheme();
  const hid = useAuthStore((s) => s.currentHousehold?.id);
  const [months, setMonths] = useState<number | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');
  const applyMissed = useApplyMissed();

  const fromDate = months == null ? undefined : fromDateFor(months);
  const { data: missed = [], isLoading } = useQuery({
    queryKey: qk.recurringMissed(hid!, fromDate),
    queryFn: () => recurringApi.missed(hid!, fromDate),
    enabled: visible && !!hid,
  });

  const missedKeys = useMemo(() => missed.map(keyOf).join('|'), [missed]);
  useEffect(() => {
    setSelected(new Set(missed.map(keyOf)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missedKeys, visible]);

  const allSelected = missed.length > 0 && selected.size === missed.length;
  const selectedItems = missed.filter((m) => selected.has(keyOf(m)));
  const selectedTotal = selectedItems.reduce((s, m) => s + (m.type === 'EXPENSE' ? -m.amount : m.amount), 0);

  function toggleItem(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleApply() {
    setError('');
    try {
      const { created } = await applyMissed.mutateAsync(selectedItems.map((m) => ({ recurringId: m.recurringId, date: m.date })));
      onClose();
      onApplied?.(created);
    } catch (e: any) {
      setError(getErrorMessage(e, '반영에 실패했어요. 다시 시도해 주세요.'));
    }
  }

  return (
    <SheetModal
      visible={visible}
      onClose={onClose}
      header="미반영 정기거래"
      cta={
        <>
          {error ? <Text style={{ color: theme.danger, fontSize: 12 }}>{error}</Text> : null}
          <Button display="full" size="big" type="primary" disabled={selectedItems.length === 0} loading={applyMissed.isPending} onPress={handleApply}>
            선택 {selectedItems.length}건 반영하기
          </Button>
        </>
      }
    >
      <View style={[styles.infoBox, { backgroundColor: theme.brandSoft }]}>
        <Text style={[styles.infoText, { color: theme.brand }]}>지정일에 자동 생성되지 못한 정기거래예요. 선택한 항목은 원래 지정일 날짜로 기록돼요.</Text>
      </View>

      <View style={styles.rangeRow}>
        {RANGES.map((r) => {
          const active = months === r.months;
          return (
            <Pressable
              key={r.label}
              style={[styles.rangeChip, { backgroundColor: active ? theme.brand : theme.card, borderColor: active ? theme.brand : theme.border }]}
              onPress={() => setMonths(r.months)}
            >
              <Text style={{ color: active ? '#fff' : theme.textMuted, fontSize: 12, fontWeight: '700' }}>{r.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {isLoading ? (
        <View style={styles.loadingBox}>
          <Loader />
        </View>
      ) : missed.length === 0 ? (
        <EmptyState compact iconCode={TE.check} title="누락된 정기거래가 없어요" desc="선택한 범위 안의 정기거래가 모두 반영되어 있어요" />
      ) : (
        <>
          <View style={styles.listHeader}>
            <Text style={{ color: theme.textMuted, fontSize: 12 }}>
              누락 {missed.length}건 · 선택 합계 {selectedTotal >= 0 ? '+' : '-'}
              {krw(Math.abs(selectedTotal))}
            </Text>
            <Pressable onPress={() => setSelected(allSelected ? new Set() : new Set(missed.map(keyOf)))}>
              <Text style={{ color: theme.brand, fontSize: 12, fontWeight: '700' }}>{allSelected ? '전체 해제' : '전체 선택'}</Text>
            </Pressable>
          </View>
          <View style={[styles.listCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {missed.map((m, i) => {
              const key = keyOf(m);
              const checked = selected.has(key);
              const isExpense = m.type === 'EXPENSE';
              return (
                <Pressable
                  key={key}
                  style={[styles.row, i > 0 && { borderTopWidth: 1, borderTopColor: theme.border }]}
                  onPress={() => toggleItem(key)}
                >
                  <View style={[styles.checkCircle, { backgroundColor: checked ? theme.brand : 'transparent', borderColor: checked ? theme.brand : theme.border }]}>
                    {checked ? Icon.check('#fff', 12) : null}
                  </View>
                  <View style={styles.rowInfo}>
                    <Text style={{ color: theme.text, fontSize: 14, fontWeight: '600' }}>{m.title || (isExpense ? '정기지출' : '정기수입')}</Text>
                    <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 2 }}>{m.date.replace(/-/g, '.')}</Text>
                  </View>
                  <Text style={{ color: isExpense ? theme.danger : theme.brand, fontSize: 14, fontWeight: '700' }}>
                    {isExpense ? '-' : '+'}
                    {krw(m.amount)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </>
      )}
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  infoBox: { borderRadius: 12, padding: 12, marginBottom: 12 },
  infoText: { fontSize: 12.5 },
  rangeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  rangeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  loadingBox: { alignItems: 'center', paddingVertical: 32 },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  listCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
  checkCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  rowInfo: { flex: 1 },
});
