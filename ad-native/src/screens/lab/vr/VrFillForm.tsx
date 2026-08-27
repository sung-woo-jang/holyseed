import { useEffect, useState } from 'react';
import { Text, TextInput, View, StyleSheet } from 'react-native';
import SheetModal from '../../../components/sheets/SheetModal';
import Button from '../../../components/ui/Button';
import TextField from '../../../components/ui/TextField';
import Segmented from '../../../components/common/Segmented';
import FormRow from '../../../components/common/FormRow';
import DatePicker from '../../../components/common/DatePicker';
import { vrApi, type VrFillKind } from '../../../api/vr';
import { useTheme } from '../../../lib/theme';
import { todayLocal } from '../../../lib/date';
import { getErrorMessage } from '../../../lib/error';

interface VrFillFormProps {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const KIND_OPTIONS: { value: VrFillKind; label: string }[] = [
  { value: 'BUY', label: '매수' },
  { value: 'SELL', label: '매도' },
  { value: 'DEPOSIT', label: '입금' },
  { value: 'INITIAL_BUY', label: '초기매수' },
];

export default function VrFillForm({ visible, onClose, onSaved }: VrFillFormProps) {
  const theme = useTheme();
  const [fillDate, setFillDate] = useState(todayLocal());
  const [kind, setKind] = useState<VrFillKind>('BUY');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [note, setNote] = useState('');
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return;
    setFillDate(todayLocal());
    setKind('BUY');
    setPrice('');
    setQuantity('');
    setNote('');
    setError('');
  }, [visible]);

  const isDeposit = kind === 'DEPOSIT';
  const isValid = !!fillDate && price.trim().length > 0 && (isDeposit || quantity.trim().length > 0);

  async function handleSave() {
    setError('');
    setSaving(true);
    try {
      await vrApi.createFill({
        fillDate,
        kind,
        price: Number(price),
        quantity: isDeposit ? 0 : Number(quantity),
        note: note || undefined,
      });
      onSaved();
    } catch (e) {
      setError(getErrorMessage(e, '등록에 실패했어요. 다시 시도해 주세요.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <SheetModal
      visible={visible}
      onClose={onClose}
      header="체결 등록"
      cta={
        <>
          {error ? <Text style={{ color: theme.danger, fontSize: 12 }}>{error}</Text> : null}
          <Button display="full" size="big" type="primary" disabled={!isValid} loading={saving} onPress={handleSave}>
            등록하기
          </Button>
        </>
      }
      overlay={<DatePicker visible={datePickerVisible} value={fillDate} maxDate={todayLocal()} onSelect={setFillDate} onClose={() => setDatePickerVisible(false)} />}
    >
      <View style={styles.segWrap}>
        <Segmented options={KIND_OPTIONS.map((o) => o.label)} value={KIND_OPTIONS.find((o) => o.value === kind)?.label ?? '매수'} onChange={(label) => setKind(KIND_OPTIONS.find((o) => o.label === label)!.value)} />
      </View>

      <View style={[styles.fieldsCard, { borderColor: theme.border }]}>
        <FormRow label="체결일" value={fillDate === todayLocal() ? `오늘 (${fillDate.slice(5).replace('-', '/')})` : fillDate} onPress={() => setDatePickerVisible(true)} />
      </View>

      <TextField
        variant="box"
        placeholder={isDeposit ? '입금액 ($)' : '체결가 ($)'}
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
        style={{ marginBottom: 12 }}
      />
      {!isDeposit && <TextField variant="box" placeholder="수량 (주)" value={quantity} onChangeText={setQuantity} keyboardType="numeric" style={{ marginBottom: 12 }} />}

      <TextInput
        style={[styles.memoInput, { borderColor: theme.border, color: theme.text, backgroundColor: theme.bg }]}
        placeholder="메모 (선택)"
        placeholderTextColor={theme.textMuted}
        multiline
        numberOfLines={2}
        value={note}
        onChangeText={setNote}
      />
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  segWrap: { marginBottom: 12 },
  fieldsCard: { borderWidth: 1, borderRadius: 12, marginBottom: 12, overflow: 'hidden' },
  memoInput: { minHeight: 60, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingTop: 10, fontSize: 14, textAlignVertical: 'top' },
});
