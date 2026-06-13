import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch as RNSwitch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Button, ListRow, Switch, TextField, TextFieldBig } from '@toss/tds-react-native';
import SheetModal from './SheetModal';
import PickerSheet from './PickerSheet';
import FormRow from '../common/FormRow';
import { Icon } from '../common/Icon';
import { useTheme } from '../../lib/theme';
import { useDataSource } from '../../lib/data-source';
import { krw } from '../../lib/format';
import { WORK_COLORS } from '../../lib/work-meta';
import { useCreateWorkLog, useUpdateWorkLog } from '../../queries/mutations';
import type { WorkLog } from '../../types/api';

function formatNum(raw: string): string {
  const n = raw.replace(/[^0-9]/g, '');
  return n ? Number(n).toLocaleString() : '';
}

interface LogWorkSheetProps {
  visible: boolean;
  onClose: () => void;
  date: string;
  month: string;
  existing?: WorkLog | null;
  /** 자주 쓰는 제목 프리셋 */
  presets?: string[];
  onSaved?: () => void;
}

export default function LogWorkSheet({ visible, onClose, date, month, existing, presets = [], onSaved }: LogWorkSheetProps) {
  const theme = useTheme();
  const data = useDataSource();
  const isEdit = !!existing;
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [useHourly, setUseHourly] = useState(false);
  const [hours, setHours] = useState('');
  const [rate, setRate] = useState('');
  const [colorLabel, setColorLabel] = useState<string>((WORK_COLORS[0] as string));
  const [settled, setSettled] = useState(false);
  const [asset, setAsset] = useState<{ id: string; name: string } | null>(null);
  const [assetPicker, setAssetPicker] = useState(false);
  const [memo, setMemo] = useState('');
  const [error, setError] = useState('');
  const createWorkLog = useCreateWorkLog(month);
  const updateWorkLog = useUpdateWorkLog(month);

  const assetOptions = data.assets.filter((a) => !a.isLiability);

  useEffect(() => {
    if (!visible) return;
    if (existing) {
      setTitle(existing.title);
      setAmount(existing.amount ? Number(existing.amount).toLocaleString() : '');
      setColorLabel(existing.colorLabel || (WORK_COLORS[0] as string));
      setSettled(existing.settled);
      setMemo(existing.memo || '');
      if (existing.workMinutes && existing.hourlyRate) {
        setUseHourly(true);
        setHours(String(Math.round(existing.workMinutes / 60 * 10) / 10));
        setRate(Number(existing.hourlyRate).toLocaleString());
      } else {
        setUseHourly(false); setHours(''); setRate('');
      }
    } else {
      setTitle(''); setAmount(''); setUseHourly(false); setHours(''); setRate('');
      setColorLabel((WORK_COLORS[0] as string)); setSettled(false); setAsset(null); setMemo(''); setError('');
    }
  }, [visible, existing]);

  const hoursNum = Number(hours.replace(/[^0-9.]/g, '')) || 0;
  const rateNum = Number(rate.replace(/[^0-9]/g, '')) || 0;
  const computedAmount = useHourly ? Math.round(hoursNum * 60 / 60 * rateNum) : Number(amount.replace(/[^0-9]/g, '')) || 0;
  const isValid = title.trim().length > 0;
  const isPending = createWorkLog.isPending || updateWorkLog.isPending;

  async function handleSave() {
    setError('');
    const base = {
      title: title.trim(),
      colorLabel,
      memo: memo || undefined,
      ...(useHourly
        ? { workMinutes: Math.round(hoursNum * 60), hourlyRate: rateNum }
        : { amount: computedAmount }),
    };
    try {
      if (isEdit && existing) {
        await updateWorkLog.mutateAsync({ id: existing.id, dto: base });
      } else {
        await createWorkLog.mutateAsync({
          date,
          settled,
          ...(settled && asset ? { toAssetId: Number(asset.id) } : {}),
          ...base,
        });
      }
      onClose();
      onSaved?.();
    } catch (e: any) {
      setError(e?.message ?? '저장에 실패했어요. 다시 시도해 주세요.');
    }
  }

  return (
    <>
    <SheetModal
      visible={visible}
      onClose={onClose}
      header={isEdit ? '근무 기록 수정' : `근무 기록 · ${date.slice(5).replace('-', '/')}`}
      cta={
        <View style={styles.cta}>
          {error ? <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text> : null}
          <Button display="full" size="big" type="primary" disabled={!isValid} loading={isPending} onPress={handleSave}>
            {isEdit ? '수정하기' : '저장하기'}
          </Button>
        </View>
      }
    >
      <ScrollView contentContainerStyle={styles.body}>
        {/* 제목 + 프리셋 */}
        <Text style={[styles.label, { color: theme.textMuted }]}>제목</Text>
        <TextField variant="line" placeholder="예: 회사출근, 알바" value={title} onChangeText={setTitle} />
        {presets.length > 0 && (
          <View style={styles.chipRow}>
            {presets.slice(0, 8).map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.chip, { backgroundColor: theme.brandSoft }]}
                onPress={() => setTitle(p)}
              >
                <Text style={[styles.chipText, { color: theme.brand }]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* 시급 계산 토글 */}
        <View style={styles.hourlyToggle}>
          <Text style={[styles.label, { color: theme.textMuted, marginBottom: 0 }]}>시급으로 계산</Text>
          <RNSwitch value={useHourly} onValueChange={setUseHourly} trackColor={{ true: theme.brand }} />
        </View>

        {/* 금액 또는 시간×시급 */}
        {useHourly ? (
          <View style={styles.hourlyRow}>
            <View style={styles.hourlyField}>
              <Text style={[styles.label, { color: theme.textMuted }]}>근무시간</Text>
              <TextField variant="line" placeholder="0" keyboardType="numeric" value={hours} onChangeText={setHours} suffix="시간" />
            </View>
            <View style={styles.hourlyField}>
              <Text style={[styles.label, { color: theme.textMuted }]}>시급</Text>
              <TextField variant="line" placeholder="0" keyboardType="numeric" value={rate} onChangeText={(t) => setRate(formatNum(t))} suffix="원" />
            </View>
          </View>
        ) : (
          <View style={styles.amountWrap}>
            <Text style={[styles.label, { color: theme.textMuted }]}>수입 금액</Text>
            <TextFieldBig placeholder="0" keyboardType="numeric" value={amount} onChangeText={(t) => setAmount(formatNum(t))} suffix="원" />
          </View>
        )}
        {useHourly && computedAmount > 0 && (
          <Text style={[styles.computed, { color: theme.brand }]}>= {krw(computedAmount)}</Text>
        )}

        {/* 색상 표식 */}
        <Text style={[styles.label, { color: theme.textMuted, marginTop: 16 }]}>색상 표식</Text>
        <View style={styles.colorRow}>
          {WORK_COLORS.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.colorCircle, { backgroundColor: c, borderWidth: colorLabel === c ? 3 : 0, borderColor: theme.text }]}
              onPress={() => setColorLabel(c)}
            />
          ))}
        </View>

        {/* 수령 여부 (신규 생성 시에만 토글; 편집은 별도 액션) */}
        {!isEdit && (
          <>
            <ListRow
              contents={<Text style={{ color: theme.text, fontSize: 15, fontWeight: '600' }}>수령함 (자산에 반영)</Text>}
              right={<Switch checked={settled} onCheckedChange={setSettled} />}
              verticalPadding="small"
            />
            {settled && (
              <View style={[styles.fieldsCard, { borderColor: theme.border }]}>
                <FormRow label="입금 자산" value={asset?.name || ''} onPress={() => setAssetPicker(true)} />
              </View>
            )}
          </>
        )}

        {/* 메모 */}
        <TextInput
          style={[styles.memoInput, { borderColor: theme.border, color: theme.text, backgroundColor: theme.bg }]}
          placeholder="메모 (선택)"
          placeholderTextColor={theme.textMuted}
          value={memo}
          onChangeText={setMemo}
        />
        </ScrollView>
      </SheetModal>

      {/* 입금 자산 피커 */}
      <PickerSheet visible={assetPicker} title="입금 자산 선택" onClose={() => setAssetPicker(false)}>
        {assetOptions.map((a) => (
          <ListRow
            key={a.id}
            contents={<Text style={{ color: theme.text, fontSize: 15, fontWeight: '500' }}>{a.name}</Text>}
            right={asset?.id === a.id ? Icon.check(theme.brand, 16) : undefined}
            onPress={() => { setAsset({ id: a.id, name: a.name }); setAssetPicker(false); }}
            verticalPadding="small"
          />
        ))}
      </PickerSheet>
    </>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 12 },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  chipText: { fontSize: 13, fontWeight: '600' },
  hourlyToggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 8 },
  hourlyRow: { flexDirection: 'row', gap: 12 },
  hourlyField: { flex: 1 },
  amountWrap: { marginTop: 4 },
  computed: { fontSize: 14, fontWeight: '700', textAlign: 'right', marginTop: 6 },
  colorRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  colorCircle: { width: 32, height: 32, borderRadius: 16 },
  fieldsCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden', marginTop: 8 },
  memoInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, marginTop: 16 },
  cta: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 },
  errorText: { fontSize: 13, textAlign: 'center', marginBottom: 8 },
});
