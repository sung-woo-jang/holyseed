import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Button from '../ui/Button';
import ListRow from '../ui/ListRow';
import Switch from '../ui/Switch';
import TextFieldBig from '../ui/TextFieldBig';
import TextField from '../ui/TextField';
import Segmented from '../common/Segmented';
import SheetModal from './SheetModal';
import { useTheme } from '../../lib/theme';
import { useHouseholdData, type HouseholdRecurring } from '../../queries/useHouseholdData';
import TossEmoji from '../common/TossEmoji';
import CategoryIcon from '../common/CategoryIcon';
import FormRow from '../common/FormRow';
import PickerOverlay from './PickerOverlay';
import { CATEGORY_DEFS, getCategoryDef } from '../../lib/category-meta';
import { TE } from '../../lib/toss-emoji';
import { Icon } from '../common/Icon';
import { krw } from '../../lib/format';
import { useCreateRecurring, useUpdateRecurring } from '../../queries/mutations';
import { todayLocal } from '../../lib/date';
import { getErrorMessage } from '../../lib/error';

function formatNum(raw: string): string {
  const n = raw.replace(/[^0-9]/g, '');
  return n ? Number(n).toLocaleString() : '';
}

interface AddRecurringSheetProps {
  visible: boolean;
  onClose: () => void;
  editRec?: HouseholdRecurring;
  onSaved?: (mode: 'create' | 'edit') => void;
}

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

type RecType = 'EXPENSE' | 'INCOME';

export default function AddRecurringSheet({ visible, onClose, editRec, onSaved }: AddRecurringSheetProps) {
  const theme = useTheme();
  const data = useHouseholdData();
  const isEdit = !!editRec;
  const [type, setType] = useState<RecType>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<{ id: number; name: string } | null>(null);
  const [dayOfMonth, setDayOfMonth] = useState(25);
  const [hasEnd, setHasEnd] = useState(false);
  const [endMonths, setEndMonths] = useState(12);
  const [catPicker, setCatPicker] = useState(false);
  const [expandedCatId, setExpandedCatId] = useState<number | null>(null);
  const [dayPicker, setDayPicker] = useState(false);
  const [endPicker, setEndPicker] = useState(false);
  const [error, setError] = useState('');
  const createRecurring = useCreateRecurring();
  const updateRecurring = useUpdateRecurring();

  useEffect(() => {
    if (!visible || !editRec) return;
    setType(editRec.type === 'INCOME' ? 'INCOME' : 'EXPENSE');
    setAmount(formatNum(String(editRec.amount)));
    setName(editRec.title);
    const c = data.categories.find((x) => x.name === editRec.category);
    setCategory(c ? { id: c.id, name: c.name } : { id: 0, name: editRec.category });
    setDayOfMonth(editRec.dayOfMonth);
    setHasEnd(!!editRec.endDate);
    setError('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, editRec]);

  const isIncome = type === 'INCOME';
  const localCategories = Object.entries(CATEGORY_DEFS)
    .filter(([, def]) => def.type === type)
    .map(([n]) => n);
  const apiCategories = data.categories.filter((c) => c.type === type && !c.parentId);
  const childrenOf = (id: number) => data.categories.filter((c) => c.parentId === id);
  const amtNum = Number(amount.replace(/[^0-9]/g, ''));
  const isValid = name.length > 0 && amtNum > 0;

  const today = new Date();
  const nextDate = new Date(today.getFullYear(), today.getMonth() + (today.getDate() >= dayOfMonth ? 1 : 0), dayOfMonth);
  const nextDateStr = `${nextDate.getFullYear()}년 ${nextDate.getMonth() + 1}월 ${nextDate.getDate()}일`;

  function computeEndDate(): string {
    const d = new Date(today.getFullYear(), today.getMonth() + endMonths, dayOfMonth);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  const endDateLabel = `${endMonths}개월 후 (~${computeEndDate().slice(0, 7)})`;

  function reset() {
    setType('EXPENSE');
    setAmount('');
    setName('');
    setCategory(null);
    setDayOfMonth(25);
    setHasEnd(false);
    setEndMonths(12);
    setError('');
  }

  async function handleSave() {
    setError('');
    const todayStr = todayLocal();
    try {
      if (isEdit && editRec) {
        await updateRecurring.mutateAsync({
          id: Number(editRec.id),
          dto: { title: name, type, amount: amtNum, dayOfMonth, ...(category && category.id > 0 ? { categoryId: category.id } : {}), ...(hasEnd ? { endDate: computeEndDate() } : {}) },
        });
        onClose();
        onSaved?.('edit');
        return;
      }
      await createRecurring.mutateAsync({
        title: name,
        type,
        amount: amtNum,
        ...(category && category.id > 0 ? { categoryId: category.id } : {}),
        frequency: 'MONTHLY',
        dayOfMonth,
        startDate: todayStr,
        ...(hasEnd ? { endDate: computeEndDate() } : {}),
      });
      reset();
      onClose();
      onSaved?.('create');
    } catch (e: any) {
      setError(getErrorMessage(e, '저장에 실패했어요. 다시 시도해 주세요.'));
    }
  }

  return (
    <SheetModal
      visible={visible}
      onClose={onClose}
      header={isEdit ? '정기 항목 수정' : isIncome ? '정기수입 추가' : '정기지출 추가'}
      cta={
        <>
          {error ? <Text style={{ color: theme.danger, fontSize: 12 }}>{error}</Text> : null}
          <Button display="full" size="big" type="primary" disabled={!isValid} loading={createRecurring.isPending || updateRecurring.isPending} onPress={handleSave}>
            {isEdit ? '수정하기' : '저장하기'}
          </Button>
        </>
      }
      overlay={
        <>
          <PickerOverlay visible={catPicker} title="카테고리 선택" onClose={() => setCatPicker(false)}>
            {apiCategories.length > 0
              ? apiCategories.map((c) => {
                  const def = getCategoryDef(c.name);
                  const kids = childrenOf(c.id);
                  const isExpanded = expandedCatId === c.id;
                  return (
                    <View key={c.id}>
                      <ListRow
                        left={<CategoryIcon icon={c.icon || def.iconCode} size={28} bg={(c.color || def.color) + '22'} />}
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
                        verticalPadding="small"
                      />
                      {isExpanded &&
                        kids.map((k) => (
                          <ListRow
                            key={k.id}
                            left={<CategoryIcon icon={k.icon || c.icon || def.iconCode} size={22} bg={(c.color || def.color) + '22'} />}
                            contents={<Text style={{ color: theme.text, fontSize: 14, fontWeight: '500', marginLeft: 12 }}>{k.name}</Text>}
                            right={category?.id === k.id ? Icon.check(theme.brand, 16) : undefined}
                            onPress={() => {
                              setCategory({ id: k.id, name: k.name });
                              setCatPicker(false);
                            }}
                            verticalPadding="small"
                          />
                        ))}
                    </View>
                  );
                })
              : localCategories.map((n) => {
                  const def = getCategoryDef(n);
                  return (
                    <ListRow
                      key={n}
                      left={<CategoryIcon icon={def.iconCode} size={28} bg={def.color + '22'} />}
                      contents={<Text style={{ color: theme.text, fontSize: 15, fontWeight: '500' }}>{n}</Text>}
                      right={category?.name === n ? Icon.check(theme.brand, 16) : undefined}
                      onPress={() => {
                        setCategory({ id: 0, name: n });
                        setCatPicker(false);
                      }}
                      verticalPadding="small"
                    />
                  );
                })}
          </PickerOverlay>

          <PickerOverlay visible={dayPicker} title="결제일 선택" onClose={() => setDayPicker(false)}>
            <View style={styles.dayGrid}>
              {DAYS.map((d) => (
                <Pressable
                  key={d}
                  style={[styles.dayCell, { backgroundColor: dayOfMonth === d ? theme.brand : theme.bg, borderColor: theme.border }]}
                  onPress={() => {
                    setDayOfMonth(d);
                    setDayPicker(false);
                  }}
                >
                  <Text style={{ color: dayOfMonth === d ? '#fff' : theme.text, fontSize: 13, fontWeight: '600' }}>{d}</Text>
                </Pressable>
              ))}
            </View>
          </PickerOverlay>

          <PickerOverlay visible={endPicker} title="종료 시점" onClose={() => setEndPicker(false)}>
            {[3, 6, 12, 24, 36].map((mo) => (
              <ListRow
                key={mo}
                contents={<Text style={{ color: theme.text, fontSize: 15, fontWeight: '500' }}>{mo}개월 후</Text>}
                right={endMonths === mo ? Icon.check(theme.brand, 16) : undefined}
                onPress={() => {
                  setEndMonths(mo);
                  setEndPicker(false);
                }}
                verticalPadding="small"
              />
            ))}
          </PickerOverlay>
        </>
      }
    >
      <View style={styles.segWrap}>
        <Segmented
          options={['지출', '수입']}
          value={isIncome ? '수입' : '지출'}
          onChange={(v) => {
            setType(v === '지출' ? 'EXPENSE' : 'INCOME');
            setCategory(null);
            setExpandedCatId(null);
          }}
        />
      </View>

      <View style={[styles.infoBox, { backgroundColor: theme.brandSoft }]}>
        <TossEmoji code={TE.repeat} size={20} />
        <Text style={[styles.infoText, { color: theme.brand }]}>{isIncome ? '매월 같은 날 자동으로 들어오는 수입을 등록해요' : '매월 같은 날 자동으로 나가는 지출을 등록해요'}</Text>
      </View>

      <View style={styles.amountWrap}>
        <TextFieldBig placeholder="0" keyboardType="numeric" value={amount} onChangeText={(t) => setAmount(formatNum(t))} suffix="원" />
      </View>

      <TextField variant="line" placeholder={isIncome ? '항목 이름 (예: 급여)' : '항목 이름 (예: 넷플릭스)'} value={name} onChangeText={setName} style={{ marginBottom: 12 }} />

      <View style={[styles.fieldsCard, { borderColor: theme.border }]}>
        <FormRow label="카테고리" value={category?.name || ''} onPress={() => setCatPicker(true)} />
        <FormRow label="결제일" value={`매월 ${dayOfMonth}일`} onPress={() => setDayPicker(true)} />
      </View>

      <ListRow contents={<Text style={{ color: theme.text, fontSize: 15, fontWeight: '600' }}>종료일 설정</Text>} right={<Switch checked={hasEnd} onCheckedChange={setHasEnd} />} verticalPadding="small" />
      {hasEnd && (
        <View style={[styles.fieldsCard, { borderColor: theme.border }]}>
          <FormRow label="종료" value={endDateLabel} onPress={() => setEndPicker(true)} />
        </View>
      )}

      {isValid && (
        <View style={[styles.previewCard, { borderColor: theme.brand }]}>
          <Text style={{ color: theme.text, fontSize: 13 }}>
            <Text style={{ fontWeight: '700' }}>{nextDateStr}</Text>에{' '}
            <Text style={{ fontWeight: '700', color: isIncome ? theme.brand : theme.danger }}>
              {isIncome ? '+' : '-'}
              {krw(amtNum)}
            </Text>
            이 자동으로 기록돼요
          </Text>
        </View>
      )}
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  segWrap: { marginBottom: 12 },
  infoBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, padding: 12, marginBottom: 16 },
  infoText: { fontSize: 12.5, flex: 1 },
  amountWrap: { marginBottom: 16 },
  fieldsCard: { borderWidth: 1, borderRadius: 12, marginBottom: 12, overflow: 'hidden' },
  dayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 16 },
  dayCell: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  previewCard: { borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 8 },
  expandBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
