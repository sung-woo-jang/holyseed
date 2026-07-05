import { useState } from 'react';
import Button from '../ui/Button';
import TextField from '../ui/TextField';
import SheetModal from './SheetModal';
import EmptyState from '../common/EmptyState';
import { useTheme } from '../../lib/theme';
import { useDataSource } from '../../lib/data-source';
import { krw, krwShort } from '../../lib/format';
import TossEmoji from '../common/TossEmoji';
import { TE } from '../../lib/toss-emoji';
import { useUpsertSnapshot, useBatchSnapshots } from '../../queries/mutations';
import styles from './SnapshotSheet.module.css';

interface SnapshotSheetProps {
  visible: boolean;
  onClose: () => void;
  focusAssetId?: string;
}

function formatAmount(raw: string): string {
  const num = raw.replace(/[^0-9]/g, '');
  if (!num) return '';
  return Number(num).toLocaleString();
}

export default function SnapshotSheet({ visible, onClose, focusAssetId }: SnapshotSheetProps) {
  const theme = useTheme();
  const data = useDataSource();
  const [values, setValues] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const upsert = useUpsertSnapshot();
  const batch = useBatchSnapshots();

  const assets = focusAssetId
    ? data.assets.filter((a) => a.id === focusAssetId)
    : data.assets;

  const getNum = (id: string) => {
    const raw = values[id]?.replace(/[^0-9]/g, '');
    return raw ? Number(raw) : null;
  };

  const totalNew = assets.reduce((sum, a) => {
    const v = getNum(a.id);
    return sum + (v !== null ? v : a.value);
  }, 0);
  const totalOld = assets.reduce((sum, a) => sum + a.value, 0);
  const delta = totalNew - totalOld;
  const hasInput = Object.values(values).some((v) => v.replace(/[^0-9]/g, '') !== '');

  async function handleSave() {
    setError('');
    const today = new Date().toISOString().split('T')[0]!;
    try {
      if (focusAssetId) {
        const asset = assets[0];
        if (!asset) return;
        const value = getNum(asset.id);
        if (value === null) return;
        await upsert.mutateAsync({
          assetId: Number(asset.id),
          dto: { date: today, value },
        });
      } else {
        const items = assets
          .map((a) => ({ a, value: getNum(a.id) }))
          .filter((x): x is { a: typeof x.a; value: number } => x.value !== null)
          .map(({ a, value }) => ({
            assetId: Number(a.id),
            date: today,
            value,
          }));
        if (items.length === 0) return;
        await batch.mutateAsync(items);
      }
      setSaved(true);
      setTimeout(() => { setSaved(false); setValues({}); onClose(); }, 700);
    } catch (e: any) {
      setError(e?.message ?? '저장에 실패했어요. 다시 시도해 주세요.');
    }
  }

  const isPending = upsert.isPending || batch.isPending;
  const title = focusAssetId ? '개별 스냅샷 입력' : '일괄 스냅샷 입력';
  const isEmpty = assets.length === 0;

  if (saved) {
    return (
      <SheetModal visible={visible} onClose={onClose}>
        <div className={styles.confirmBox}>
          <TossEmoji code={TE.check} size={64} />
          <span className={styles.confirmTitle} style={{ color: theme.text }}>저장 완료!</span>
          <span className={styles.confirmSub} style={{ color: theme.textMuted }}>대시보드가 업데이트됐어요</span>
        </div>
      </SheetModal>
    );
  }

  if (isEmpty) {
    return (
      <SheetModal
        visible={visible}
        onClose={onClose}
        header={title}
        cta={
          <div className={styles.cta}>
            <Button display="full" size="big" type="primary" style="weak" onPress={onClose}>
              닫기
            </Button>
          </div>
        }
      >
        <EmptyState
          iconCode={TE.mailbox}
          title="아직 등록된 자산이 없어요"
          desc="자산을 먼저 추가하면 스냅샷을 입력할 수 있어요"
        />
      </SheetModal>
    );
  }

  return (
    <SheetModal
      visible={visible}
      onClose={onClose}
      header={title}
      cta={
        <div className={styles.cta}>
          {error ? <span className={styles.errorText} style={{ color: theme.danger }}>{error}</span> : null}
          <Button display="full" size="big" type="primary" disabled={!hasInput} loading={isPending} onPress={handleSave}>
            저장하기
          </Button>
        </div>
      }
    >
      <div className={styles.body}>
        {!focusAssetId && hasInput && (
          <div
            className={styles.deltaSummary}
            style={{ backgroundColor: delta >= 0 ? theme.brandSoft : '#FEE2E2' }}
          >
            <span className={styles.deltaSumLabel} style={{ color: delta >= 0 ? theme.brand : theme.danger }}>합계 변화</span>
            <span className={styles.deltaSumValue} style={{ color: delta >= 0 ? theme.brand : theme.danger }}>
              {delta >= 0 ? '+' : ''}{krw(delta)}
            </span>
          </div>
        )}
        {assets.map((asset, idx) => {
          const newVal = getNum(asset.id);
          const diff = newVal !== null ? newVal - asset.value : null;
          return (
            <div
              key={asset.id}
              className={styles.assetRow}
              style={{ borderBottom: idx < assets.length - 1 ? `1px solid ${theme.border}` : 'none' }}
            >
              <div className={styles.assetInfo}>
                <span className={styles.assetName} style={{ color: theme.text }}>{asset.name}</span>
                <span className={styles.prevVal} style={{ color: theme.textMuted }}>이전: {krwShort(asset.value)}</span>
              </div>
              <div className={styles.inputWrap}>
                <TextField
                  variant="line"
                  placeholder="금액 입력"
                  keyboardType="numeric"
                  value={values[asset.id] ?? ''}
                  onChangeText={(t) => setValues((prev) => ({ ...prev, [asset.id]: formatAmount(t) }))}
                  style={{ width: 140 }}
                />
                {diff !== null && (
                  <span className={styles.diffText} style={{ color: diff >= 0 ? theme.brand : theme.danger }}>
                    {diff >= 0 ? '+' : ''}{krwShort(diff)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </SheetModal>
  );
}
