import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button, TextFieldBig, ListRow, SegmentedControl } from '@toss/tds-react-native';
import SheetModal from './SheetModal';
import EmptyState from '../common/EmptyState';
import { useTheme } from '../../lib/theme';
import { useDataSource } from '../../lib/data-source';
import TossEmoji from '../common/TossEmoji';
import FormRow from '../common/FormRow';
import PickerOverlay from './PickerOverlay';
import { CATEGORY_DEFS, getCategoryDef } from '../../lib/category-meta';
import { TE } from '../../lib/toss-emoji';
import { Icon } from '../common/Icon';
import { krw } from '../../lib/format';
import { useCreateTx, useUpdateTx } from '../../queries/mutations';
import type { MockTransaction } from '../../lib/mock-data';

type TxType = 'EXPENSE' | 'INCOME';

const TYPE_OPTIONS: { key: TxType; label: string }[] = [
  { key: 'EXPENSE', label: '지출' },
  { key: 'INCOME', label: '수입' },
];

function formatNum(raw: string): string {
  const n = raw.replace(/[^0-9]/g, '');
  return n ? Number(n).toLocaleString() : '';
}

/** YYYY-MM-DD에 일수 가감 */
function shiftDay(dateStr: string, delta: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y!, (m! - 1), d! + delta);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

interface AddTxSheetProps {
  visible: boolean;
  onClose: () => void;
  /** 거래 날짜 프리필 (YYYY-MM-DD). 없으면 오늘 */
  date?: string;
  /** 지정 시 편집 모드 */
  editTx?: MockTransaction;
}

export default function AddTxSheet({ visible, onClose, date, editTx }: AddTxSheetProps) {
  const theme = useTheme();
  const data = useDataSource();
  const isEdit = !!editTx;
  const [type, setType] = useState<TxType>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<{ id: number; name: string } | null>(null);
  const [fromAsset, setFromAsset] = useState<{ id: string; name: string } | null>(null);
  const [toAsset, setToAsset] = useState<{ id: string; name: string } | null>(null);
  const [title, setTitle] = useState('');
  const [memo, setMemo] = useState('');
  const [txDate, setTxDate] = useState<string>(''); // YYYY-MM-DD (편집 시 표시·조정)
  const [catPicker, setCatPicker] = useState(false);
  const [fromPicker, setFromPicker] = useState(false);
  const [toPicker, setToPicker] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const createTx = useCreateTx();
  const updateTx = useUpdateTx();

  // 열릴 때 편집 프리필 / 신규 리셋
  useEffect(() => {
    if (!visible) return;
    if (editTx) {
      setType(editTx.type === 'INCOME' ? 'INCOME' : 'EXPENSE');
      setAmount(formatNum(String(editTx.amount)));
      const c = data.categories.find((x) => x.name === editTx.category);
      setCategory({ id: c?.id ?? 0, name: editTx.category });
      const fromA = editTx.from ? data.assets.find((a) => a.id === editTx.from) : undefined;
      const toA = editTx.to ? data.assets.find((a) => a.id === editTx.to) : undefined;
      setFromAsset(fromA ? { id: fromA.id, name: fromA.name } : null);
      setToAsset(toA ? { id: toA.id, name: toA.name } : null);
      setTitle('');
      setMemo(editTx.memo ?? editTx.title ?? '');
      setTxDate(editTx.date);
      setError('');
    } else {
      reset();
      setTxDate(date ?? new Date().toISOString().split('T')[0]!);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, editTx]);

  const catOptions = Object.entries(CATEGORY_DEFS)
    .filter(([, def]) => def.type === type)
    .map(([name]) => name);

  const assetOptions = data.assets.filter((a) => !a.isLiability);
  const rawAmount = Number(amount.replace(/[^0-9]/g, ''));
  const isValid = rawAmount > 0;

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
    try {
      if (isEdit && editTx) {
        await updateTx.mutateAsync({
          id: Number(editTx.id),
          dto: {
            date: txDate,
            type,
            amount: rawAmount,
            ...(category && category.id > 0 ? { categoryId: category.id } : {}),
            ...(type === 'EXPENSE' ? { fromAssetId: fromAsset ? Number(fromAsset.id) : undefined } : { toAssetId: toAsset ? Number(toAsset.id) : undefined }),
            memo: memo || title || undefined,
          },
        });
        onClose();
        return;
      }
      await createTx.mutateAsync({
        date: txDate,
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
      {saved ? (
        <SheetModal visible={visible} onClose={onClose}>
          <View style={styles.confirmBox}>
            <TossEmoji code={TE.check} size={64} />
            <Text style={[styles.confirmTitle, { color: theme.text }]}>저장 완료!</Text>
          </View>
        </SheetModal>
      ) : (
        <SheetModal
          visible={visible}
          onClose={onClose}
          header={isEdit ? '거래 수정' : '거래 추가'}
          cta={
            <View style={styles.cta}>
              {error ? <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text> : null}
              <Button display="full" size="big" type="primary" disabled={!isValid} loading={createTx.isPending || updateTx.isPending} onPress={handleSave}>
                {isEdit ? '수정하기' : '저장하기'}
              </Button>
            </View>
          }
          overlay={
            <>
              {/* 카테고리 피커 */}
              <PickerOverlay visible={catPicker} title="카테고리 선택" onClose={() => setCatPicker(false)}>
                {(data.categories.filter((c) => c.type === type).length > 0
                  ? data.categories.filter((c) => c.type === type)
                      .map((c) => {
                        const def = getCategoryDef(c.name);
                        return (
                          <ListRow
                            key={c.id}
                            left={<View style={{ marginRight: 12 }}><TossEmoji code={def.iconCode} size={28} bg={def.color + '22'} /></View>}
                            contents={<Text style={{ color: theme.text, fontSize: 15, fontWeight: "500" }}>{c.name}</Text>}
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
                          contents={<Text style={{ color: theme.text, fontSize: 15, fontWeight: "500" }}>{name}</Text>}
                          right={category?.name === name ? Icon.check(theme.brand, 16) : undefined}
                          onPress={() => { setCategory({ id: 0, name }); setCatPicker(false); }}
                          verticalPadding="small"
                        />
                      );
                    })
                )}
              </PickerOverlay>

              {/* 출금 자산 피커 */}
              <PickerOverlay visible={fromPicker} title="자산 선택" onClose={() => setFromPicker(false)}>
                {assetOptions.length === 0 ? (
                  <EmptyState compact iconCode={TE.piggy} title="선택할 자산이 없어요" desc="자산 탭에서 먼저 자산을 추가해주세요" />
                ) : assetOptions.map((a) => (
                  <ListRow
                    key={a.id}
                    contents={
                      <View>
                        <Text style={{ color: theme.text, fontSize: 15, fontWeight: "500" }}>{a.name}</Text>
                        <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 2 }}>잔액 {krw(a.value)}</Text>
                      </View>
                    }
                    right={fromAsset?.id === a.id ? Icon.check(theme.brand, 16) : undefined}
                    onPress={() => { setFromAsset({ id: a.id, name: a.name }); setFromPicker(false); }}
                    verticalPadding="small"
                  />
                ))}
              </PickerOverlay>

              {/* 입금 자산 피커 */}
              <PickerOverlay visible={toPicker} title="자산 선택" onClose={() => setToPicker(false)}>
                {assetOptions.length === 0 ? (
                  <EmptyState compact iconCode={TE.piggy} title="선택할 자산이 없어요" desc="자산 탭에서 먼저 자산을 추가해주세요" />
                ) : assetOptions.map((a) => (
                  <ListRow
                    key={a.id}
                    contents={<Text style={{ color: theme.text, fontSize: 15, fontWeight: "500" }}>{a.name}</Text>}
                    right={toAsset?.id === a.id ? Icon.check(theme.brand, 16) : undefined}
                    onPress={() => { setToAsset({ id: a.id, name: a.name }); setToPicker(false); }}
                    verticalPadding="small"
                  />
                ))}
              </PickerOverlay>
            </>
          }
        >
          <View style={styles.body}>
            {/* 타입 SegmentedControl */}
            <View style={styles.segWrap}>
              <SegmentedControl.Root
                value={type}
                onChange={(v) => { setType(v as TxType); setCategory(null); setFromAsset(null); setToAsset(null); }}
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
                style={styles.amountField}
              />
            </View>

            {/* 날짜 (편집 시 조정 가능) */}
            {isEdit && (
              <View style={[styles.dateRow, { borderColor: theme.border }]}>
                <Text style={[styles.dateLabel, { color: theme.text }]}>날짜</Text>
                <View style={styles.dateCtrl}>
                  <TouchableOpacity onPress={() => setTxDate(shiftDay(txDate, -1))} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Text style={[styles.dateArrow, { color: theme.brand }]}>‹</Text>
                  </TouchableOpacity>
                  <Text style={[styles.dateValue, { color: theme.text }]}>{txDate}</Text>
                  <TouchableOpacity onPress={() => setTxDate(shiftDay(txDate, 1))} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Text style={[styles.dateArrow, { color: theme.brand }]}>›</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* 카테고리 / 자산 (모두 선택사항 — 흐름 기록용) */}
            <View style={[styles.fieldsCard, { borderColor: theme.border }]}>
              <FormRow label="카테고리" value={category?.name || ''} onPress={() => setCatPicker(true)} />
              {type === 'EXPENSE' ? (
                <FormRow label="출금 자산" value={fromAsset?.name || ''} onPress={() => setFromPicker(true)} />
              ) : (
                <FormRow label="입금 자산" value={toAsset?.name || ''} onPress={() => setToPicker(true)} />
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
          </View>
        </SheetModal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  confirmBox: { paddingVertical: 60, alignItems: 'center', gap: 12 },
  confirmTitle: { fontSize: 22, fontWeight: '800' },
  body: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 12 },
  segWrap: { marginBottom: 20 },
  amountWrap: { alignItems: 'center', marginBottom: 20 },
  amountField: { width: '100%' },
  fieldsCard: { borderRadius: 14, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 12 },
  dateLabel: { fontSize: 14, fontWeight: '500' },
  dateCtrl: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  dateArrow: { fontSize: 20, fontWeight: '700' },
  dateValue: { fontSize: 14, fontWeight: '700' },
  titleInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, marginBottom: 8 },
  memoInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, textAlignVertical: 'top' },
  cta: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 },
  errorText: { fontSize: 13, textAlign: 'center', marginBottom: 8 },
});
