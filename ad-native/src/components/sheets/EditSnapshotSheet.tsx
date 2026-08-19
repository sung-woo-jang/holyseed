import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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

export interface EditableSnapshot {
  date: string;
  value: number;
}

interface EditSnapshotSheetProps {
  visible: boolean;
  assetId: number;
  snapshot: EditableSnapshot | null;
  onClose: () => void;
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
          <>
            {error ? <Text style={{ color: theme.danger, fontSize: 12 }}>{error}</Text> : null}
            <Button display="full" size="big" type="primary" disabled={!isValid} loading={isPending} onPress={handleSave}>
              {dateChanged ? '날짜 이동하고 저장' : '저장하기'}
            </Button>
            <Pressable style={styles.deleteBtn} onPress={() => setConfirmDelete(true)}>
              <Text style={{ color: theme.danger, fontSize: 14, fontWeight: '600' }}>이 스냅샷 삭제</Text>
            </Pressable>
          </>
        }
        overlay={<DatePicker visible={datePickerOpen} value={date} maxDate={todayLocal()} onSelect={setDate} onClose={() => setDatePickerOpen(false)} />}
      >
        <View style={styles.amountWrap}>
          <TextFieldBig placeholder="0" keyboardType="numeric" value={amount} onChangeText={(t) => setAmount(formatNum(t))} suffix="원" autoFocus />
          {amtNum >= 10_000 && <Text style={{ color: theme.textMuted, fontSize: 12, textAlign: 'center', marginTop: 4 }}>= {krwShort(amtNum)}원</Text>}
        </View>

        <View style={[styles.fieldsCard, { borderColor: theme.border }]}>
          <FormRow label="날짜" value={date} onPress={() => setDatePickerOpen(true)} />
        </View>
        {dateChanged && (
          <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 8 }}>
            {snapshot?.date} 기록이 {date}로 이동돼요
          </Text>
        )}
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

const styles = StyleSheet.create({
  amountWrap: { marginBottom: 16 },
  fieldsCard: { borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  deleteBtn: { alignItems: 'center', paddingVertical: 8 },
});
