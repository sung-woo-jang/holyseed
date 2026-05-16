import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/theme';
import { useDataSource } from '../../lib/data-source';
import TossEmoji from '../common/TossEmoji';
import FormRow from '../common/FormRow';
import PickerSheet from './PickerSheet';
import { CATEGORY_DEFS, getCategoryDef } from '../../lib/category-meta';
import { TE } from '../../lib/toss-emoji';
import { Icon } from '../common/Icon';

type TxType = 'EXPENSE' | 'INCOME' | 'TRANSFER';

const TYPE_OPTIONS: { key: TxType; label: string; color: string }[] = [
  { key: 'EXPENSE', label: '지출', color: '#EF4444' },
  { key: 'INCOME', label: '수입', color: '#3182F6' },
  { key: 'TRANSFER', label: '이체', color: '#6B7280' },
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
  const [category, setCategory] = useState('');
  const [fromAsset, setFromAsset] = useState('');
  const [toAsset, setToAsset] = useState('');
  const [title, setTitle] = useState('');
  const [memo, setMemo] = useState('');
  const [catPicker, setCatPicker] = useState(false);
  const [fromPicker, setFromPicker] = useState(false);
  const [toPicker, setToPicker] = useState(false);
  const [saved, setSaved] = useState(false);

  const catOptions = Object.entries(CATEGORY_DEFS)
    .filter(([, def]) => def.type === type || type === 'TRANSFER')
    .map(([name]) => name);

  const assetOptions = data.assets.filter((a) => !a.isLiability);
  const isValid = amount.replace(/[^0-9]/g, '') !== '';

  function reset() {
    setType('EXPENSE');
    setAmount('');
    setCategory('');
    setFromAsset('');
    setToAsset('');
    setTitle('');
    setMemo('');
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      reset();
      onClose();
    }, 700);
  }

  const typeColor = TYPE_OPTIONS.find((t) => t.key === type)?.color ?? theme.brand;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable style={[styles.sheet, { backgroundColor: theme.card }]} onPress={() => {}}>
          <View style={[styles.handle, { backgroundColor: theme.border }]} />

          {saved ? (
            <View style={styles.confirmBox}>
              <TossEmoji code={TE.check} size={64} />
              <Text style={[styles.confirmTitle, { color: theme.text }]}>저장 완료!</Text>
            </View>
          ) : (
            <>
              <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  {Icon.close(theme.textMuted, 20)}
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>거래 추가</Text>
                <View style={{ width: 20 }} />
              </View>

              <ScrollView contentContainerStyle={styles.body}>
                {/* 타입 Segmented */}
                <View style={[styles.typeRow, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                  {TYPE_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt.key}
                      style={[styles.typeBtn, type === opt.key && { backgroundColor: theme.card, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 }]}
                      onPress={() => { setType(opt.key); setCategory(''); }}
                    >
                      <Text style={[styles.typeBtnText, { color: type === opt.key ? opt.color : theme.textMuted }]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* 금액 입력 */}
                <View style={styles.amountWrap}>
                  <TextInput
                    style={[styles.amountInput, { color: typeColor }]}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={theme.border}
                    value={amount}
                    onChangeText={(t) => setAmount(formatNum(t))}
                    autoFocus
                  />
                  <Text style={[styles.amountUnit, { color: theme.textMuted }]}>원</Text>
                </View>

                {/* 필드 카드 */}
                <View style={[styles.fieldsCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                  {type !== 'TRANSFER' && (
                    <FormRow
                      label="카테고리"
                      value={category || '선택'}
                      onPress={() => setCatPicker(true)}
                    />
                  )}
                  {(type === 'EXPENSE' || type === 'TRANSFER') && (
                    <FormRow
                      label={type === 'TRANSFER' ? '보내는 자산' : '출금 자산'}
                      value={fromAsset || '선택'}
                      onPress={() => setFromPicker(true)}
                    />
                  )}
                  {(type === 'INCOME' || type === 'TRANSFER') && (
                    <FormRow
                      label={type === 'TRANSFER' ? '받는 자산' : '입금 자산'}
                      value={toAsset || '선택'}
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

              <View style={[styles.footer, { borderTopColor: theme.border, paddingBottom: insets.bottom + 12 }]}>
                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: isValid ? theme.brand : theme.border }]}
                  onPress={handleSave}
                  disabled={!isValid}
                >
                  <Text style={[styles.saveBtnText, { color: isValid ? '#fff' : theme.textMuted }]}>저장하기</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </Pressable>
        </KeyboardAvoidingView>
      </Pressable>

      {/* 카테고리 피커 */}
      <PickerSheet visible={catPicker} title="카테고리 선택" onClose={() => setCatPicker(false)}>
        {catOptions.map((name) => {
          const def = getCategoryDef(name);
          return (
            <TouchableOpacity
              key={name}
              style={[styles.pickerItem, { borderBottomColor: theme.border }]}
              onPress={() => { setCategory(name); setCatPicker(false); }}
            >
              <TossEmoji code={def.iconCode} size={28} bg={def.color + '22'} />
              <Text style={[styles.pickerItemText, { color: theme.text }]}>{name}</Text>
              {category === name && Icon.check(theme.brand, 16)}
            </TouchableOpacity>
          );
        })}
      </PickerSheet>

      {/* 출금 자산 피커 */}
      <PickerSheet visible={fromPicker} title="자산 선택" onClose={() => setFromPicker(false)}>
        {assetOptions.map((a) => (
          <TouchableOpacity
            key={a.id}
            style={[styles.pickerItem, { borderBottomColor: theme.border }]}
            onPress={() => { setFromAsset(a.name); setFromPicker(false); }}
          >
            <Text style={[styles.pickerItemText, { color: theme.text }]}>{a.name}</Text>
            {fromAsset === a.name && Icon.check(theme.brand, 16)}
          </TouchableOpacity>
        ))}
      </PickerSheet>

      {/* 입금 자산 피커 */}
      <PickerSheet visible={toPicker} title="자산 선택" onClose={() => setToPicker(false)}>
        {assetOptions.map((a) => (
          <TouchableOpacity
            key={a.id}
            style={[styles.pickerItem, { borderBottomColor: theme.border }]}
            onPress={() => { setToAsset(a.name); setToPicker(false); }}
          >
            <Text style={[styles.pickerItemText, { color: theme.text }]}>{a.name}</Text>
            {toAsset === a.name && Icon.check(theme.brand, 16)}
          </TouchableOpacity>
        ))}
      </PickerSheet>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { maxHeight: '90%', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  body: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  typeRow: { flexDirection: 'row', borderRadius: 12, borderWidth: 1, padding: 4, marginBottom: 20 },
  typeBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 9 },
  typeBtnText: { fontSize: 14, fontWeight: '700' },
  amountWrap: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', marginBottom: 20 },
  amountInput: { fontSize: 36, fontWeight: '800', textAlign: 'center', minWidth: 80 },
  amountUnit: { fontSize: 20, fontWeight: '700', marginLeft: 6 },
  fieldsCard: { borderRadius: 14, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  titleInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, marginBottom: 8 },
  memoInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, textAlignVertical: 'top' },
  footer: { padding: 20, borderTopWidth: 1 },
  saveBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  saveBtnText: { fontSize: 16, fontWeight: '700' },
  confirmBox: { paddingVertical: 60, alignItems: 'center', gap: 12 },
  confirmTitle: { fontSize: 22, fontWeight: '800' },
  pickerItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1 },
  pickerItemText: { flex: 1, fontSize: 15, fontWeight: '500' },
});
