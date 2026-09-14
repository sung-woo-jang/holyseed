import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Button from '../components/ui/Button';
import TextField from '../components/ui/TextField';
import EmptyState from '../components/common/EmptyState';
import JointAvatar from '../components/common/JointAvatar';
import AssetCategoryIcon from '../components/common/AssetCategoryIcon';
import { Icon } from '../components/common/Icon';
import { useTheme } from '../lib/theme';
import { TE } from '../lib/toss-emoji';
import { useKeyboardScrollRegistration, KeyboardScrollProvider } from '../lib/keyboard-scroll';
import { useCreateAsset, useUpdateAsset, useUpsertSnapshot } from '../queries/mutations';
import { useHouseholdData } from '../queries/useHouseholdData';
import { useAuthStore } from '../stores/auth.store';
import { todayLocal } from '../lib/date';
import { getErrorMessage } from '../lib/error';
import type { AssetCategory } from '../types/api';
import type { AssetsStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AssetsStackParamList, 'AssetAdd'>;

function formatNum(raw: string): string {
  const n = raw.replace(/[^0-9]/g, '');
  return n ? Number(n).toLocaleString() : '';
}

const CATEGORY_OPTIONS: { key: AssetCategory; label: string }[] = [
  { key: 'CASH', label: '예적금' },
  { key: 'INVESTMENT', label: '주식·ETF' },
  { key: 'CRYPTO', label: '코인' },
  { key: 'REAL_ESTATE', label: '부동산' },
  { key: 'PENSION', label: '연금' },
  { key: 'LIABILITY', label: '부채' },
];

export default function AssetAddScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const data = useHouseholdData();
  const { user } = useAuthStore();
  const params = route.params;
  const isEdit = params.mode === 'edit';
  const editAsset = params.mode === 'edit' ? (data.assets.find((a) => a.id === params.assetId) ?? null) : null;

  const [step, setStep] = useState<1 | 2>(1);
  const [assetName, setAssetName] = useState('');
  const [category, setCategory] = useState<AssetCategory | null>(null);
  const [ownerUserId, setOwnerUserId] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const { scrollRef, scrollToInput, onScroll, keyboardHeight } = useKeyboardScrollRegistration();
  const createAsset = useCreateAsset();
  const updateAsset = useUpdateAsset();
  const upsertSnapshot = useUpsertSnapshot();

  useEffect(() => {
    if (isEdit) {
      if (!editAsset) return;
      setAssetName(editAsset.name);
      setCategory(editAsset.category);
      setOwnerUserId(editAsset.ownerUserId ?? null);
    } else {
      setOwnerUserId(user ? Number(user.id) : null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, editAsset?.id]);

  useEffect(() => {
    navigation.setOptions({ title: isEdit ? '자산 수정' : `자산 추가 · ${step}/2` });
  }, [navigation, isEdit, step]);

  const isLiability = category === 'LIABILITY';
  const amtNum = Number(amount.replace(/[^0-9]/g, ''));
  const step1Valid = assetName.trim().length > 0 && category !== null;
  const isPending = createAsset.isPending || updateAsset.isPending || upsertSnapshot.isPending;

  async function handleEditSave() {
    if (!editAsset) return;
    setError('');
    try {
      await updateAsset.mutateAsync({ id: Number(editAsset.id), dto: { name: assetName.trim(), category: category!, ownerUserId } });
      navigation.navigate('AssetsList', { savedMode: 'edit', savedAt: Date.now() });
    } catch (e: any) {
      setError(getErrorMessage(e, '수정에 실패했어요. 다시 시도해 주세요.'));
    }
  }

  async function handleSave(skipAmount = false) {
    setError('');
    const today = todayLocal();
    try {
      const newAsset = await createAsset.mutateAsync({ name: assetName.trim(), category: category!, currency: 'KRW', isLiability, ownerUserId });
      const valueToSave = skipAmount ? 0 : amtNum;
      if (valueToSave > 0) {
        await upsertSnapshot.mutateAsync({ assetId: newAsset.id, dto: { date: today, value: valueToSave } });
      }
      navigation.navigate('AssetsList', { savedMode: 'create', savedAt: Date.now() });
    } catch (e: any) {
      setError(getErrorMessage(e, '저장에 실패했어요. 다시 시도해 주세요.'));
    }
  }

  if (isEdit && !editAsset) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <EmptyState iconCode={TE.search} title="자산을 찾을 수 없어요" />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView ref={scrollRef} contentContainerStyle={{ padding: 20, paddingBottom: 32 + keyboardHeight }} onScroll={onScroll} scrollEventThrottle={16}>
          <KeyboardScrollProvider value={scrollToInput}>
          {step === 1 ? (
            <>
              <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>자산 이름</Text>
              <TextField variant="line" placeholder="예: 토스뱅크 파킹통장" value={assetName} onChangeText={setAssetName} />

              <Text style={[styles.fieldLabel, { color: theme.textMuted, marginTop: 20 }]}>카테고리</Text>
              <View style={styles.categoryGrid}>
                {CATEGORY_OPTIONS.map((opt) => {
                  const selected = category === opt.key;
                  const isLiab = opt.key === 'LIABILITY';
                  return (
                    <Pressable
                      key={opt.key}
                      style={[
                        styles.categoryCell,
                        {
                          borderColor: selected ? (isLiab ? theme.danger : theme.brand) : theme.border,
                          backgroundColor: selected ? (isLiab ? 'rgba(240,68,82,0.10)' : theme.brandSoft) : theme.card,
                        },
                      ]}
                      onPress={() => setCategory(opt.key)}
                    >
                      <AssetCategoryIcon category={opt.key} size={20} color={selected ? (isLiab ? theme.danger : theme.brand) : theme.textMuted} />
                      <Text style={{ fontSize: 13, fontWeight: '600', color: selected ? (isLiab ? theme.danger : theme.brand) : theme.text }}>{opt.label}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[styles.fieldLabel, { color: theme.textMuted, marginTop: 20 }]}>소유자</Text>
              <View style={styles.ownerRow}>
                {data.members.map((m) => {
                  const selected = ownerUserId === Number(m.id);
                  return (
                    <View style={styles.ownerItem} key={m.id}>
                      <Pressable
                        style={[styles.ownerAvatar, { backgroundColor: m.avatar, borderColor: selected ? theme.text : 'transparent' }]}
                        onPress={() => setOwnerUserId(Number(m.id))}
                      >
                        {selected ? Icon.check('#fff', 16) : <Text style={styles.ownerAvatarText}>{m.initial}</Text>}
                      </Pressable>
                      <Text style={{ fontSize: 11, color: selected ? theme.text : theme.textMuted }}>{m.name}</Text>
                    </View>
                  );
                })}
                <View style={styles.ownerItem}>
                  <Pressable style={[styles.ownerAvatar, { borderColor: ownerUserId === null ? theme.text : 'transparent' }]} onPress={() => setOwnerUserId(null)}>
                    <View style={StyleSheet.absoluteFill}>
                      <JointAvatar size={48} brand={theme.brand} muted={theme.textMuted} />
                    </View>
                    {ownerUserId === null && Icon.check('#fff', 16)}
                  </Pressable>
                  <Text style={{ fontSize: 11, color: ownerUserId === null ? theme.text : theme.textMuted }}>공동</Text>
                </View>
              </View>
            </>
          ) : (
            <>
              <Text style={[styles.fieldLabel, { color: theme.textMuted, textAlign: 'center' }]}>{isLiability ? '부채 잔액' : '현재 평가액'}</Text>
              <View style={styles.amountWrap}>
                <TextInput
                  style={[styles.amountInput, { color: isLiability ? theme.danger : theme.text }]}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={theme.textMuted}
                  value={amount}
                  onChangeText={(t) => setAmount(formatNum(t))}
                  autoFocus
                />
                <Text style={[styles.amountUnit, { color: theme.textMuted }]}>원</Text>
              </View>

              <Pressable onPress={() => handleSave(true)} disabled={isPending} style={styles.skipBtn}>
                <Text style={{ color: theme.textMuted, fontSize: 13 }}>건너뛰기 (나중에 입력)</Text>
              </Pressable>
            </>
          )}
          </KeyboardScrollProvider>
        </ScrollView>

        <View style={[styles.ctaWrap, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
          {error ? <Text style={{ color: theme.danger, fontSize: 12, marginBottom: 8 }}>{error}</Text> : null}
          {isEdit ? (
            <Button display="full" size="big" type="primary" disabled={!step1Valid} loading={isPending} onPress={handleEditSave}>
              수정하기
            </Button>
          ) : step === 1 ? (
            <Button display="full" size="big" type="primary" disabled={!step1Valid} onPress={() => setStep(2)}>
              다음
            </Button>
          ) : (
            <Button display="full" size="big" type="primary" disabled={amtNum === 0} loading={isPending} onPress={() => handleSave(false)}>
              저장하기
            </Button>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fieldLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryCell: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1.4, width: '31%' },
  ownerRow: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
  ownerItem: { alignItems: 'center', gap: 4 },
  ownerAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 2, overflow: 'hidden' },
  ownerAvatarText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  amountWrap: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', marginTop: 40, marginBottom: 20 },
  amountInput: { fontSize: 40, fontWeight: '800', textAlign: 'center', minWidth: 80 },
  amountUnit: { fontSize: 18, fontWeight: '600', marginLeft: 6 },
  skipBtn: { alignItems: 'center', paddingVertical: 8 },
  ctaWrap: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20, borderTopWidth: 1 },
});
