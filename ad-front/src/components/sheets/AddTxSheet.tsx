import { useEffect, useState } from 'react';
import Button from '../ui/Button';
import TextFieldBig from '../ui/TextFieldBig';
import ListRow from '../ui/ListRow';
import SegmentedControl from '../ui/SegmentedControl';
import SheetModal from './SheetModal';
import EmptyState from '../common/EmptyState';
import { useTheme } from '../../lib/theme';
import { useDataSource } from '../../lib/data-source';
import TossEmoji from '../common/TossEmoji';
import FormRow from '../common/FormRow';
import DatePicker from '../common/DatePicker';
import PickerOverlay from './PickerOverlay';
import { CATEGORY_DEFS, getCategoryDef } from '../../lib/category-meta';
import { TE } from '../../lib/toss-emoji';
import { Icon } from '../common/Icon';
import { krw } from '../../lib/format';
import { useCreateTx, useUpdateTx } from '../../queries/mutations';
import { todayLocal } from '../../lib/date';
import { getErrorMessage } from '../../lib/error';
import type { MockTransaction } from '../../lib/mock-data';
import styles from './AddTxSheet.module.css';

type TxType = 'EXPENSE' | 'INCOME';

const TYPE_OPTIONS: { key: TxType; label: string }[] = [
  { key: 'EXPENSE', label: '지출' },
  { key: 'INCOME', label: '수입' },
];

function formatNum(raw: string): string {
  const n = raw.replace(/[^0-9]/g, '');
  return n ? Number(n).toLocaleString() : '';
}

interface AddTxSheetProps {
  visible: boolean;
  onClose: () => void;
  /** 거래 날짜 프리필 (YYYY-MM-DD). 없으면 오늘 */
  date?: string;
  /** 지정 시 편집 모드 */
  editTx?: MockTransaction;
  /** 저장/수정 성공 콜백 (토스트) */
  onSaved?: (mode: 'create' | 'edit') => void;
}

export default function AddTxSheet({ visible, onClose, date, editTx, onSaved }: AddTxSheetProps) {
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
  const [datePicker, setDatePicker] = useState(false);
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
      setTxDate(date ?? todayLocal());
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
        onSaved?.('edit');
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
      header={isEdit ? '거래 수정' : '거래 추가'}
      cta={
        <div className={styles.cta}>
          {error ? <span className={styles.errorText} style={{ color: theme.danger }}>{error}</span> : null}
          <Button display="full" size="big" type="primary" disabled={!isValid} loading={createTx.isPending || updateTx.isPending} onPress={handleSave}>
            {isEdit ? '수정하기' : '저장하기'}
          </Button>
        </div>
      }
      overlay={
        <>
          {/* 날짜 피커 */}
          <DatePicker
            visible={datePicker}
            value={txDate}
            maxDate={todayLocal()}
            onSelect={setTxDate}
            onClose={() => setDatePicker(false)}
          />

          {/* 카테고리 피커 */}
          <PickerOverlay visible={catPicker} title="카테고리 선택" onClose={() => setCatPicker(false)}>
            {(data.categories.filter((c) => c.type === type).length > 0
              ? data.categories.filter((c) => c.type === type)
                  .map((c) => {
                    const def = getCategoryDef(c.name);
                    return (
                      <ListRow
                        key={c.id}
                        left={<TossEmoji code={def.iconCode} size={28} bg={def.color + '22'} />}
                        contents={<span style={{ color: theme.text, fontSize: 15, fontWeight: 500 }}>{c.name}</span>}
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
                      contents={<span style={{ color: theme.text, fontSize: 15, fontWeight: 500 }}>{name}</span>}
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
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: theme.text, fontSize: 15, fontWeight: 500 }}>{a.name}</span>
                    <span style={{ color: theme.textMuted, fontSize: 12, marginTop: 2 }}>잔액 {krw(a.value)}</span>
                  </div>
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
                contents={<span style={{ color: theme.text, fontSize: 15, fontWeight: 500 }}>{a.name}</span>}
                right={toAsset?.id === a.id ? Icon.check(theme.brand, 16) : undefined}
                onPress={() => { setToAsset({ id: a.id, name: a.name }); setToPicker(false); }}
                verticalPadding="small"
              />
            ))}
          </PickerOverlay>
        </>
      }
    >
      <div className={styles.body}>
        {/* 타입 SegmentedControl */}
        <div className={styles.segWrap}>
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

        {/* 날짜 / 카테고리 / 자산 (카테고리·자산은 선택사항 — 흐름 기록용) */}
        <div className={styles.fieldsCard} style={{ borderColor: theme.border }}>
          <FormRow label="날짜" value={txDate === todayLocal() ? `오늘 (${txDate.slice(5).replace('-', '/')})` : txDate} onPress={() => setDatePicker(true)} />
          <FormRow label="카테고리" value={category?.name || ''} onPress={() => setCatPicker(true)} />
          {type === 'EXPENSE' ? (
            <FormRow label="출금 자산" value={fromAsset?.name || ''} onPress={() => setFromPicker(true)} />
          ) : (
            <FormRow label="입금 자산" value={toAsset?.name || ''} onPress={() => setToPicker(true)} />
          )}
        </div>

        {/* 제목 / 메모 */}
        <input
          className={styles.titleInput}
          style={{ borderColor: theme.border, color: theme.text, backgroundColor: theme.bg }}
          placeholder="제목 (선택)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className={styles.memoInput}
          style={{ borderColor: theme.border, color: theme.text, backgroundColor: theme.bg }}
          placeholder="메모 (선택)"
          rows={3}
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
        />
      </div>
    </SheetModal>
  );
}
