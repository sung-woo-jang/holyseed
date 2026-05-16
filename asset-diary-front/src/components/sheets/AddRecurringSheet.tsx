import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
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
import { krw } from '../../lib/format';

function formatNum(raw: string): string {
  const n = raw.replace(/[^0-9]/g, '');
  return n ? Number(n).toLocaleString() : '';
}

interface AddRecurringSheetProps {
  visible: boolean;
  onClose: () => void;
}

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

export default function AddRecurringSheet({ visible, onClose }: AddRecurringSheetProps) {
  const theme = useTheme();
  const data = useDataSource();
  const insets = useSafeAreaInsets();
  const [amount, setAmount] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [dayOfMonth, setDayOfMonth] = useState(25);
  const [fromAsset, setFromAsset] = useState('');
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [catPicker, setCatPicker] = useState(false);
  const [assetPicker, setAssetPicker] = useState(false);
  const [dayPicker, setDayPicker] = useState(false);
  const [saved, setSaved] = useState(false);

  const expenseCategories = Object.entries(CATEGORY_DEFS)
    .filter(([, def]) => def.type === 'EXPENSE')
    .map(([n]) => n);

  const assetOptions = data.assets.filter((a) => !a.isLiability);
  const amtNum = Number(amount.replace(/[^0-9]/g, ''));
  const isValid = amtNum > 0 && name.length > 0;

  const today = new Date();
  const nextDate = new Date(today.getFullYear(), today.getMonth() + (today.getDate() >= dayOfMonth ? 1 : 0), dayOfMonth);
  const nextDateStr = `${nextDate.getFullYear()}년 ${nextDate.getMonth() + 1}월 ${nextDate.getDate()}일`;

  function reset() {
    setAmount('');
    setName('');
    setCategory('');
    setDayOfMonth(25);
    setFromAsset('');
    setAutoGenerate(true);
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      reset();
      onClose();
    }, 700);
  }

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
                <Text style={[styles.headerTitle, { color: theme.text }]}>정기지출 추가</Text>
                <View style={{ width: 20 }} />
              </View>

              <ScrollView contentContainerStyle={styles.body}>
                {/* 안내 박스 */}
                <View style={[styles.infoBox, { backgroundColor: theme.brandSoft }]}>
                  <TossEmoji code={TE.repeat} size={20} />
                  <Text style={[styles.infoText, { color: theme.brand }]}>
                    매월 같은 날 자동으로 기록되는 지출만 등록할 수 있어요
                  </Text>
                </View>

                {/* 금액 */}
                <View style={styles.amountWrap}>
                  <TextInput
                    style={[styles.amountInput, { color: theme.text }]}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={theme.border}
                    value={amount}
                    onChangeText={(t) => setAmount(formatNum(t))}
                  />
                  <Text style={[styles.amountUnit, { color: theme.textMuted }]}>원</Text>
                </View>

                {/* 이름 */}
                <TextInput
                  style={[styles.nameInput, { borderColor: theme.border, color: theme.text, backgroundColor: theme.bg }]}
                  placeholder="항목 이름 (예: 넷플릭스)"
                  placeholderTextColor={theme.textMuted}
                  value={name}
                  onChangeText={setName}
                />

                {/* 필드 카드 */}
                <View style={[styles.fieldsCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                  <FormRow
                    label="카테고리"
                    value={category || '선택'}
                    onPress={() => setCatPicker(true)}
                  />
                  <FormRow
                    label="결제일"
                    value={`매월 ${dayOfMonth}일`}
                    onPress={() => setDayPicker(true)}
                  />
                  <FormRow
                    label="출금 자산"
                    value={fromAsset || '선택'}
                    onPress={() => setAssetPicker(true)}
                  />
                </View>

                {/* 자동 생성 토글 */}
                <View style={[styles.toggleRow, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                  <View style={styles.toggleInfo}>
                    <Text style={[styles.toggleLabel, { color: theme.text }]}>자동 생성 활성화</Text>
                    <Text style={[styles.toggleSub, { color: theme.textMuted }]}>결제일에 자동으로 거래가 기록돼요</Text>
                  </View>
                  <Switch
                    value={autoGenerate}
                    onValueChange={setAutoGenerate}
                    trackColor={{ false: theme.border, true: theme.brand }}
                    thumbColor="#fff"
                  />
                </View>

                {/* 미리보기 카드 */}
                {isValid && autoGenerate && (
                  <View style={[styles.previewCard, { borderColor: theme.brand }]}>
                    <Text style={[styles.previewText, { color: theme.text }]}>
                      <Text style={{ fontWeight: '700' }}>{nextDateStr}</Text>에{' '}
                      <Text style={{ fontWeight: '700' }}>{fromAsset || '선택한 자산'}</Text>에서{' '}
                      <Text style={{ fontWeight: '700', color: theme.danger }}>-{krw(amtNum)}</Text>이 자동으로 기록돼요
                    </Text>
                  </View>
                )}
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
        {expenseCategories.map((n) => {
          const def = getCategoryDef(n);
          return (
            <TouchableOpacity
              key={n}
              style={[styles.pickerItem, { borderBottomColor: theme.border }]}
              onPress={() => { setCategory(n); setCatPicker(false); }}
            >
              <TossEmoji code={def.iconCode} size={28} bg={def.color + '22'} />
              <Text style={[styles.pickerItemText, { color: theme.text }]}>{n}</Text>
              {category === n && Icon.check(theme.brand, 16)}
            </TouchableOpacity>
          );
        })}
      </PickerSheet>

      {/* 자산 피커 */}
      <PickerSheet visible={assetPicker} title="자산 선택" onClose={() => setAssetPicker(false)}>
        {assetOptions.map((a) => (
          <TouchableOpacity
            key={a.id}
            style={[styles.pickerItem, { borderBottomColor: theme.border }]}
            onPress={() => { setFromAsset(a.name); setAssetPicker(false); }}
          >
            <Text style={[styles.pickerItemText, { color: theme.text }]}>{a.name}</Text>
            {fromAsset === a.name && Icon.check(theme.brand, 16)}
          </TouchableOpacity>
        ))}
      </PickerSheet>

      {/* 결제일 피커 */}
      <PickerSheet visible={dayPicker} title="결제일 선택" onClose={() => setDayPicker(false)}>
        <View style={styles.dayGrid}>
          {DAYS.map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.dayCell, { backgroundColor: dayOfMonth === d ? theme.brand : theme.bg, borderColor: theme.border }]}
              onPress={() => { setDayOfMonth(d); setDayPicker(false); }}
            >
              <Text style={[styles.dayCellText, { color: dayOfMonth === d ? '#fff' : theme.text }]}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>
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
  infoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 20 },
  infoText: { flex: 1, fontSize: 13, lineHeight: 18 },
  amountWrap: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', marginBottom: 16 },
  amountInput: { fontSize: 32, fontWeight: '800', textAlign: 'center', minWidth: 80 },
  amountUnit: { fontSize: 18, fontWeight: '700', marginLeft: 6 },
  nameInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, marginBottom: 12 },
  fieldsCard: { borderRadius: 14, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 12 },
  toggleInfo: { flex: 1 },
  toggleLabel: { fontSize: 14, fontWeight: '600' },
  toggleSub: { fontSize: 12, marginTop: 2 },
  previewCard: { borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14 },
  previewText: { fontSize: 14, lineHeight: 20 },
  footer: { padding: 20, borderTopWidth: 1 },
  saveBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  saveBtnText: { fontSize: 16, fontWeight: '700' },
  confirmBox: { paddingVertical: 60, alignItems: 'center', gap: 12 },
  confirmTitle: { fontSize: 22, fontWeight: '800' },
  pickerItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1 },
  pickerItemText: { flex: 1, fontSize: 15, fontWeight: '500' },
  dayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 12 },
  dayCell: { width: 42, height: 42, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  dayCellText: { fontSize: 14, fontWeight: '600' },
});
