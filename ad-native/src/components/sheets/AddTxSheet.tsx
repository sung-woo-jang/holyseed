import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Button from '../ui/Button';
import TextFieldBig from '../ui/TextFieldBig';
import ListRow from '../ui/ListRow';
import Segmented from '../common/Segmented';
import SheetModal from './SheetModal';
import { useTheme } from '../../lib/theme';
import { useHouseholdData, type HouseholdTransaction } from '../../queries/useHouseholdData';
import CategoryIcon from '../common/CategoryIcon';
import FormRow from '../common/FormRow';
import DatePicker from '../common/DatePicker';
import PickerOverlay from './PickerOverlay';
import { CATEGORY_DEFS, getCategoryDef } from '../../lib/category-meta';
import { Icon } from '../common/Icon';
import { useCreateTx, useUpdateTx } from '../../queries/mutations';
import { todayLocal } from '../../lib/date';
import { getErrorMessage } from '../../lib/error';

type TxType = 'EXPENSE' | 'INCOME';

function formatNum(raw: string): string {
  const n = raw.replace(/[^0-9]/g, '');
  return n ? Number(n).toLocaleString() : '';
}

interface AddTxSheetProps {
  visible: boolean;
  onClose: () => void;
  date?: string;
  editTx?: HouseholdTransaction;
  onSaved?: (mode: 'create' | 'edit') => void;
}

export default function AddTxSheet({ visible, onClose, date, editTx, onSaved }: AddTxSheetProps) {
  const theme = useTheme();
  const data = useHouseholdData();
  const isEdit = !!editTx;
  const [type, setType] = useState<TxType>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<{ id: number; name: string } | null>(null);
  const [title, setTitle] = useState('');
  const [memo, setMemo] = useState('');
  const [txDate, setTxDate] = useState<string>('');
  const [catPicker, setCatPicker] = useState(false);
  const [expandedCatId, setExpandedCatId] = useState<number | null>(null);
  const [datePicker, setDatePicker] = useState(false);
  const [error, setError] = useState('');
  const createTx = useCreateTx();
  const updateTx = useUpdateTx();

  useEffect(() => {
    if (!visible) return;
    if (editTx) {
      setType(editTx.type === 'INCOME' ? 'INCOME' : 'EXPENSE');
      setAmount(formatNum(String(editTx.amount)));
      const c = data.categories.find((x) => x.name === editTx.category);
      setCategory({ id: c?.id ?? 0, name: editTx.category });
      setTitle(editTx.rawTitle ?? '');
      setMemo(editTx.memo ?? '');
      setTxDate(editTx.date);
      setError('');
    } else {
      reset();
      setTxDate(date ?? todayLocal());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, editTx]);

  const catOptions = Object.entries(CATEGORY_DEFS)
    .filter(([, def]) => def.type === type)
    .map(([name]) => name);

  const rawAmount = Number(amount.replace(/[^0-9]/g, ''));
  const isValid = rawAmount > 0;

  function reset() {
    setType('EXPENSE');
    setAmount('');
    setCategory(null);
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
          dto: { date: txDate, type, amount: rawAmount, ...(category && category.id > 0 ? { categoryId: category.id } : {}), title, memo },
        });
        onClose();
        onSaved?.('edit');
        return;
      }
      await createTx.mutateAsync({ date: txDate, type, amount: rawAmount, ...(category ? { categoryId: category.id } : {}), title, memo });
      reset();
      onClose();
      onSaved?.('create');
    } catch (e: any) {
      setError(getErrorMessage(e, '저장에 실패했어요. 다시 시도해 주세요.'));
    }
  }

  const catListSource = data.categories.filter((c) => c.type === type && !c.parentId);
  const childrenOf = (id: number) => data.categories.filter((c) => c.parentId === id);

  return (
    <SheetModal
      visible={visible}
      onClose={onClose}
      header={isEdit ? '거래 수정' : '거래 추가'}
      cta={
        <>
          {error ? <Text style={{ color: theme.danger, fontSize: 12 }}>{error}</Text> : null}
          <Button display="full" size="big" type="primary" disabled={!isValid} loading={createTx.isPending || updateTx.isPending} onPress={handleSave}>
            {isEdit ? '수정하기' : '저장하기'}
          </Button>
        </>
      }
      overlay={
        <>
          <DatePicker visible={datePicker} value={txDate} maxDate={todayLocal()} onSelect={setTxDate} onClose={() => setDatePicker(false)} />
          <PickerOverlay visible={catPicker} title="카테고리 선택" onClose={() => setCatPicker(false)}>
            {catListSource.length > 0
              ? catListSource.map((c) => {
                  const def = getCategoryDef(c.name);
                  const kids = childrenOf(c.id);
                  const isExpanded = expandedCatId === c.id;
                  return (
                    <View key={c.id}>
                      <ListRow
                        left={<CategoryIcon icon={c.icon || def.iconCode} size={26} bg={(c.color || def.color) + '22'} />}
                        contents={<Text style={{ color: theme.text, fontSize: 15, fontWeight: '500' }}>{c.name}</Text>}
                        right={
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            {category?.id === c.id && Icon.check(theme.brand, 16)}
                            {kids.length > 0 && (
                              <Pressable
                                hitSlop={10}
                                onPress={() => setExpandedCatId(isExpanded ? null : c.id)}
                                style={({ pressed }) => [styles.expandBtn, { backgroundColor: pressed ? theme.border : 'transparent' }]}
                              >
                                <Text style={{ color: theme.textMuted, fontSize: 16 }}>{isExpanded ? '▴' : '▾'}</Text>
                              </Pressable>
                            )}
                          </View>
                        }
                        onPress={() => {
                          setCategory({ id: c.id, name: c.name });
                          setCatPicker(false);
                        }}
                        verticalPadding={6}
                      />
                      {isExpanded && (
                        <View style={[styles.childGroup, { borderColor: theme.border }]}>
                          {kids.map((k) => (
                            <ListRow
                              key={k.id}
                              left={<CategoryIcon icon={k.icon || c.icon || def.iconCode} size={20} bg={(c.color || def.color) + '22'} />}
                              contents={<Text style={{ color: theme.text, fontSize: 13.5, fontWeight: '500' }}>{k.name}</Text>}
                              right={category?.id === k.id ? Icon.check(theme.brand, 16) : undefined}
                              onPress={() => {
                                setCategory({ id: k.id, name: k.name });
                                setCatPicker(false);
                              }}
                              verticalPadding={4}
                            />
                          ))}
                        </View>
                      )}
                    </View>
                  );
                })
              : catOptions.map((name) => {
                  const def = getCategoryDef(name);
                  return (
                    <ListRow
                      key={name}
                      left={<CategoryIcon icon={def.iconCode} size={28} bg={def.color + '22'} />}
                      contents={<Text style={{ color: theme.text, fontSize: 15, fontWeight: '500' }}>{name}</Text>}
                      right={category?.name === name ? Icon.check(theme.brand, 16) : undefined}
                      onPress={() => {
                        setCategory({ id: 0, name });
                        setCatPicker(false);
                      }}
                      verticalPadding="small"
                    />
                  );
                })}
          </PickerOverlay>
        </>
      }
    >
      <View style={styles.segWrap}>
        <Segmented
          options={['지출', '수입']}
          value={type === 'EXPENSE' ? '지출' : '수입'}
          onChange={(v) => {
            setType(v === '지출' ? 'EXPENSE' : 'INCOME');
            setCategory(null);
            setExpandedCatId(null);
          }}
        />
      </View>

      <View style={styles.amountWrap}>
        <TextFieldBig placeholder="0" keyboardType="numeric" value={amount} onChangeText={(t) => setAmount(formatNum(t))} suffix="원" />
      </View>

      <View style={[styles.fieldsCard, { borderColor: theme.border }]}>
        <FormRow label="날짜" value={txDate === todayLocal() ? `오늘 (${txDate.slice(5).replace('-', '/')})` : txDate} onPress={() => setDatePicker(true)} />
        <FormRow label="카테고리" value={category?.name || ''} onPress={() => setCatPicker(true)} />
      </View>

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
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  segWrap: { marginBottom: 16 },
  amountWrap: { marginBottom: 20 },
  fieldsCard: { borderWidth: 1, borderRadius: 12, marginBottom: 12, overflow: 'hidden' },
  titleInput: { height: 44, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, fontSize: 14, marginBottom: 8 },
  memoInput: { minHeight: 72, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingTop: 10, fontSize: 14, textAlignVertical: 'top' },
  expandBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  childGroup: { marginLeft: 32, paddingLeft: 12, borderLeftWidth: 2, marginBottom: 4 },
});
