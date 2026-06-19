import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button, ListRow, SegmentedControl, Switch, TextFieldBig, TextField } from '@toss/tds-react-native';
import SheetModal from './SheetModal';
import { useTheme } from '../../lib/theme';
import { useDataSource } from '../../lib/data-source';
import TossEmoji from '../common/TossEmoji';
import FormRow from '../common/FormRow';
import PickerOverlay from './PickerOverlay';
import { CATEGORY_DEFS, getCategoryDef } from '../../lib/category-meta';
import { TE } from '../../lib/toss-emoji';
import { Icon } from '../common/Icon';
import { krw } from '../../lib/format';
import { useCreateRecurring } from '../../queries/mutations';

function formatNum(raw: string): string {
  const n = raw.replace(/[^0-9]/g, '');
  return n ? Number(n).toLocaleString() : '';
}

interface AddRecurringSheetProps {
  visible: boolean;
  onClose: () => void;
}

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

type RecType = 'EXPENSE' | 'INCOME';

export default function AddRecurringSheet({ visible, onClose }: AddRecurringSheetProps) {
  const theme = useTheme();
  const data = useDataSource();
  const [type, setType] = useState<RecType>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<{ id: number; name: string } | null>(null);
  const [dayOfMonth, setDayOfMonth] = useState(25);
  const [asset, setAsset] = useState<{ id: string; name: string } | null>(null);
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [catPicker, setCatPicker] = useState(false);
  const [assetPicker, setAssetPicker] = useState(false);
  const [dayPicker, setDayPicker] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const createRecurring = useCreateRecurring();

  const isIncome = type === 'INCOME';
  const localCategories = Object.entries(CATEGORY_DEFS)
    .filter(([, def]) => def.type === type)
    .map(([n]) => n);
  const apiCategories = data.categories.filter((c) => c.type === type);
  const assetOptions = data.assets.filter((a) => !a.isLiability);
  const amtNum = Number(amount.replace(/[^0-9]/g, ''));
  const isValid = name.length > 0 && amtNum > 0;

  const today = new Date();
  const nextDate = new Date(today.getFullYear(), today.getMonth() + (today.getDate() >= dayOfMonth ? 1 : 0), dayOfMonth);
  const nextDateStr = `${nextDate.getFullYear()}년 ${nextDate.getMonth() + 1}월 ${nextDate.getDate()}일`;

  function reset() {
    setType('EXPENSE'); setAmount(''); setName(''); setCategory(null);
    setDayOfMonth(25); setAsset(null); setAutoGenerate(true); setError('');
  }

  async function handleSave() {
    setError('');
    const todayStr = new Date().toISOString().split('T')[0]!;
    try {
      await createRecurring.mutateAsync({
        title: name, type, amount: amtNum,
        ...(category && category.id > 0 ? { categoryId: category.id } : {}),
        ...(asset ? (isIncome ? { toAssetId: Number(asset.id) } : { fromAssetId: Number(asset.id) }) : {}),
        frequency: 'MONTHLY', dayOfMonth, startDate: todayStr,
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
          header={isIncome ? '정기수입 추가' : '정기지출 추가'}
          cta={
            <View style={styles.cta}>
              {error ? <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text> : null}
              <Button display="full" size="big" type="primary" disabled={!isValid} loading={createRecurring.isPending} onPress={handleSave}>
                저장하기
              </Button>
            </View>
          }
          overlay={
            <>
              {/* 카테고리 피커 */}
              <PickerOverlay visible={catPicker} title="카테고리 선택" onClose={() => setCatPicker(false)}>
                {(apiCategories.length > 0 ? apiCategories : localCategories.map(n => ({ id: 0, name: n, type, isBuiltin: true, householdId: null, icon: '' }))).map((c) => {
                  const def = getCategoryDef(c.name);
                  return (
                    <ListRow
                      key={c.id || c.name}
                      left={<View style={{ marginRight: 12 }}><TossEmoji code={def.iconCode} size={28} bg={def.color + '22'} /></View>}
                      contents={<Text style={{ color: theme.text, fontSize: 15, fontWeight: "500" }}>{c.name}</Text>}
                      right={category?.name === c.name ? Icon.check(theme.brand, 16) : undefined}
                      onPress={() => { setCategory({ id: c.id, name: c.name }); setCatPicker(false); }}
                      verticalPadding="small"
                    />
                  );
                })}
              </PickerOverlay>

              {/* 자산 피커 */}
              <PickerOverlay visible={assetPicker} title="자산 선택" onClose={() => setAssetPicker(false)}>
                {assetOptions.map((a) => (
                  <ListRow
                    key={a.id}
                    contents={<Text style={{ color: theme.text, fontSize: 15, fontWeight: "500" }}>{a.name}</Text>}
                    right={asset?.id === a.id ? Icon.check(theme.brand, 16) : undefined}
                    onPress={() => { setAsset({ id: a.id, name: a.name }); setAssetPicker(false); }}
                    verticalPadding="small"
                  />
                ))}
              </PickerOverlay>

              {/* 결제일 피커 */}
              <PickerOverlay visible={dayPicker} title="결제일 선택" onClose={() => setDayPicker(false)}>
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
              </PickerOverlay>
            </>
          }
        >
          <View style={styles.body}>
            {/* 수입/지출 타입 */}
            <View style={styles.segWrap}>
              <SegmentedControl.Root
                value={type}
                onChange={(v) => { setType(v as RecType); setCategory(null); }}
                name="recType"
                size="large"
                alignment="fixed"
              >
                <SegmentedControl.Item value="EXPENSE">지출</SegmentedControl.Item>
                <SegmentedControl.Item value="INCOME">수입</SegmentedControl.Item>
              </SegmentedControl.Root>
            </View>

            {/* 안내 박스 */}
            <View style={[styles.infoBox, { backgroundColor: theme.brandSoft }]}>
              <TossEmoji code={TE.repeat} size={20} />
              <Text style={[styles.infoText, { color: theme.brand }]}>
                {isIncome ? '매월 같은 날 자동으로 들어오는 수입을 등록해요' : '매월 같은 날 자동으로 나가는 지출을 등록해요'}
              </Text>
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

            {/* 이름 */}
            <TextField
              variant="line"
              placeholder={isIncome ? '항목 이름 (예: 급여)' : '항목 이름 (예: 넷플릭스)'}
              value={name}
              onChangeText={setName}
              style={styles.nameField}
            />

            {/* 필드 카드 */}
            <View style={[styles.fieldsCard, { borderColor: theme.border }]}>
              <FormRow label="카테고리" value={category?.name || ''} onPress={() => setCatPicker(true)} />
              <FormRow label="결제일" value={`매월 ${dayOfMonth}일`} onPress={() => setDayPicker(true)} />
              <FormRow label={isIncome ? '입금 자산' : '출금 자산'} value={asset?.name || ''} onPress={() => setAssetPicker(true)} />
            </View>

            {/* 자동 생성 토글 */}
            <ListRow
              contents={<Text style={{ color: theme.text, fontSize: 15, fontWeight: "600" }}>자동 생성 활성화</Text>}
              right={<Switch checked={autoGenerate} onCheckedChange={setAutoGenerate} />}
              verticalPadding="small"
            />

            {/* 미리보기 */}
            {isValid && autoGenerate && (
              <View style={[styles.previewCard, { borderColor: theme.brand }]}>
                <Text style={[styles.previewText, { color: theme.text }]}>
                  <Text style={{ fontWeight: '700' }}>{nextDateStr}</Text>에{' '}
                  <Text style={{ fontWeight: '700' }}>{asset?.name || '선택한 자산'}</Text>{isIncome ? '으로 ' : '에서 '}
                  <Text style={{ fontWeight: '700', color: isIncome ? theme.brand : theme.danger }}>{isIncome ? '+' : '-'}{krw(amtNum)}</Text>이 자동으로 기록돼요
                </Text>
              </View>
            )}
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
  segWrap: { marginBottom: 16 },
  infoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 20 },
  infoText: { flex: 1, fontSize: 13, lineHeight: 18 },
  amountWrap: { alignItems: 'center', marginBottom: 16 },
  amountField: { width: '100%' },
  nameField: { marginBottom: 12 },
  fieldsCard: { borderRadius: 14, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  previewCard: { borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, marginTop: 12 },
  previewText: { fontSize: 14, lineHeight: 20 },
  cta: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 },
  errorText: { fontSize: 13, textAlign: 'center', marginBottom: 8 },
  dayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  dayCell: { width: 42, height: 42, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  dayCellText: { fontSize: 14, fontWeight: '600' },
});
