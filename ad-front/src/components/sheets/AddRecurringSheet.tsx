import { useEffect, useState } from 'react';
import Button from '../ui/Button';
import ListRow from '../ui/ListRow';
import SegmentedControl from '../ui/SegmentedControl';
import Switch from '../ui/Switch';
import TextFieldBig from '../ui/TextFieldBig';
import TextField from '../ui/TextField';
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
import { useCreateRecurring, useUpdateRecurring } from '../../queries/mutations';
import { todayLocal } from '../../lib/date';
import { getErrorMessage } from '../../lib/error';
import type { MockRecurring } from '../../lib/mock-data';
import styles from './AddRecurringSheet.module.css';

function formatNum(raw: string): string {
  const n = raw.replace(/[^0-9]/g, '');
  return n ? Number(n).toLocaleString() : '';
}

interface AddRecurringSheetProps {
  visible: boolean;
  onClose: () => void;
  /** 지정 시 편집 모드 */
  editRec?: MockRecurring;
  /** 저장/수정 성공 콜백 (토스트) */
  onSaved?: (mode: 'create' | 'edit') => void;
}

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

type RecType = 'EXPENSE' | 'INCOME';

export default function AddRecurringSheet({ visible, onClose, editRec, onSaved }: AddRecurringSheetProps) {
  const theme = useTheme();
  const data = useDataSource();
  const isEdit = !!editRec;
  const [type, setType] = useState<RecType>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<{ id: number; name: string } | null>(null);
  const [dayOfMonth, setDayOfMonth] = useState(25);
  const [asset, setAsset] = useState<{ id: string; name: string } | null>(null);
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [hasEnd, setHasEnd] = useState(false);
  const [endMonths, setEndMonths] = useState(12); // 시작 기준 N개월 후
  const [catPicker, setCatPicker] = useState(false);
  const [assetPicker, setAssetPicker] = useState(false);
  const [dayPicker, setDayPicker] = useState(false);
  const [endPicker, setEndPicker] = useState(false);
  const [error, setError] = useState('');
  const createRecurring = useCreateRecurring();
  const updateRecurring = useUpdateRecurring();

  // 편집 프리필
  useEffect(() => {
    if (!visible || !editRec) return;
    setType(editRec.type === 'INCOME' ? 'INCOME' : 'EXPENSE');
    setAmount(formatNum(String(editRec.amount)));
    setName(editRec.title);
    const c = data.categories.find((x) => x.name === editRec.category);
    setCategory(c ? { id: c.id, name: c.name } : { id: 0, name: editRec.category });
    setDayOfMonth(editRec.dayOfMonth);
    const a = editRec.from ? data.assets.find((x) => x.id === editRec.from) : undefined;
    setAsset(a ? { id: a.id, name: a.name } : null);
    setHasEnd(!!editRec.endDate);
    setError('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, editRec]);

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

  // 종료일 = 오늘 기준 +endMonths개월의 결제일
  function computeEndDate(): string {
    const d = new Date(today.getFullYear(), today.getMonth() + endMonths, dayOfMonth);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  const endDateLabel = `${endMonths}개월 후 (~${computeEndDate().slice(0, 7)})`;

  function reset() {
    setType('EXPENSE'); setAmount(''); setName(''); setCategory(null);
    setDayOfMonth(25); setAsset(null); setAutoGenerate(true); setHasEnd(false); setEndMonths(12); setError('');
  }

  async function handleSave() {
    setError('');
    const todayStr = todayLocal();
    try {
      if (isEdit && editRec) {
        await updateRecurring.mutateAsync({
          id: Number(editRec.id),
          dto: {
            title: name, type, amount: amtNum, dayOfMonth,
            ...(category && category.id > 0 ? { categoryId: category.id } : {}),
            ...(asset ? (isIncome ? { toAssetId: Number(asset.id) } : { fromAssetId: Number(asset.id) }) : {}),
            ...(hasEnd ? { endDate: computeEndDate() } : {}),
          },
        });
        onClose();
        onSaved?.('edit');
        return;
      }
      await createRecurring.mutateAsync({
        title: name, type, amount: amtNum,
        ...(category && category.id > 0 ? { categoryId: category.id } : {}),
        ...(asset ? (isIncome ? { toAssetId: Number(asset.id) } : { fromAssetId: Number(asset.id) }) : {}),
        frequency: 'MONTHLY', dayOfMonth, startDate: todayStr,
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
        <div className={styles.cta}>
          {error ? <span className={styles.errorText} style={{ color: theme.danger }}>{error}</span> : null}
          <Button display="full" size="big" type="primary" disabled={!isValid} loading={createRecurring.isPending || updateRecurring.isPending} onPress={handleSave}>
            {isEdit ? '수정하기' : '저장하기'}
          </Button>
        </div>
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
                  left={<TossEmoji code={def.iconCode} size={28} bg={def.color + '22'} />}
                  contents={<span style={{ color: theme.text, fontSize: 15, fontWeight: 500 }}>{c.name}</span>}
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
                contents={<span style={{ color: theme.text, fontSize: 15, fontWeight: 500 }}>{a.name}</span>}
                right={asset?.id === a.id ? Icon.check(theme.brand, 16) : undefined}
                onPress={() => { setAsset({ id: a.id, name: a.name }); setAssetPicker(false); }}
                verticalPadding="small"
              />
            ))}
          </PickerOverlay>

          {/* 결제일 피커 */}
          <PickerOverlay visible={dayPicker} title="결제일 선택" onClose={() => setDayPicker(false)}>
            <div className={styles.dayGrid}>
              {DAYS.map((d) => (
                <button
                  type="button"
                  key={d}
                  className={styles.dayCell}
                  style={{
                    backgroundColor: dayOfMonth === d ? theme.brand : theme.bg,
                    borderColor: theme.border,
                  }}
                  onClick={() => { setDayOfMonth(d); setDayPicker(false); }}
                >
                  <span className={styles.dayCellText} style={{ color: dayOfMonth === d ? '#fff' : theme.text }}>{d}</span>
                </button>
              ))}
            </div>
          </PickerOverlay>

          {/* 종료 시점 피커 */}
          <PickerOverlay visible={endPicker} title="종료 시점" onClose={() => setEndPicker(false)}>
            {[3, 6, 12, 24, 36].map((mo) => (
              <ListRow
                key={mo}
                contents={<span style={{ color: theme.text, fontSize: 15, fontWeight: 500 }}>{mo}개월 후</span>}
                right={endMonths === mo ? Icon.check(theme.brand, 16) : undefined}
                onPress={() => { setEndMonths(mo); setEndPicker(false); }}
                verticalPadding="small"
              />
            ))}
          </PickerOverlay>
        </>
      }
    >
      <div className={styles.body}>
        {/* 수입/지출 타입 */}
        <div className={styles.segWrap}>
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
        </div>

        {/* 안내 박스 */}
        <div className={styles.infoBox} style={{ backgroundColor: theme.brandSoft }}>
          <TossEmoji code={TE.repeat} size={20} />
          <span className={styles.infoText} style={{ color: theme.brand }}>
            {isIncome ? '매월 같은 날 자동으로 들어오는 수입을 등록해요' : '매월 같은 날 자동으로 나가는 지출을 등록해요'}
          </span>
        </div>

        {/* 금액 */}
        <div className={styles.amountWrap}>
          <TextFieldBig
            placeholder="0"
            keyboardType="numeric"
            value={amount}
            onChangeText={(t) => setAmount(formatNum(t))}
            suffix="원"
            style={{ width: '100%' }}
          />
        </div>

        {/* 이름 */}
        <TextField
          variant="line"
          placeholder={isIncome ? '항목 이름 (예: 급여)' : '항목 이름 (예: 넷플릭스)'}
          value={name}
          onChangeText={setName}
          style={{ marginBottom: 12 }}
        />

        {/* 필드 카드 */}
        <div className={styles.fieldsCard} style={{ borderColor: theme.border }}>
          <FormRow label="카테고리" value={category?.name || ''} onPress={() => setCatPicker(true)} />
          <FormRow label="결제일" value={`매월 ${dayOfMonth}일`} onPress={() => setDayPicker(true)} />
          <FormRow label={isIncome ? '입금 자산' : '출금 자산'} value={asset?.name || ''} onPress={() => setAssetPicker(true)} />
        </div>

        {/* 종료일 설정 */}
        <ListRow
          contents={<span style={{ color: theme.text, fontSize: 15, fontWeight: 600 }}>종료일 설정</span>}
          right={<Switch checked={hasEnd} onCheckedChange={setHasEnd} />}
          verticalPadding="small"
        />
        {hasEnd && (
          <div className={styles.fieldsCard} style={{ borderColor: theme.border }}>
            <FormRow label="종료" value={endDateLabel} onPress={() => setEndPicker(true)} />
          </div>
        )}

        {/* 자동 생성 토글 */}
        <ListRow
          contents={<span style={{ color: theme.text, fontSize: 15, fontWeight: 600 }}>자동 생성 활성화</span>}
          right={<Switch checked={autoGenerate} onCheckedChange={setAutoGenerate} />}
          verticalPadding="small"
        />

        {/* 미리보기 */}
        {isValid && autoGenerate && (
          <div className={styles.previewCard} style={{ borderColor: theme.brand }}>
            <span className={styles.previewText} style={{ color: theme.text }}>
              <b>{nextDateStr}</b>에 <b>{asset?.name || '선택한 자산'}</b>{isIncome ? '으로 ' : '에서 '}
              <b style={{ color: isIncome ? theme.brand : theme.danger }}>{isIncome ? '+' : '-'}{krw(amtNum)}</b>이 자동으로 기록돼요
            </span>
          </div>
        )}
      </div>
    </SheetModal>
  );
}
