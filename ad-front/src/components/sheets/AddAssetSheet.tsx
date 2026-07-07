import { useEffect, useState } from 'react';
import cn from 'classnames';
import Button from '../ui/Button';
import TextField from '../ui/TextField';
import SheetModal from './SheetModal';
import { useTheme } from '../../lib/theme';
import { TE } from '../../lib/toss-emoji';
import TossEmoji from '../common/TossEmoji';
import { ASSET_CATEGORY_META } from '../../lib/category-meta';
import { useCreateAsset, useUpdateAsset, useUpsertSnapshot } from '../../queries/mutations';
import { todayLocal } from '../../lib/date';
import { getErrorMessage } from '../../lib/error';
import type { MockAsset } from '../../lib/mock-data';
import type { AssetCategory } from '../../types/api';
import styles from './AddAssetSheet.module.css';

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

interface AddAssetSheetProps {
  visible: boolean;
  onClose: () => void;
  /** 지정 시 편집 모드 — 이름/카테고리 수정 */
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
  const [error, setError] = useState('');
  const createAsset = useCreateAsset();
  const updateAsset = useUpdateAsset();
  const upsertSnapshot = useUpsertSnapshot();

  // 편집 모드 진입 시 폼 프리필
  useEffect(() => {
    if (visible && editAsset) {
      setAssetName(editAsset.name);
      setCategory(editAsset.category);
      setStep(1);
    }
  }, [visible, editAsset]);

  const isLiability = category === 'LIABILITY';
  const amtNum = Number(amount.replace(/[^0-9]/g, ''));
  const step1Valid = assetName.trim().length > 0 && category !== null;
  const isPending = createAsset.isPending || updateAsset.isPending || upsertSnapshot.isPending;

  function reset() {
    setStep(1); setAssetName(''); setCategory(null);
    setAmount(''); setError('');
  }

  function handleClose() { reset(); onClose(); }

  async function handleEditSave() {
    setError('');
    try {
      await updateAsset.mutateAsync({
        id: Number(editAsset!.id),
        dto: { name: assetName.trim(), category: category! },
      });
      reset();
      onClose();
      onSaved?.('edit');
    } catch (e: any) {
      setError(getErrorMessage(e, '수정에 실패했어요. 다시 시도해 주세요.'));
    }
  }

  async function handleSave(skipAmount = false) {
    setError('');
    const today = todayLocal();
    try {
      const newAsset = await createAsset.mutateAsync({
        name: assetName.trim(),
        category: category!,
        currency: 'KRW',
        isLiability,
      });
      const valueToSave = skipAmount ? 0 : amtNum;
      if (valueToSave > 0) {
        await upsertSnapshot.mutateAsync({
          assetId: newAsset.id,
          dto: { date: today, value: valueToSave },
        });
      }
      reset();
      onClose();
      onSaved?.('create');
    } catch (e: any) {
      setError(getErrorMessage(e, '저장에 실패했어요. 다시 시도해 주세요.'));
    }
  }

  const headerTitle = isEdit ? '자산 수정' : `자산 추가 · ${step}/2`;

  if (step === 1) {
    return (
      <SheetModal
        visible={visible}
        onClose={handleClose}
        header={headerTitle}
        cta={
          <div className={styles.cta}>
            {isEdit && error ? <span className={styles.errorText} style={{ color: theme.danger }}>{error}</span> : null}
            {isEdit ? (
              <Button display="full" size="big" type="primary" disabled={!step1Valid} loading={isPending} onPress={handleEditSave}>
                수정하기
              </Button>
            ) : (
              <Button display="full" size="big" type="primary" disabled={!step1Valid} onPress={() => setStep(2)}>
                다음
              </Button>
            )}
          </div>
        }
      >
        <div className={styles.body}>
          <span className={styles.fieldLabel} style={{ color: theme.textMuted }}>자산 이름</span>
          <TextField
            variant="line"
            placeholder="예: 토스뱅크 파킹통장"
            value={assetName}
            onChangeText={setAssetName}
          />
          <span className={styles.fieldLabel} style={{ color: theme.textMuted, marginTop: 20 }}>카테고리</span>
          <div className={styles.categoryGrid}>
            {CATEGORY_OPTIONS.map((opt) => {
              const selected = category === opt.key;
              const isLiab = opt.key === 'LIABILITY';
              return (
                <button
                  type="button"
                  key={opt.key}
                  className={cn(styles.categoryCell)}
                  style={{
                    borderColor: selected ? (isLiab ? theme.danger : theme.brand) : theme.border,
                    backgroundColor: selected ? (isLiab ? 'rgba(240,68,82,0.10)' : theme.brandSoft) : theme.bg,
                  }}
                  onClick={() => setCategory(opt.key)}
                >
                  <TossEmoji code={ASSET_CATEGORY_META[opt.key].iconCode} size={20} />
                  <span
                    className={styles.categoryCellText}
                    style={{ color: selected ? (isLiab ? theme.danger : theme.brand) : theme.text }}
                  >
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </SheetModal>
    );
  }

  return (
    <SheetModal
      visible={visible}
      onClose={handleClose}
      header={headerTitle}
      cta={
        <div className={styles.cta}>
          {error ? <span className={styles.errorText} style={{ color: theme.danger }}>{error}</span> : null}
          <Button display="full" size="big" type="primary" disabled={amtNum === 0} loading={isPending} onPress={() => handleSave(false)}>
            저장하기
          </Button>
        </div>
      }
    >
      <div className={styles.body}>
        <span className={styles.fieldLabel} style={{ color: theme.textMuted, textAlign: 'center' }}>
          {isLiability ? '부채 잔액' : '현재 평가액'}
        </span>
        <div className={styles.amountWrap}>
          <input
            className={styles.amountInput}
            style={{ color: isLiability ? theme.danger : theme.text }}
            inputMode="numeric"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(formatNum(e.target.value))}
            autoFocus
          />
          <span className={styles.amountUnit} style={{ color: theme.textMuted }}>원</span>
        </div>

        <button type="button" onClick={() => handleSave(true)} disabled={isPending} className={styles.skipBtn}>
          <span className={styles.skipText} style={{ color: theme.textMuted }}>건너뛰기 (나중에 입력)</span>
        </button>
      </div>
    </SheetModal>
  );
}
