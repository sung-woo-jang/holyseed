import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ParamListBase } from '@react-navigation/native';
import Button from '../components/ui/Button';
import TextFieldBig from '../components/ui/TextFieldBig';
import Segmented from '../components/common/Segmented';
import ConfirmDialog from '../components/common/ConfirmDialog';
import CategoryIcon from '../components/common/CategoryIcon';
import FormRow from '../components/common/FormRow';
import DatePicker from '../components/common/DatePicker';
import PickerOverlay from '../components/sheets/PickerOverlay';
import { useTheme } from '../lib/theme';
import { useHouseholdData } from '../queries/useHouseholdData';
import { CATEGORY_DEFS, getCategoryDef, resolveCostType, resolveCategoryVisual } from '../lib/category-meta';
import { useKeyboardScrollRegistration, KeyboardScrollProvider } from '../lib/keyboard-scroll';
import type { CostType } from '../types/api';
import { Icon } from '../components/common/Icon';
import { useCreateTx, useUpdateTx, useDeleteTx } from '../queries/mutations';
import { todayLocal } from '../lib/date';
import { getErrorMessage } from '../lib/error';
import type { TransactionEditParams } from '../navigation/types';

type TxType = 'EXPENSE' | 'INCOME';

interface Props {
  navigation: NativeStackNavigationProp<ParamListBase>;
  route: { params: TransactionEditParams };
}

function formatNum(raw: string): string {
  const n = raw.replace(/[^0-9]/g, '');
  return n ? Number(n).toLocaleString() : '';
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={styles.sectionPad}>
      <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>{label}</Text>
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>{children}</View>
    </View>
  );
}

export default function TransactionEditScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const data = useHouseholdData();
  const params = route.params;
  const mode = params.mode;
  const editTx = params.mode === 'edit' ? data.transactions.find((t) => t.id === params.txId) : undefined;
  const isEdit = mode === 'edit';

  const [type, setType] = useState<TxType>(editTx?.type === 'INCOME' ? 'INCOME' : 'EXPENSE');
  const [amount, setAmount] = useState(editTx ? formatNum(String(editTx.amount)) : '');
  const [category, setCategory] = useState<{ id: number; name: string } | null>(() => {
    if (!editTx) return null;
    const c = data.categories.find((x) => x.name === editTx.category);
    return { id: c?.id ?? 0, name: editTx.category };
  });
  const [costType, setCostType] = useState<CostType | null>(editTx ? (editTx.costType ?? resolveCostType(editTx.categoryId, data.categories)) : null);
  const [title, setTitle] = useState(editTx?.rawTitle ?? '');
  const [memo, setMemo] = useState(editTx?.memo ?? '');
  const [txDate, setTxDate] = useState(editTx?.date ?? (params.mode === 'add' ? (params.date ?? todayLocal()) : todayLocal()));
  const [catPicker, setCatPicker] = useState(false);
  const [chipParentId, setChipParentId] = useState<number | null>(null);
  const [datePicker, setDatePicker] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [error, setError] = useState('');
  const createTx = useCreateTx();
  const updateTx = useUpdateTx();
  const deleteTx = useDeleteTx();
  const titleRef = useRef<TextInput>(null);
  const memoRef = useRef<TextInput>(null);
  const { scrollRef, scrollToInput, onScroll, keyboardHeight } = useKeyboardScrollRegistration();

  useEffect(() => {
    navigation.setOptions({ title: isEdit ? '거래 수정' : '거래 추가' });
  }, [navigation, isEdit]);

  const catOptions = Object.entries(CATEGORY_DEFS)
    .filter(([, def]) => def.type === type)
    .map(([name]) => name);

  const rawAmount = Number(amount.replace(/[^0-9]/g, ''));
  const isValid = rawAmount > 0;
  const visual = resolveCategoryVisual(category?.id ?? null, category?.name ?? '', data.categories);

  function openCatPicker() {
    const cur = category ? data.categories.find((x) => x.id === category.id) : undefined;
    setChipParentId(cur ? (cur.parentId ?? cur.id) : null);
    setCatPicker(true);
  }

  function selectTopLevel(c: { id: number; name: string }) {
    const kids = childrenOf(c.id);
    setCategory({ id: c.id, name: c.name });
    setCostType(resolveCostType(c.id, data.categories));
    if (kids.length > 0) {
      setChipParentId(c.id);
    } else {
      setCatPicker(false);
    }
  }

  function selectChip(id: number, name: string) {
    setCategory({ id, name });
    setCostType(resolveCostType(id, data.categories));
    setCatPicker(false);
  }

  async function handleSave() {
    if (!isValid) return;
    setError('');
    try {
      const costTypeDto = type === 'EXPENSE' && costType ? { costType } : {};
      if (isEdit && editTx) {
        await updateTx.mutateAsync({
          id: Number(editTx.id),
          dto: { date: txDate, type, amount: rawAmount, ...(category && category.id > 0 ? { categoryId: category.id } : {}), title, memo, ...costTypeDto },
        });
      } else {
        await createTx.mutateAsync({ date: txDate, type, amount: rawAmount, ...(category ? { categoryId: category.id } : {}), title, memo, ...costTypeDto });
      }
      navigation.navigate(route.params.returnTo, { savedMode: isEdit ? 'edit' : 'create', savedAt: Date.now() });
    } catch (e) {
      setError(getErrorMessage(e, '저장에 실패했어요. 다시 시도해 주세요.'));
    }
  }

  async function handleDelete() {
    if (!editTx) return;
    try {
      await deleteTx.mutateAsync(Number(editTx.id));
      navigation.navigate(route.params.returnTo, { savedMode: 'delete', savedAt: Date.now() });
    } catch {
      setDeleteConfirm(false);
      setError('삭제에 실패했어요');
    }
  }

  const catListSource = data.categories.filter((c) => c.type === type && !c.parentId);
  const childrenOf = (id: number) => data.categories.filter((c) => c.parentId === id);

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView ref={scrollRef} contentContainerStyle={{ paddingBottom: 32 + keyboardHeight }} onScroll={onScroll} scrollEventThrottle={16}>
          <KeyboardScrollProvider value={scrollToInput}>
            <View style={styles.hero}>
              <View style={[styles.heroIcon, { backgroundColor: visual.color + '22' }]}>
                <CategoryIcon icon={visual.icon} size={30} />
              </View>
              <TextFieldBig placeholder="0" keyboardType="numeric" value={amount} onChangeText={(t) => setAmount(formatNum(t))} suffix="원" />
              <View style={styles.heroSeg}>
                <Segmented
                  options={['지출', '수입']}
                  value={type === 'EXPENSE' ? '지출' : '수입'}
                  onChange={(v) => {
                    setType(v === '지출' ? 'EXPENSE' : 'INCOME');
                    setCategory(null);
                    setCostType(null);
                    setChipParentId(null);
                  }}
                  small
                />
              </View>
            </View>

            <Section label="분류">
              <FormRow label="날짜" value={txDate === todayLocal() ? `오늘 (${txDate.slice(5).replace('-', '/')})` : txDate} onPress={() => setDatePicker(true)} />
              <View style={[styles.rowDivider, { backgroundColor: theme.border }]} />
              <FormRow label="카테고리" value={category?.name || ''} onPress={openCatPicker} />
              {type === 'EXPENSE' && (
                <View style={[styles.costBlock, { borderTopColor: theme.border }]}>
                  <Segmented
                    options={['고정비', '변동비']}
                    value={costType === 'VARIABLE' ? '변동비' : '고정비'}
                    onChange={(v) => setCostType(v === '변동비' ? 'VARIABLE' : 'FIXED')}
                    small
                  />
                  <Text style={[styles.costHint, { color: theme.textMuted }]}>
                    카테고리 기본값에서 자동으로 채워져요. 이 거래만 다르게 바꿔도 카테고리 기본값은 그대로예요.
                  </Text>
                </View>
              )}
            </Section>

            <Section label="상세 정보">
              <View style={styles.detailBlock}>
                <TextInput
                  ref={titleRef}
                  style={[styles.titleInput, { borderColor: theme.border, color: theme.text, backgroundColor: theme.bg }]}
                  placeholder="제목 (선택)"
                  placeholderTextColor={theme.textMuted}
                  value={title}
                  onChangeText={setTitle}
                  onFocus={() => scrollToInput?.(titleRef.current)}
                />
                <TextInput
                  ref={memoRef}
                  style={[styles.memoInput, { borderColor: theme.border, color: theme.text, backgroundColor: theme.bg }]}
                  placeholder="메모 (선택)"
                  placeholderTextColor={theme.textMuted}
                  multiline
                  numberOfLines={3}
                  value={memo}
                  onChangeText={setMemo}
                  onFocus={() => scrollToInput?.(memoRef.current)}
                />
              </View>
            </Section>

            {isEdit && (
              <Pressable onPress={() => setDeleteConfirm(true)} style={{ paddingVertical: 16, alignItems: 'center' }}>
                <Text style={{ color: theme.danger, fontSize: 13, fontWeight: '700' }}>거래 삭제</Text>
              </Pressable>
            )}
          </KeyboardScrollProvider>
        </ScrollView>

        <View style={[styles.ctaWrap, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
          {error ? <Text style={{ color: theme.danger, fontSize: 12, marginBottom: 8, textAlign: 'center' }}>{error}</Text> : null}
          <Button display="full" size="big" type="primary" disabled={!isValid} loading={createTx.isPending || updateTx.isPending} onPress={handleSave}>
            {isEdit ? '수정하기' : '저장하기'}
          </Button>
        </View>
      </KeyboardAvoidingView>

      <DatePicker visible={datePicker} value={txDate} maxDate={todayLocal()} onSelect={setTxDate} onClose={() => setDatePicker(false)} />
      <PickerOverlay visible={catPicker} title="카테고리 선택" onClose={() => setCatPicker(false)}>
        {catListSource.length > 0 ? (
          <>
            <View style={styles.pickerGrid}>
              {catListSource.map((c) => {
                const def = getCategoryDef(c.name);
                const kids = childrenOf(c.id);
                const ringed = category?.id === c.id || chipParentId === c.id;
                return (
                  <Pressable key={c.id} style={styles.pickerCell} onPress={() => selectTopLevel(c)}>
                    <View
                      style={[
                        styles.pickerCellIcon,
                        { backgroundColor: (c.color || def.color) + '22' },
                        ringed && { borderWidth: 2, borderColor: theme.brand },
                      ]}
                    >
                      <CategoryIcon icon={c.icon || def.iconCode} size={26} />
                      {category?.id === c.id && (
                        <View style={[styles.pickerBadge, { backgroundColor: theme.brand, borderColor: theme.card }]}>{Icon.check('#fff', 9)}</View>
                      )}
                    </View>
                    <Text style={[styles.pickerCellName, { color: theme.text }]} numberOfLines={1}>
                      {c.name}
                    </Text>
                    {kids.length > 0 && <Text style={[styles.pickerCellSub, { color: theme.textMuted }]}>{kids.length}개</Text>}
                  </Pressable>
                );
              })}
            </View>

            {chipParentId != null &&
              (() => {
                const parent = data.categories.find((x) => x.id === chipParentId);
                const kids = childrenOf(chipParentId);
                if (!parent || kids.length === 0) return null;
                return (
                  <View style={[styles.chipPanel, { borderTopColor: theme.border }]}>
                    <View style={styles.chipPanelLabelRow}>
                      {Icon.chevronRight(theme.textMuted, 12)}
                      <Text style={[styles.chipPanelLabel, { color: theme.textMuted }]}>{parent.name}의 세부 카테고리</Text>
                    </View>
                    <View style={styles.chipRow}>
                      <Pressable
                        onPress={() => selectChip(parent.id, parent.name)}
                        style={[
                          styles.chip,
                          { borderColor: theme.border, backgroundColor: theme.card },
                          category?.id === parent.id && { backgroundColor: theme.brand, borderColor: theme.brand },
                        ]}
                      >
                        <Text style={[styles.chipText, { color: theme.textMuted }, category?.id === parent.id && { color: '#fff' }]}>전체</Text>
                      </Pressable>
                      {kids.map((k) => (
                        <Pressable
                          key={k.id}
                          onPress={() => selectChip(k.id, k.name)}
                          style={[
                            styles.chip,
                            { borderColor: theme.border, backgroundColor: theme.card },
                            category?.id === k.id && { backgroundColor: theme.brand, borderColor: theme.brand },
                          ]}
                        >
                          <Text style={[styles.chipText, { color: theme.textMuted }, category?.id === k.id && { color: '#fff' }]}>{k.name}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                );
              })()}
          </>
        ) : (
          <View style={styles.pickerGrid}>
            {catOptions.map((name) => {
              const def = getCategoryDef(name);
              const selected = category?.name === name;
              return (
                <Pressable
                  key={name}
                  style={styles.pickerCell}
                  onPress={() => {
                    setCategory({ id: 0, name });
                    setCostType(null);
                    setCatPicker(false);
                  }}
                >
                  <View style={[styles.pickerCellIcon, { backgroundColor: def.color + '22' }, selected && { borderWidth: 2, borderColor: theme.brand }]}>
                    <CategoryIcon icon={def.iconCode} size={26} />
                  </View>
                  <Text style={[styles.pickerCellName, { color: theme.text }]} numberOfLines={1}>
                    {name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </PickerOverlay>

      <ConfirmDialog
        visible={deleteConfirm}
        title="거래를 삭제할까요?"
        confirmText="삭제하기"
        danger
        loading={deleteTx.isPending}
        onConfirm={handleDelete}
        onClose={() => setDeleteConfirm(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hero: { alignItems: 'center', paddingTop: 20, paddingBottom: 8 },
  heroIcon: { width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  heroSeg: { width: 160, marginTop: 14 },
  sectionPad: { paddingHorizontal: 20, paddingTop: 18 },
  sectionLabel: { fontSize: 11.5, fontWeight: '800', letterSpacing: 0.3, textTransform: 'uppercase', marginBottom: 8, marginLeft: 2 },
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  rowDivider: { height: 1 },
  costBlock: { borderTopWidth: 1, padding: 14 },
  costHint: { fontSize: 10.5, marginTop: 8, lineHeight: 15 },
  detailBlock: { padding: 14 },
  titleInput: { height: 44, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, fontSize: 14, marginBottom: 10 },
  memoInput: { minHeight: 72, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingTop: 10, fontSize: 14, textAlignVertical: 'top' },
  ctaWrap: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20, borderTopWidth: 1 },
  pickerGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingTop: 4, paddingBottom: 8 },
  pickerCell: { width: '25%', alignItems: 'center', paddingVertical: 10, gap: 5 },
  pickerCellIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  pickerBadge: { position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  pickerCellName: { fontSize: 12, fontWeight: '600', maxWidth: 68, textAlign: 'center' },
  pickerCellSub: { fontSize: 9.5 },
  chipPanel: { borderTopWidth: 1, marginTop: 6, paddingTop: 14, paddingBottom: 4 },
  chipPanelLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  chipPanelLabel: { fontSize: 11.5, fontWeight: '700' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1.5 },
  chipText: { fontSize: 12.5, fontWeight: '700' },
});
