import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button, ListRow, Switch, TextField } from '@toss/tds-react-native';
import SheetModal from './SheetModal';
import { useTheme } from '../../lib/theme';
import { TE } from '../../lib/toss-emoji';
import TossEmoji from '../common/TossEmoji';
import { ASSET_CATEGORY_META } from '../../lib/category-meta';
import { useCreateAsset, useUpdateAsset, useUpsertSnapshot } from '../../queries/mutations';
import type { MockAsset } from '../../lib/mock-data';
import type { AssetCategory } from '../../types/api';

function formatNum(raw: string): string {
  const n = raw.replace(/[^0-9]/g, '');
  return n ? Number(n).toLocaleString() : '';
}

const CATEGORY_OPTIONS: { key: AssetCategory; label: string }[] = [
  { key: 'CASH',        label: '예적금' },
  { key: 'INVESTMENT',  label: '주식·ETF' },
  { key: 'CRYPTO',      label: '코인' },
  { key: 'REAL_ESTATE', label: '부동산' },
  { key: 'PENSION',     label: '연금' },
  { key: 'LIABILITY',   label: '부채' },
];

const CURRENCIES = ['USD', 'EUR', 'JPY', 'CNY'];

interface AddAssetSheetProps {
  visible: boolean;
  onClose: () => void;
  /** 지정 시 편집 모드 — 이름/카테고리/통화 수정 */
  editAsset?: MockAsset | null;
  /** 저장/수정 성공 콜백 (Toast 등) */
  onSaved?: (mode: 'create' | 'edit') => void;
}

export default function AddAssetSheet({ visible, onClose, editAsset, onSaved }: AddAssetSheetProps) {
  const theme = useTheme();
  const isEdit = !!editAsset;
  const [step, setStep] = useState<1 | 2>(1);
  const [assetName, setAssetName] = useState('');
  const [category, setCategory] = useState<AssetCategory | null>(null);
  const [amount, setAmount] = useState('');
  const [isFx, setIsFx] = useState(false);
  const [currency, setCurrency] = useState('USD');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const createAsset = useCreateAsset();
  const updateAsset = useUpdateAsset();
  const upsertSnapshot = useUpsertSnapshot();

  // 편집 모드 진입 시 폼 프리필
  React.useEffect(() => {
    if (visible && editAsset) {
      setAssetName(editAsset.name);
      setCategory(editAsset.category);
      const fx = editAsset.currency !== 'KRW';
      setIsFx(fx);
      setCurrency(fx ? editAsset.currency : 'USD');
      setStep(1);
    }
  }, [visible, editAsset]);

  const isLiability = category === 'LIABILITY';
  const amtNum = Number(amount.replace(/[^0-9]/g, ''));
  const step1Valid = assetName.trim().length > 0 && category !== null;
  const isPending = createAsset.isPending || updateAsset.isPending || upsertSnapshot.isPending;

  function reset() {
    setStep(1); setAssetName(''); setCategory(null);
    setAmount(''); setIsFx(false); setCurrency('USD'); setError('');
  }

  function handleClose() { reset(); onClose(); }

  async function handleEditSave() {
    setError('');
    try {
      await updateAsset.mutateAsync({
        id: Number(editAsset!.id),
        dto: { name: assetName.trim(), category: category!, currency: isFx ? currency : 'KRW' },
      });
      reset();
      onClose();
      onSaved?.('edit');
    } catch (e: any) {
      setError(e?.message ?? '수정에 실패했어요. 다시 시도해 주세요.');
    }
  }

  async function handleSave(skipAmount = false) {
    setError('');
    const today = new Date().toISOString().split('T')[0]!;
    try {
      const newAsset = await createAsset.mutateAsync({
        name: assetName.trim(),
        category: category!,
        currency: isFx ? currency : 'KRW',
        isLiability,
      });
      const valueToSave = skipAmount ? 0 : amtNum;
      if (valueToSave > 0) {
        await upsertSnapshot.mutateAsync({
          assetId: newAsset.id,
          dto: { date: today, value: valueToSave },
        });
      }
      setSaved(true);
      setTimeout(() => { setSaved(false); reset(); onClose(); onSaved?.('create'); }, 700);
    } catch (e: any) {
      setError(e?.message ?? '저장에 실패했어요. 다시 시도해 주세요.');
    }
  }

  const headerTitle = isEdit ? '자산 수정' : `자산 추가 · ${step}/2`;

  if (saved) {
    return (
      <SheetModal visible={visible} onClose={handleClose}>
        <View style={styles.confirmBox}>
          <TossEmoji code={TE.check} size={64} />
          <Text style={[styles.confirmTitle, { color: theme.text }]}>자산이 추가됐어요!</Text>
          <Text style={[styles.confirmSub, { color: theme.textMuted }]}>스냅샷을 입력하면 순자산에 반영돼요</Text>
        </View>
      </SheetModal>
    );
  }

  if (step === 1) {
    return (
      <SheetModal
        visible={visible}
        onClose={handleClose}
        header={headerTitle}
        cta={
          <View style={styles.cta}>
            {isEdit && error ? <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text> : null}
            {isEdit ? (
              <Button display="full" size="big" type="primary" disabled={!step1Valid} loading={isPending} onPress={handleEditSave}>
                수정하기
              </Button>
            ) : (
              <Button display="full" size="big" type="primary" disabled={!step1Valid} onPress={() => setStep(2)}>
                다음
              </Button>
            )}
          </View>
        }
      >
        <View style={styles.body}>
          <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>자산 이름</Text>
          <TextField
            variant="line"
            placeholder="예: 토스뱅크 파킹통장"
            value={assetName}
            onChangeText={setAssetName}
          />
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
                      borderColor: selected ? (isLiab ? theme.danger : theme.brand) : theme.border,
                      backgroundColor: selected ? (isLiab ? 'rgba(240,68,82,0.10)' : theme.brandSoft) : theme.bg,
                    },
                  ]}
                  onPress={() => setCategory(opt.key)}
                >
                  <TossEmoji code={ASSET_CATEGORY_META[opt.key].iconCode} size={20} />
                  <Text style={[styles.categoryCellText, { color: selected ? (isLiab ? theme.danger : theme.brand) : theme.text }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </SheetModal>
    );
  }

  return (
    <SheetModal
      visible={visible}
      onClose={handleClose}
      header={headerTitle}
      cta={
        <View style={styles.cta}>
          {error ? <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text> : null}
          <Button display="full" size="big" type="primary" disabled={amtNum === 0} loading={isPending} onPress={() => handleSave(false)}>
            저장하기
          </Button>
        </View>
      }
    >
      <View style={styles.body}>
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

        <ListRow
          contents="외화 자산이에요"
          right={<Switch checked={isFx} onCheckedChange={(v) => { setIsFx(v); if (!v) setCurrency('USD'); }} />}
          verticalPadding="small"
        />

        {isFx && (
          <View style={styles.currencyRow}>
            {CURRENCIES.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.currencyChip, { backgroundColor: currency === c ? theme.brand : theme.bg, borderColor: currency === c ? theme.brand : theme.border }]}
                onPress={() => setCurrency(c)}
              >
                <Text style={[styles.currencyChipText, { color: currency === c ? '#fff' : theme.text }]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity onPress={() => handleSave(true)} disabled={isPending} style={styles.skipBtn}>
          <Text style={[styles.skipText, { color: theme.textMuted }]}>건너뛰기 (나중에 입력)</Text>
        </TouchableOpacity>
      </View>
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 12 },
  fieldLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  categoryCell: { width: '47%', paddingVertical: 16, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  categoryCellText: { fontSize: 14, fontWeight: '700' },
  amountWrap: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', marginTop: 16, marginBottom: 20 },
  amountInput: { fontSize: 36, fontWeight: '800', textAlign: 'center', minWidth: 80, letterSpacing: -1 },
  amountUnit: { fontSize: 20, fontWeight: '700', marginLeft: 6 },
  currencyRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  currencyChip: { paddingVertical: 8, paddingHorizontal: 18, borderRadius: 20, borderWidth: 1 },
  currencyChipText: { fontSize: 14, fontWeight: '700' },
  skipBtn: { alignItems: 'center', paddingVertical: 12 },
  skipText: { fontSize: 14, textDecorationLine: 'underline' },
  cta: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 },
  confirmBox: { paddingVertical: 60, alignItems: 'center', gap: 12 },
  confirmTitle: { fontSize: 22, fontWeight: '800' },
  confirmSub: { fontSize: 14 },
  errorText: { fontSize: 13, textAlign: 'center', marginTop: 8 },
});
