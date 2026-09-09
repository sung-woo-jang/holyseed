import { useEffect, useState } from 'react';
import Button from '../ui/Button';
import TextFieldBig from '../ui/TextFieldBig';
import SegmentedControl from '../ui/SegmentedControl';
import SheetModal from './SheetModal';
import { useTheme } from '../../lib/theme';
import { useDataSource } from '../../lib/data-source';
import TossEmoji from '../common/TossEmoji';
import FormRow from '../common/FormRow';
import DatePicker from '../common/DatePicker';
import PickerOverlay from './PickerOverlay';
import { CATEGORY_DEFS, getCategoryDef, resolveCostType } from '../../lib/category-meta';
import { Icon } from '../common/Icon';
import { useCreateTx, useUpdateTx } from '../../queries/mutations';
import { todayLocal } from '../../lib/date';
import { getErrorMessage } from '../../lib/error';
import type { CostType } from '../../types/api';
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
  const [costType, setCostType] = useState<CostType | null>(null);
  const [title, setTitle] = useState('');
  const [memo, setMemo] = useState('');
  const [txDate, setTxDate] = useState<string>(''); // YYYY-MM-DD (편집 시 표시·조정)
  const [catPicker, setCatPicker] = useState(false);
  const [chipParentId, setChipParentId] = useState<number | null>(null);
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
      setCostType(editTx.costType ?? resolveCostType(editTx.categoryId, data.categories));
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
    setCostType(null);
    setChipParentId(null);
    setTitle('');
    setMemo('');
    setError('');
  }

  function openCatPicker() {
    const cur = category ? data.categories.find((x) => x.id === category.id) : undefined;
    setChipParentId(cur ? (cur.parentId ?? cur.id) : null);
    setCatPicker(true);
  }

  function selectTopLevel(c: { id: number; name: string }) {
    const kids = data.categories.filter((x) => x.parentId === c.id);
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
    setError('');
    try {
      const costTypeDto = type === 'EXPENSE' && costType ? { costType } : {};
      if (isEdit && editTx) {
        await updateTx.mutateAsync({
          id: Number(editTx.id),
          dto: {
            date: txDate,
            type,
            amount: rawAmount,
            ...(category && category.id > 0 ? { categoryId: category.id } : {}),
            title,
            memo,
            ...costTypeDto,
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
        title,
        memo,
        ...costTypeDto,
      });
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

          {/* 카테고리 피커 — 아이콘 그리드 + 소분류 칩 */}
          <PickerOverlay visible={catPicker} title="카테고리 선택" onClose={() => setCatPicker(false)}>
            {catListSource.length > 0 ? (
              <>
                <div className={styles.pickerGrid}>
                  {catListSource.map((c) => {
                    const def = getCategoryDef(c.name);
                    const kids = childrenOf(c.id);
                    const ringed = category?.id === c.id || chipParentId === c.id;
                    const iconColor = c.color || def.color;
                    return (
                      <button type="button" key={c.id} className={styles.pickerCell} onClick={() => selectTopLevel(c)}>
                        <div
                          className={`${styles.pickerCellIcon} ${ringed ? styles.pickerCellIconRinged : ''}`}
                          style={{ backgroundColor: iconColor + '22', ['--brand-color' as any]: theme.brand }}
                        >
                          <TossEmoji code={c.icon || def.iconCode} size={26} />
                          {category?.id === c.id && (
                            <div className={styles.pickerBadge} style={{ backgroundColor: theme.brand, borderColor: theme.card }}>
                              {Icon.check('#fff', 9)}
                            </div>
                          )}
                        </div>
                        <span className={styles.pickerCellName} style={{ color: theme.text }}>{c.name}</span>
                        {kids.length > 0 && <span className={styles.pickerCellSub} style={{ color: theme.textMuted }}>{kids.length}개</span>}
                      </button>
                    );
                  })}
                </div>

                {chipParentId != null &&
                  (() => {
                    const parent = data.categories.find((x) => x.id === chipParentId);
                    const kids = childrenOf(chipParentId);
                    if (!parent || kids.length === 0) return null;
                    return (
                      <div className={styles.chipPanel} style={{ borderTopColor: theme.border }}>
                        <div className={styles.chipPanelLabelRow}>
                          {Icon.chevronRight(theme.textMuted, 12)}
                          <span className={styles.chipPanelLabel} style={{ color: theme.textMuted }}>{parent.name}의 세부 카테고리</span>
                        </div>
                        <div className={styles.chipRow}>
                          <button
                            type="button"
                            className={styles.chip}
                            style={{
                              borderColor: category?.id === parent.id ? theme.brand : theme.border,
                              backgroundColor: category?.id === parent.id ? theme.brand : theme.card,
                              color: category?.id === parent.id ? '#fff' : theme.textMuted,
                            }}
                            onClick={() => selectChip(parent.id, parent.name)}
                          >
                            전체
                          </button>
                          {kids.map((k) => (
                            <button
                              type="button"
                              key={k.id}
                              className={styles.chip}
                              style={{
                                borderColor: category?.id === k.id ? theme.brand : theme.border,
                                backgroundColor: category?.id === k.id ? theme.brand : theme.card,
                                color: category?.id === k.id ? '#fff' : theme.textMuted,
                              }}
                              onClick={() => selectChip(k.id, k.name)}
                            >
                              {k.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
              </>
            ) : (
              <div className={styles.pickerGrid}>
                {catOptions.map((name) => {
                  const def = getCategoryDef(name);
                  const selected = category?.name === name;
                  return (
                    <button
                      type="button"
                      key={name}
                      className={styles.pickerCell}
                      onClick={() => {
                        setCategory({ id: 0, name });
                        setCostType(null);
                        setCatPicker(false);
                      }}
                    >
                      <div className={`${styles.pickerCellIcon} ${selected ? styles.pickerCellIconRinged : ''}`} style={{ backgroundColor: def.color + '22', ['--brand-color' as any]: theme.brand }}>
                        <TossEmoji code={def.iconCode} size={26} />
                      </div>
                      <span className={styles.pickerCellName} style={{ color: theme.text }}>{name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </PickerOverlay>
        </>
      }
    >
      <div className={styles.body}>
        {/* 타입 SegmentedControl */}
        <div className={styles.segWrap}>
          <SegmentedControl.Root
            value={type}
            onChange={(v) => { setType(v as TxType); setCategory(null); setCostType(null); setChipParentId(null); }}
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

        {/* 날짜 / 카테고리 (카테고리는 선택사항) */}
        <div className={styles.fieldsCard} style={{ borderColor: theme.border }}>
          <FormRow label="날짜" value={txDate === todayLocal() ? `오늘 (${txDate.slice(5).replace('-', '/')})` : txDate} onPress={() => setDatePicker(true)} />
          <FormRow label="카테고리" value={category?.name || ''} onPress={openCatPicker} />
        </div>

        {/* 기본 분류 (고정비/변동비) — 지출일 때만 */}
        {type === 'EXPENSE' && (
          <div className={styles.costWrap}>
            <SegmentedControl.Root
              value={costType ?? 'NONE'}
              onChange={(v) => setCostType(v === 'NONE' ? null : (v as CostType))}
              name="costType"
              size="small"
              alignment="fixed"
            >
              <SegmentedControl.Item value="FIXED">고정비</SegmentedControl.Item>
              <SegmentedControl.Item value="VARIABLE">변동비</SegmentedControl.Item>
              <SegmentedControl.Item value="NONE">미지정</SegmentedControl.Item>
            </SegmentedControl.Root>
            <p className={styles.costHint} style={{ color: theme.textMuted }}>
              카테고리 기본값에서 자동으로 채워지고, 거래마다 직접 바꿀 수도 있어요.
            </p>
          </div>
        )}

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
