import { useEffect, useRef, useState } from 'react';
import Button from '../ui/Button';
import TextField from '../ui/TextField';
import TextButton from '../ui/TextButton';
import Badge from '../ui/Badge';
import SheetModal from './SheetModal';
import EmptyState from '../common/EmptyState';
import { useTheme } from '../../lib/theme';
import { useDataSource } from '../../lib/data-source';
import { krw, krwShort } from '../../lib/format';
import { todayLocal, shiftDay } from '../../lib/date';
import { getErrorMessage } from '../../lib/error';
import { TE } from '../../lib/toss-emoji';
import { useUpsertSnapshot, useBatchSnapshots } from '../../queries/mutations';
import styles from './SnapshotSheet.module.css';

interface SnapshotSheetProps {
  visible: boolean;
  onClose: () => void;
  focusAssetId?: string;
  /** 저장 성공 콜백 — 호출부에서 토스트 표시 */
  onSaved?: () => void;
}

function formatAmount(raw: string): string {
  const num = raw.replace(/[^0-9]/g, '');
  if (!num) return '';
  return Number(num).toLocaleString();
}

const QUICK_STEPS = [
  { label: '+1만', value: 10_000 },
  { label: '+10만', value: 100_000 },
  { label: '+100만', value: 1_000_000 },
  { label: '+1000만', value: 10_000_000 },
];

export default function SnapshotSheet({ visible, onClose, focusAssetId, onSaved }: SnapshotSheetProps) {
  const theme = useTheme();
  const data = useDataSource();
  const [values, setValues] = useState<Record<string, string>>({});
  const [date, setDate] = useState(todayLocal());
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const upsert = useUpsertSnapshot();
  const batch = useBatchSnapshots();

  // 열릴 때마다 초기화
  useEffect(() => {
    if (visible) {
      setValues({});
      setDate(todayLocal());
      setFocusedId(null);
      setError('');
    }
  }, [visible]);

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
  const filledCount = assets.filter((a) => getNum(a.id) !== null).length;
  const hasInput = filledCount > 0;
  const isToday = date === todayLocal();

  function setAssetValue(id: string, num: number) {
    setValues((prev) => ({ ...prev, [id]: num > 0 ? num.toLocaleString() : '' }));
  }

  /** 이전 값 복사 (= 변동 없음) */
  function copyPrev(asset: { id: string; value: number }) {
    setAssetValue(asset.id, asset.value);
  }

  /** 비어있는 모든 필드에 이전 값 채움 */
  function fillAllUnchanged() {
    setValues((prev) => {
      const next = { ...prev };
      for (const a of assets) {
        const raw = next[a.id]?.replace(/[^0-9]/g, '');
        if (!raw && a.value > 0) next[a.id] = a.value.toLocaleString();
      }
      return next;
    });
  }

  function addToFocused(step: number) {
    if (!focusedId) return;
    const cur = getNum(focusedId) ?? 0;
    setAssetValue(focusedId, Math.max(0, cur + step));
    inputRefs.current[focusedId]?.focus();
  }

  function clearFocused() {
    if (!focusedId) return;
    setValues((prev) => ({ ...prev, [focusedId]: '' }));
    inputRefs.current[focusedId]?.focus();
  }

  function focusNext(currentId: string) {
    const idx = assets.findIndex((a) => a.id === currentId);
    const next = assets[idx + 1];
    if (next) inputRefs.current[next.id]?.focus();
    else inputRefs.current[currentId]?.blur();
  }

  async function handleSave() {
    setError('');
    try {
      if (focusAssetId) {
        const asset = assets[0];
        if (!asset) return;
        const value = getNum(asset.id);
        if (value === null) return;
        await upsert.mutateAsync({
          assetId: Number(asset.id),
          dto: { date, value },
        });
      } else {
        const items = assets
          .map((a) => ({ a, value: getNum(a.id) }))
          .filter((x): x is { a: typeof x.a; value: number } => x.value !== null)
          .map(({ a, value }) => ({
            assetId: Number(a.id),
            date,
            value,
          }));
        if (items.length === 0) return;
        await batch.mutateAsync(items);
      }
      setValues({});
      onClose();
      onSaved?.();
    } catch (e: unknown) {
      setError(getErrorMessage(e, '저장에 실패했어요. 다시 시도해 주세요.'));
    }
  }

  const isPending = upsert.isPending || batch.isPending;
  const title = focusAssetId ? '개별 스냅샷 입력' : '일괄 스냅샷 입력';
  const isEmpty = assets.length === 0;

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
            {focusAssetId ? '저장하기' : `${filledCount}개 저장하기`}
          </Button>
        </div>
      }
    >
      <div className={styles.body}>
        {/* 날짜 선택 + 진행 카운터 */}
        <div className={styles.toolbar}>
          <div className={styles.dateCtrl}>
            <button type="button" className={styles.dateArrowBtn} onClick={() => setDate(shiftDay(date, -1))}>
              <span className={styles.dateArrow} style={{ color: theme.brand }}>‹</span>
            </button>
            <span className={styles.dateValue} style={{ color: theme.text }}>
              {date}{isToday && <span style={{ color: theme.textMuted, fontWeight: 500 }}> (오늘)</span>}
            </span>
            <button
              type="button"
              className={styles.dateArrowBtn}
              onClick={() => setDate(shiftDay(date, 1))}
              disabled={isToday}
              style={isToday ? { opacity: 0.25 } : undefined}
            >
              <span className={styles.dateArrow} style={{ color: theme.brand }}>›</span>
            </button>
          </div>
          {!focusAssetId && (
            <div className={styles.toolbarRight}>
              <span className={styles.progress} style={{ color: hasInput ? theme.brand : theme.textMuted }}>
                {filledCount}/{assets.length} 입력
              </span>
              <TextButton typography="t6" color={theme.brand} onPress={fillAllUnchanged}>
                모두 변동 없음
              </TextButton>
            </div>
          )}
        </div>
        <span className={styles.dateHint} style={{ color: theme.textMuted }}>
          같은 날짜에 다시 입력하면 이전 값을 덮어써요
        </span>

        {/* 합계 변화 */}
        {!focusAssetId && hasInput && (
          <div
            className={styles.deltaSummary}
            style={{ backgroundColor: delta >= 0 ? theme.brandSoft : 'rgba(240,68,82,0.10)' }}
          >
            <span className={styles.deltaSumLabel} style={{ color: delta >= 0 ? theme.brand : theme.danger }}>합계 변화</span>
            <span className={styles.deltaSumValue} style={{ color: delta >= 0 ? theme.brand : theme.danger }}>
              {delta >= 0 ? '+' : ''}{krw(delta)}
            </span>
          </div>
        )}

        {/* 자산 행 */}
        {assets.map((asset, idx) => {
          const newVal = getNum(asset.id);
          const filled = newVal !== null;
          const diff = filled ? newVal - asset.value : null;
          // 부채는 잔액 증가가 악화 — diff 색 반전
          const diffGood = diff !== null && (asset.isLiability ? diff <= 0 : diff >= 0);
          const isFocused = focusedId === asset.id;
          return (
            <div key={asset.id}>
              <div
                className={styles.assetRow}
                style={{ borderBottom: idx < assets.length - 1 && !isFocused ? `1px solid ${theme.border}` : 'none' }}
              >
                <div className={styles.assetInfo}>
                  <div className={styles.assetNameRow}>
                    <span className={styles.assetName} style={{ color: theme.text }}>{asset.name}</span>
                    {asset.isLiability && <Badge type="red" badgeStyle="weak" size="tiny">부채</Badge>}
                    {filled && <span className={styles.filledDot} style={{ background: theme.brand }} />}
                  </div>
                  {asset.value > 0 ? (
                    <button type="button" className={styles.prevChip} onClick={() => copyPrev(asset)}>
                      <span style={{ color: theme.textMuted }}>이전 {krwShort(asset.value)}</span>
                      <span style={{ color: theme.brand, fontWeight: 700 }}> 그대로</span>
                    </button>
                  ) : (
                    <span className={styles.prevVal} style={{ color: theme.textMuted }}>첫 입력</span>
                  )}
                </div>
                <div className={styles.inputWrap}>
                  <TextField
                    variant="line"
                    placeholder="금액 입력"
                    keyboardType="numeric"
                    value={values[asset.id] ?? ''}
                    onChangeText={(t) => setValues((prev) => ({ ...prev, [asset.id]: formatAmount(t) }))}
                    style={{ width: 150 }}
                    inputRef={(el) => { inputRefs.current[asset.id] = el; }}
                    onFocus={() => setFocusedId(asset.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); focusNext(asset.id); }
                    }}
                  />
                  {filled && newVal >= 10_000 && (
                    <span className={styles.wonHelper} style={{ color: theme.textMuted }}>= {krwShort(newVal)}원</span>
                  )}
                  {diff !== null && diff !== 0 && (
                    <span className={styles.diffText} style={{ color: diffGood ? theme.brand : theme.danger }}>
                      {diff >= 0 ? '+' : ''}{krwShort(diff)}
                    </span>
                  )}
                </div>
              </div>

              {/* 포커스된 행 아래 빠른 증감 칩 */}
              {isFocused && (
                <div
                  className={styles.quickRow}
                  style={{ borderBottom: idx < assets.length - 1 ? `1px solid ${theme.border}` : 'none' }}
                >
                  {QUICK_STEPS.map((s) => (
                    <button
                      type="button"
                      key={s.label}
                      className={styles.quickChip}
                      style={{ background: theme.brandSoft, color: theme.brand }}
                      // input blur보다 먼저 처리 (mousedown)
                      onMouseDown={(e) => { e.preventDefault(); addToFocused(s.value); }}
                    >
                      {s.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    className={styles.quickChip}
                    style={{ background: theme.bg, color: theme.textMuted }}
                    onMouseDown={(e) => { e.preventDefault(); clearFocused(); }}
                  >
                    지우기
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </SheetModal>
  );
}
