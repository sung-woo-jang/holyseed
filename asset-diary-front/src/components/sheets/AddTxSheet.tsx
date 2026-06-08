import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheet, Button, TextFieldBig, ListRow, SegmentedControl } from '@toss/tds-react-native';
import { useTheme } from '../../lib/theme';
import { useDataSource } from '../../lib/data-source';
import TossEmoji from '../common/TossEmoji';
import FormRow from '../common/FormRow';
import PickerSheet from './PickerSheet';
import { CATEGORY_DEFS, getCategoryDef } from '../../lib/category-meta';
import { TE } from '../../lib/toss-emoji';
import { Icon } from '../common/Icon';
import { useCreateTx } from '../../queries/mutations';

type TxType = 'EXPENSE' | 'INCOME' | 'TRANSFER';

const TYPE_OPTIONS: { key: TxType; label: string }[] = [
  { key: 'EXPENSE', label: '지출' },
  { key: 'INCOME', label: '수입' },
  { key: 'TRANSFER', label: '이체' },
];

function formatNum(raw: string): string {
  const n = raw.replace(/[^0-9]/g, '');
  return n ? Number(n).toLocaleString() : '';
}

interface AddTxSheetProps {
  visible: boolean;
  onClose: () => void;
}

export default function AddTxSheet({ visible, onClose }: AddTxSheetProps) {
  const theme = useTheme();
  const data = useDataSource();
  const insets = useSafeAreaInsets();
  const [type, setType] = useState<TxType>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<{ id: number; name: string } | null>(null);
  const [fromAsset, setFromAsset] = useState<{ id: string; name: string } | null>(null);
  const [toAsset, setToAsset] = useState<{ id: string; name: string } | null>(null);
  const [title, setTitle] = useState('');
  const [memo, setMemo] = useState('');
  const [catPicker, setCatPicker] = useState(false);
  const [fromPicker, setFromPicker] = useState(false);
  const [toPicker, setToPicker] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const createTx = useCreateTx();

  const catOptions = Object.entries(CATEGORY_DEFS)
    .filter(([, def]) => def.type === type || type === 'TRANSFER')
    .map(([name]) => name);

  const assetOptions = data.assets.filter((a) => !a.isLiability);
  const isValid = amount.replace(/[^0-9]/g, '') !== '';

  function reset() {
    setType('EXPENSE');
    setAmount('');
    setCategory(null);
    setFromAsset(null);
    setToAsset(null);
    setTitle('');
    setMemo('');
    setError('');
  }

  async function handleSave() {
    setError('');
    const today = new Date().toISOString().split('T')[0]!;
    const rawAmount = Number(amount.replace(/[^0-9]/g, ''));
    try {
      await createTx.mutateAsync({
        date: today,
        type,
        amount: rawAmount,
        ...(category ? { categoryId: category.id } : {}),
        ...(fromAsset ? { fromAssetId: Number(fromAsset.id) } : {}),
        ...(toAsset ? { toAssetId: Number(toAsset.id) } : {}),
        memo: memo || title || undefined,
      });
      setSaved(true);
      setTimeout(() => { setSaved(false); reset(); onClose(); }, 700);
    } catch (e: any) {
      setError(e?.message ?? '저장에 실패했어요. 다시 시도해 주세요.');
    }
  }

  return (
    <>
      <BottomSheet.Root
        open={visible}
        onClose={onClose}
        header={<BottomSheet.Header>거래 추가</BottomSheet.Header>}
      >
        {saved ? (
          <View style={styles.confirmBox}>
            <TossEmoji code={TE.check} size={64} />
            <Text style={[styles.confirmTitle, { color: theme.text }]}>저장 완료!</Text>
          </View>
        ) : (
          <>
            <ScrollView contentContainerStyle={styles.body}>
              {/* 타입 SegmentedControl */}
              <View style={styles.segWrap}>
                <SegmentedControl.Root
                  value={type}
                  onChange={(v) => { setType(v as TxType); setCategory(null); }}
                  name="txType"
                  size="large"
                  alignment="fixed"
                >
                  {TYPE_OPTIONS.map((opt) => (
                    <SegmentedControl.Item key={opt.key} value={opt.key}>
                      {opt.label}
                    </SegmentedControl.Item>
                  ))}
                </SegmentedControl.Root>
              </View>

              {/* 금액 */}
              <View style={styles.amountWrap}>
                <TextFieldBig
                  placeholder="0"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={(t) => setAmount(formatNum(t))}
                  suffix="원"
                  autoFocus
                  style={styles.amountField}
                />
              </View>

              {/* 필드 카드 */}
              <View style={[styles.fieldsCard, { borderColor: theme.border }]}>
                {type !== 'TRANSFER' && (
                  <FormRow
                    label="카테고리"
                    value={category?.name || ''}
                    onPress={() => setCatPicker(true)}
                  />
                )}
                {(type === 'EXPENSE' || type === 'TRANSFER') && (
                  <FormRow
                    label={type === 'TRANSFER' ? '보내는 자산' : '출금 자산'}
                    value={fromAsset?.name || ''}
                    onPress={() => setFromPicker(true)}
                  />
                )}
                {(type === 'INCOME' || type === 'TRANSFER') && (
                  <FormRow
                    label={type === 'TRANSFER' ? '받는 자산' : '입금 자산'}
                    value={toAsset?.name || ''}
                    onPress={() => setToPicker(true)}
                  />
                )}
              </View>

              {/* 제목 / 메모 */}
              <TextInput
                style={[styles.titleInput, { borderColor: theme.border, color: theme.text, backgroundColor: theme.bg }]}
                placeholder="제목 (선택)"
                placeholderTextColor={theme.textMuted}
                value={title}
                onChangeText={setTitle}
              />
              <TextInput
                style={[styles.memoInput, { borderColor: theme.border, color: theme.text, backgroundColor: theme.bg }]}
                placeholder="메모 (선택)"
                placeholderTextColor={theme.textMuted}
                multiline
                numberOfLines={3}
                value={memo}
                onChangeText={setMemo}
              />
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
              {error ? <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text> : null}
              <Button display="full" size="big" type="primary" disabled={!isValid} loading={createTx.isPending} onPress={handleSave}>
                저장하기
              </Button>
            </View>
          </>
        )}
      </BottomSheet.Root>

      {/* 카테고리 피커 */}
      <PickerSheet visible={catPicker} title="카테고리 선택" onClose={() => setCatPicker(false)}>
        {(data.categories.filter((c) => c.type === type || type === 'TRANSFER').length > 0
          ? data.categories.filter((c) => c.type === type || type === 'TRANSFER')
              .map((c) => {
                const def = getCategoryDef(c.name);
                return (
                  <ListRow
                    key={c.id}
                    left={<TossEmoji code={def.iconCode} size={28} bg={def.color + '22'} />}
                    contents={c.name}
                    right={category?.id === c.id ? Icon.check(theme.brand, 16) : undefined}
                    onPress={() => { setCategory({ id: c.id, name: c.name }); setCatPicker(false); }}
                    verticalPadding="small"
                  />
                );
              })
          : catOptions.map((name) => {
              const def = getCategoryDef(name);
              return (
                <ListRow
                  key={name}
                  left={<TossEmoji code={def.iconCode} size={28} bg={def.color + '22'} />}
                  contents={name}
                  right={category?.name === name ? Icon.check(theme.brand, 16) : undefined}
                  onPress={() => { setCategory({ id: 0, name }); setCatPicker(false); }}
                  verticalPadding="small"
                />
              );
            })
        )}
      </PickerSheet>

      {/* 출금 자산 피커 */}
      <PickerSheet visible={fromPicker} title="자산 선택" onClose={() => setFromPicker(false)}>
        {assetOptions.map((a) => (
          <ListRow
            key={a.id}
            contents={a.name}
            right={fromAsset?.id === a.id ? Icon.check(theme.brand, 16) : undefined}
            onPress={() => { setFromAsset({ id: a.id, name: a.name }); setFromPicker(false); }}
            verticalPadding="small"
          />
        ))}
      </PickerSheet>

      {/* 입금 자산 피커 */}
      <PickerSheet visible={toPicker} title="자산 선택" onClose={() => setToPicker(false)}>
        {assetOptions.map((a) => (
          <ListRow
            key={a.id}
            contents={a.name}
            right={toAsset?.id === a.id ? Icon.check(theme.brand, 16) : undefined}
            onPress={() => { setToAsset({ id: a.id, name: a.name }); setToPicker(false); }}
            verticalPadding="small"
          />
        ))}
      </PickerSheet>
    </>
  );
}

const styles = StyleSheet.create({
  confirmBox: { paddingVertical: 60, alignItems: 'center', gap: 12 },
  confirmTitle: { fontSize: 22, fontWeight: '800' },
  body: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  segWrap: { marginBottom: 20 },
  amountWrap: { alignItems: 'center', marginBottom: 20 },
  amountField: { width: '100%' },
  fieldsCard: { borderRadius: 14, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  titleInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, marginBottom: 8 },
  memoInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, textAlignVertical: 'top' },
  footer: { paddingHorizontal: 20, paddingTop: 12 },
  errorText: { fontSize: 13, textAlign: 'center', marginBottom: 8 },
});
