import { useEffect, useState } from 'react';
import Button from '../ui/Button';
import TextFieldBig from '../ui/TextFieldBig';
import SheetModal from './SheetModal';
import FormRow from '../common/FormRow';
import DatePicker from '../common/DatePicker';
import ConfirmDialog from '../common/ConfirmDialog';
import { useTheme } from '../../lib/theme';
import { todayLocal } from '../../lib/date';
import { getErrorMessage } from '../../lib/error';
import { krwShort } from '../../lib/format';
import { useUpsertSnapshot, useDeleteSnapshot } from '../../queries/mutations';
import styles from './EditSnapshotSheet.module.css';

export interface EditableSnapshot {
  date: string; // YYYY-MM-DD
  value: number;
}

interface EditSnapshotSheetProps {
  visible: boolean;
  assetId: number;
  snapshot: EditableSnapshot | null;
  onClose: () => void;
  /** 저장/삭제 성공 콜백 (토스트 문구) */
  onDone?: (message: string) => void;
}

function formatNum(raw: string): string {
  const n = raw.replace(/[^0-9]/g, '');
  return n ? Number(n).toLocaleString() : '';
}

/** 스냅샷 히스토리 항목 수정 — 금액·날짜 변경, 삭제 */
export default function EditSnapshotSheet({ visible, assetId, snapshot, onClose, onDone }: EditSnapshotSheetProps) {
  const theme = useTheme();
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');
  const upsert = useUpsertSnapshot();
  const del = useDeleteSnapshot();

  // 열릴 때 프리필
  useEffect(() => {
    if (visible && snapshot) {
      setAmount(snapshot.value > 0 ? snapshot.value.toLocaleString() : '');
      setDate(snapshot.date);
      setDatePickerOpen(false);
      setConfirmDelete(false);
      setError('');
    }
  }, [visible, snapshot]);

  const amtNum = Number(amount.replace(/[^0-9]/g, ''));
  const isValid = amtNum > 0 && !!date;
  const dateChanged = !!snapshot && date !== snapshot.date;
  const isPending = upsert.isPending || del.isPending;

  async function handleSave() {
    if (!snapshot) return;
    setError('');
    try {
      await upsert.mutateAsync({ assetId, dto: { date, value: amtNum } });
      // 날짜를 바꿨으면 기존 날짜 스냅샷 제거 (이동)
      if (dateChanged) {
        await del.mutateAsync({ assetId, date: snapshot.date });
      }
      onClose();
      onDone?.('스냅샷을 수정했어요');
    } catch (e: unknown) {
      setError(getErrorMessage(e, '수정에 실패했어요. 다시 시도해 주세요.'));
    }
  }

  async function handleDelete() {
    if (!snapshot) return;
    setError('');
    try {
      await del.mutateAsync({ assetId, date: snapshot.date });
      setConfirmDelete(false);
      onClose();
      onDone?.('스냅샷을 삭제했어요');
    } catch (e: unknown) {
      setConfirmDelete(false);
      setError(getErrorMessage(e, '삭제에 실패했어요. 다시 시도해 주세요.'));
    }
  }

  return (
    <>
      <SheetModal
        visible={visible}
        onClose={onClose}
        header="스냅샷 수정"
        cta={
          <div className={styles.cta}>
            {error ? <span className={styles.errorText} style={{ color: theme.danger }}>{error}</span> : null}
            <Button display="full" size="big" type="primary" disabled={!isValid} loading={isPending} onPress={handleSave}>
              {dateChanged ? '날짜 이동하고 저장' : '저장하기'}
            </Button>
            <button type="button" className={styles.deleteBtn} onClick={() => setConfirmDelete(true)}>
              <span style={{ color: theme.danger }}>이 스냅샷 삭제</span>
            </button>
          </div>
        }
        overlay={
          <DatePicker
            visible={datePickerOpen}
            value={date}
            maxDate={todayLocal()}
            onSelect={setDate}
            onClose={() => setDatePickerOpen(false)}
          />
        }
      >
        <div className={styles.body}>
          <div className={styles.amountWrap}>
            <TextFieldBig
              placeholder="0"
              keyboardType="numeric"
              value={amount}
              onChangeText={(t) => setAmount(formatNum(t))}
              suffix="원"
              style={{ width: '100%' }}
              autoFocus
            />
            {amtNum >= 10_000 && (
              <span className={styles.wonHelper} style={{ color: theme.textMuted }}>= {krwShort(amtNum)}원</span>
            )}
          </div>

          <div className={styles.fieldsCard} style={{ borderColor: theme.border }}>
            <FormRow label="날짜" value={date} onPress={() => setDatePickerOpen(true)} />
          </div>
          {dateChanged && (
            <span className={styles.moveHint} style={{ color: theme.textMuted }}>
              {snapshot?.date} 기록이 {date}로 이동돼요
            </span>
          )}
        </div>
      </SheetModal>

      <ConfirmDialog
        visible={confirmDelete}
        title="스냅샷을 삭제할까요?"
        description={snapshot ? `${snapshot.date}의 기록이 삭제돼요.` : undefined}
        confirmText="삭제하기"
        danger
        loading={del.isPending}
        onConfirm={handleDelete}
        onClose={() => setConfirmDelete(false)}
      />
    </>
  );
}
