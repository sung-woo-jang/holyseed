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
import { Button, Switch, TextField } from '@toss/tds-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/theme';
import { TE } from '../../lib/toss-emoji';
import TossEmoji from '../common/TossEmoji';
import { Icon } from '../common/Icon';
import { useCreateAsset, useUpsertSnapshot } from '../../queries/mutations';
import type { AssetCategory } from '../../types/api';

function formatNum(raw: string): string {
  const n = raw.replace(/[^0-9]/g, '');
  return n ? Number(n).toLocaleString() : '';
}

const CATEGORY_OPTIONS: { key: AssetCategory; label: string }[] = [
  { key: 'CASH',        label: '💰 예적금' },
  { key: 'INVESTMENT',  label: '📈 주식·ETF' },
  { key: 'CRYPTO',      label: '🪙 코인' },
  { key: 'REAL_ESTATE', label: '🏠 부동산' },
  { key: 'PENSION',     label: '🏦 연금' },
  { key: 'LIABILITY',   label: '💳 부채' },
];

const CURRENCIES = ['USD', 'EUR', 'JPY', 'CNY'];

interface AddAssetSheetProps {
  visible: boolean;
  onClose: () => void;
}

export default function AddAssetSheet({ visible, onClose }: AddAssetSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<1 | 2>(1);
  const [assetName, setAssetName] = useState('');
  const [category, setCategory] = useState<AssetCategory | null>(null);
  const [amount, setAmount] = useState('');
  const [isFx, setIsFx] = useState(false);
  const [currency, setCurrency] = useState('USD');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const createAsset = useCreateAsset();
  const upsertSnapshot = useUpsertSnapshot();

  const isLiability = category === 'LIABILITY';
  const amtNum = Number(amount.replace(/[^0-9]/g, ''));
  const step1Valid = assetName.trim().length > 0 && category !== null;
  const isPending = createAsset.isPending || upsertSnapshot.isPending;

  function reset() {
    setStep(1);
    setAssetName('');
    setCategory(null);
    setAmount('');
    setIsFx(false);
    setCurrency('USD');
    setError('');
  }

  async function handleSave(skipAmount = false) {
    setError('');
    const today = new Date().toISOString().split('T')[0]!;
    try {
      const newAsset = await createAsset.mutateAsync({
        name: assetName.trim(),
        category: category!,
        currency: isFx ? currency : 'KRW',
        isLiability: isLiability,
      });
      const valueToSave = skipAmount ? 0 : amtNum;
      if (valueToSave > 0) {
        await upsertSnapshot.mutateAsync({
          assetId: newAsset.id,
          dto: { date: today, value: valueToSave },
        });
      }
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        reset();
        onClose();
      }, 700);
    } catch (e: any) {
      setError(e?.message ?? '저장에 실패했어요. 다시 시도해 주세요.');
    }
  }

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable style={[styles.sheet, { backgroundColor: theme.card }]} onPress={() => {}}>
          <View style={[styles.handle, { backgroundColor: theme.border }]} />

          {saved ? (
            <View style={styles.confirmBox}>
              <TossEmoji code={TE.check} size={64} />
              <Text style={[styles.confirmTitle, { color: theme.text }]}>자산이 추가됐어요!</Text>
              <Text style={[styles.confirmSub, { color: theme.textMuted }]}>스냅샷을 입력하면 순자산에 반영돼요</Text>
            </View>
          ) : (
            <>
              <View style={[styles.header, { borderBottomColor: theme.border }]}>
                {step === 2 ? (
                  <TouchableOpacity onPress={() => setStep(1)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    {Icon.back(theme.textMuted)}
                  </TouchableOpacity>
                ) : (
                  <View style={{ width: 24 }} />
                )}
                <Text style={[styles.headerTitle, { color: theme.text }]}>
                  자산 추가 · {step}/2
                </Text>
                <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  {Icon.close(theme.textMuted, 20)}
                </TouchableOpacity>
              </View>

              {step === 1 ? (
                <ScrollView contentContainerStyle={styles.body}>
                  {/* 자산 이름 */}
                  <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>자산 이름</Text>
                  <TextField
                    variant="box"
                    placeholder="예: 토스뱅크 파킹통장"
                    value={assetName}
                    onChangeText={setAssetName}
                  />

                  {/* 카테고리 그리드 */}
                  <Text style={[styles.fieldLabel, { color: theme.textMuted, marginTop: 20 }]}>카테고리</Text>
                  <View style={styles.categoryGrid}>
                    {CATEGORY_OPTIONS.map((opt) => {
                      const selected = category === opt.key;
                      const isLiab = opt.key === 'LIABILITY';
                      return (
                        <TouchableOpacity
                          key={opt.key}
                          style={[
                            styles.categoryCell,
                            {
                              borderColor: selected
                                ? (isLiab ? theme.danger : theme.brand)
                                : theme.border,
                              backgroundColor: selected
                                ? (isLiab ? 'rgba(240,68,82,0.10)' : theme.brandSoft)
                                : theme.bg,
                            },
                          ]}
                          onPress={() => setCategory(opt.key)}
                        >
                          <Text style={[
                            styles.categoryCellText,
                            { color: selected ? (isLiab ? theme.danger : theme.brand) : theme.text },
                          ]}>
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              ) : (
                <ScrollView contentContainerStyle={styles.body}>
                  {/* 큰 금액 입력 */}
                  <Text style={[styles.fieldLabel, { color: theme.textMuted, textAlign: 'center' }]}>
                    {isLiability ? '부채 잔액' : '현재 평가액'}
                  </Text>
                  <View style={styles.amountWrap}>
                    <TextInput
                      style={[styles.amountInput, { color: isLiability ? theme.danger : theme.text }]}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={theme.border}
                      value={amount}
                      onChangeText={(t) => setAmount(formatNum(t))}
                      autoFocus
                    />
                    <Text style={[styles.amountUnit, { color: theme.textMuted }]}>{isFx ? currency : '원'}</Text>
                  </View>

                  {/* 외화 토글 */}
                  <View style={[styles.fxRow, { borderColor: theme.border, backgroundColor: theme.bg }]}>
                    <Text style={[styles.fxLabel, { color: theme.text }]}>외화 자산이에요</Text>
                    <Switch
                      checked={isFx}
                      onCheckedChange={(v) => { setIsFx(v); if (!v) setCurrency('USD'); }}
                    />
                  </View>

                  {/* 통화 선택 (외화 시) */}
                  {isFx && (
                    <View style={styles.currencyRow}>
                      {CURRENCIES.map((c) => (
                        <TouchableOpacity
                          key={c}
                          style={[
                            styles.currencyChip,
                            {
                              backgroundColor: currency === c ? theme.brand : theme.bg,
                              borderColor: currency === c ? theme.brand : theme.border,
                            },
                          ]}
                          onPress={() => setCurrency(c)}
                        >
                          <Text style={[styles.currencyChipText, { color: currency === c ? '#fff' : theme.text }]}>
                            {c}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* 건너뛰기 */}
                  <TouchableOpacity
                    onPress={() => handleSave(true)}
                    disabled={isPending}
                    style={styles.skipBtn}
                  >
                    <Text style={[styles.skipText, { color: theme.textMuted }]}>
                      건너뛰기 (나중에 입력)
                    </Text>
                  </TouchableOpacity>

                  {error ? <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text> : null}
                </ScrollView>
              )}

              <View style={[styles.footer, { borderTopColor: theme.border, paddingBottom: insets.bottom + 12 }]}>
                {step === 1 ? (
                  <Button
                    display="full"
                    size="big"
                    type="primary"
                    disabled={!step1Valid}
                    onPress={() => setStep(2)}
                  >
                    다음
                  </Button>
                ) : (
                  <Button
                    display="full"
                    size="big"
                    type="primary"
                    disabled={amtNum === 0}
                    loading={isPending}
                    onPress={() => handleSave(false)}
                  >
                    저장하기
                  </Button>
                )}
              </View>
            </>
          )}
        </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { maxHeight: '88%', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  body: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  fieldLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
  nameInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, fontSize: 15 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  categoryCell: { width: '47%', paddingVertical: 16, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  categoryCellText: { fontSize: 14, fontWeight: '700' },
  amountWrap: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', marginTop: 16, marginBottom: 20 },
  amountInput: { fontSize: 36, fontWeight: '800', textAlign: 'center', minWidth: 80, letterSpacing: -1 },
  amountUnit: { fontSize: 20, fontWeight: '700', marginLeft: 6 },
  fxRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 12 },
  fxLabel: { flex: 1, fontSize: 14, fontWeight: '600' },
  currencyRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  currencyChip: { paddingVertical: 8, paddingHorizontal: 18, borderRadius: 20, borderWidth: 1 },
  currencyChipText: { fontSize: 14, fontWeight: '700' },
  skipBtn: { alignItems: 'center', paddingVertical: 12 },
  skipText: { fontSize: 14, textDecorationLine: 'underline' },
  footer: { padding: 20, borderTopWidth: 1 },
  nextBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  nextBtnText: { fontSize: 16, fontWeight: '700' },
  confirmBox: { paddingVertical: 60, alignItems: 'center', gap: 12 },
  confirmTitle: { fontSize: 22, fontWeight: '800' },
  confirmSub: { fontSize: 14 },
  errorText: { fontSize: 13, textAlign: 'center', marginTop: 8 },
});
