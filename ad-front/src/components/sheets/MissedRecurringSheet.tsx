import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Button from '../ui/Button';
import Loader from '../ui/Loader';
import SheetModal from './SheetModal';
import EmptyState from '../common/EmptyState';
import TossEmoji from '../common/TossEmoji';
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
import styles from './MissedRecurringSheet.module.css';

interface MissedRecurringSheetProps {
  visible: boolean;
  onClose: () => void;
  /** 반영 성공 콜백 (토스트) */
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

  // 목록 바뀌면 전체 선택으로 리셋
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
      const { created } = await applyMissed.mutateAsync(
        selectedItems.map((m) => ({ recurringId: m.recurringId, date: m.date })),
      );
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
        <div className={styles.cta}>
          {error ? <span className={styles.errorText} style={{ color: theme.danger }}>{error}</span> : null}
          <Button
            display="full"
            size="big"
            type="primary"
            disabled={selectedItems.length === 0}
            loading={applyMissed.isPending}
            onPress={handleApply}
          >
            선택 {selectedItems.length}건 반영하기
          </Button>
        </div>
      }
    >
      <div className={styles.body}>
        <div className={styles.infoBox} style={{ backgroundColor: theme.brandSoft }}>
          <TossEmoji code={TE.repeat} size={20} />
          <span className={styles.infoText} style={{ color: theme.brand }}>
            지정일에 자동 생성되지 못한 정기거래예요. 선택한 항목은 원래 지정일 날짜로 기록돼요.
          </span>
        </div>

        {/* 탐지 범위 */}
        <div className={styles.rangeRow}>
          {RANGES.map((r) => {
            const active = months === r.months;
            return (
              <button
                type="button"
                key={r.label}
                className={styles.rangeChip}
                style={{
                  backgroundColor: active ? theme.brand : theme.card,
                  borderColor: active ? theme.brand : theme.border,
                }}
                onClick={() => setMonths(r.months)}
              >
                <span className={styles.rangeChipText} style={{ color: active ? '#fff' : theme.textMuted }}>
                  {r.label}
                </span>
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div className={styles.loadingBox}><Loader /></div>
        ) : missed.length === 0 ? (
          <EmptyState compact iconCode={TE.check} title="누락된 정기거래가 없어요" desc="선택한 범위 안의 정기거래가 모두 반영되어 있어요" />
        ) : (
          <>
            <div className={styles.listHeader}>
              <span className={styles.listHeaderText} style={{ color: theme.textMuted }}>
                누락 {missed.length}건 · 선택 합계 {selectedTotal >= 0 ? '+' : '-'}{krw(Math.abs(selectedTotal))}
              </span>
              <button
                type="button"
                className={styles.selectAllBtn}
                style={{ color: theme.brand }}
                onClick={() => setSelected(allSelected ? new Set() : new Set(missed.map(keyOf)))}
              >
                {allSelected ? '전체 해제' : '전체 선택'}
              </button>
            </div>
            <div className={styles.listCard} style={{ backgroundColor: theme.card, borderColor: theme.border }}>
              {missed.map((m, i) => {
                const key = keyOf(m);
                const checked = selected.has(key);
                const isExpense = m.type === 'EXPENSE';
                return (
                  <button
                    type="button"
                    key={key}
                    className={`${styles.row} ${i > 0 ? styles.rowDivider : ''}`}
                    style={{ backgroundColor: 'transparent', borderTopColor: theme.border }}
                    onClick={() => toggleItem(key)}
                  >
                    <span
                      className={styles.checkCircle}
                      style={{
                        backgroundColor: checked ? theme.brand : 'transparent',
                        borderColor: checked ? theme.brand : theme.border,
                      }}
                    >
                      {checked ? Icon.check('#fff', 12) : null}
                    </span>
                    <span className={styles.rowInfo}>
                      <span className={styles.rowTitle} style={{ color: theme.text }}>{m.title || (isExpense ? '정기지출' : '정기수입')}</span>
                      <span className={styles.rowDate} style={{ color: theme.textMuted }}>{m.date.replace(/-/g, '.')}</span>
                    </span>
                    <span className={styles.rowAmount} style={{ color: isExpense ? theme.danger : theme.brand }}>
                      {isExpense ? '-' : '+'}{krw(m.amount)}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </SheetModal>
  );
}
