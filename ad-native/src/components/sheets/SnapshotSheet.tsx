import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Button from '../ui/Button';
import TextField from '../ui/TextField';
import TextButton from '../ui/TextButton';
import Badge from '../ui/Badge';
import SheetModal from './SheetModal';
import EmptyState from '../common/EmptyState';
import DatePicker from '../common/DatePicker';
import { useTheme } from '../../lib/theme';
import { useHouseholdData } from '../../queries/useHouseholdData';
import { useAuthStore } from '../../stores/auth.store';
import { krw, krwShort } from '../../lib/format';
import { todayLocal } from '../../lib/date';
import { getErrorMessage } from '../../lib/error';
import { TE } from '../../lib/toss-emoji';
import { useUpsertSnapshot, useBatchSnapshots } from '../../queries/mutations';

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
  const data = useHouseholdData();
  const { user } = useAuthStore();
  const myId = user ? Number(user.id) : null;
  const [values, setValues] = useState<Record<string, string>>({});
  const [date, setDate] = useState(todayLocal());
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const inputRefs = useRef<Record<string, TextInput | null>>({});
  const upsert = useUpsertSnapshot();
  const batch = useBatchSnapshots();

  // 열릴 때마다 초기화
  useEffect(() => {
    if (visible) {
      setValues({});
      setDate(todayLocal());
      setDatePickerOpen(false);
      setFocusedId(null);
      setError('');
    }
  }, [visible]);

  const assets = focusAssetId
    ? data.assets.filter((a) => a.id === focusAssetId)
    : data.assets.filter((a) => a.ownerUserId == null || a.ownerUserId === myId);

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
        await upsert.mutateAsync({ assetId: Number(asset.id), dto: { date, value } });
      } else {
        const items = assets
          .map((a) => ({ a, value: getNum(a.id) }))
          .filter((x): x is { a: typeof x.a; value: number } => x.value !== null)
          .map(({ a, value }) => ({ assetId: Number(a.id), date, value }));
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
          <Button display="full" size="big" type="primary" style="weak" onPress={onClose}>
            닫기
          </Button>
        }
      >
        <EmptyState iconCode={TE.mailbox} title="아직 등록된 자산이 없어요" desc="자산을 먼저 추가하면 스냅샷을 입력할 수 있어요" />
      </SheetModal>
    );
  }

  return (
    <SheetModal
      visible={visible}
      onClose={onClose}
      header={title}
      cta={
        <>
          {error ? <Text style={{ color: theme.danger, fontSize: 12 }}>{error}</Text> : null}
          <Button display="full" size="big" type="primary" disabled={!hasInput} loading={isPending} onPress={handleSave}>
            {focusAssetId ? '저장하기' : `${filledCount}개 저장하기`}
          </Button>
        </>
      }
      overlay={<DatePicker visible={datePickerOpen} value={date} maxDate={todayLocal()} onSelect={setDate} onClose={() => setDatePickerOpen(false)} />}
    >
      {/* 날짜 선택 + 진행 카운터 */}
      <View style={styles.toolbar}>
        <Pressable style={styles.dateBtn} onPress={() => setDatePickerOpen(true)}>
          <Text style={{ color: theme.text, fontSize: 14, fontWeight: '700' }}>
            {date}
            {isToday && <Text style={{ color: theme.textMuted, fontWeight: '500' }}> (오늘)</Text>}
          </Text>
          <Text style={{ color: theme.brand }}>▾</Text>
        </Pressable>
        {!focusAssetId && (
          <View style={styles.toolbarRight}>
            <Text style={{ color: hasInput ? theme.brand : theme.textMuted, fontSize: 12, fontWeight: '700' }}>
              {filledCount}/{assets.length} 입력
            </Text>
            <TextButton typography="t6" color={theme.brand} onPress={fillAllUnchanged}>
              모두 변동 없음
            </TextButton>
          </View>
        )}
      </View>
      <Text style={{ color: theme.textMuted, fontSize: 11, marginBottom: 12 }}>같은 날짜에 다시 입력하면 이전 값을 덮어써요</Text>

      {/* 합계 변화 */}
      {!focusAssetId && hasInput && (
        <View style={[styles.deltaSummary, { backgroundColor: delta >= 0 ? theme.brandSoft : 'rgba(240,68,82,0.10)' }]}>
          <Text style={{ color: delta >= 0 ? theme.brand : theme.danger, fontSize: 12, fontWeight: '700' }}>합계 변화</Text>
          <Text style={{ color: delta >= 0 ? theme.brand : theme.danger, fontSize: 16, fontWeight: '800' }}>
            {delta >= 0 ? '+' : ''}
            {krw(delta)}
          </Text>
        </View>
      )}

      {/* 자산 행 */}
      {assets.map((asset, idx) => {
        const newVal = getNum(asset.id);
        const filled = newVal !== null;
        const diff = filled ? newVal - asset.value : null;
        const diffGood = diff !== null && (asset.isLiability ? diff <= 0 : diff >= 0);
        const isFocused = focusedId === asset.id;
        return (
          <View key={asset.id}>
            <View style={[styles.assetRow, idx < assets.length - 1 && !isFocused && { borderBottomWidth: 1, borderColor: theme.border }]}>
              <View style={styles.assetInfo}>
                <View style={styles.assetNameRow}>
                  <Text style={{ color: theme.text, fontSize: 14, fontWeight: '600' }}>{asset.name}</Text>
                  {asset.isLiability && (
                    <Badge type="red" badgeStyle="weak" size="tiny">
                      부채
                    </Badge>
                  )}
                  {filled && <View style={[styles.filledDot, { backgroundColor: theme.brand }]} />}
                </View>
                {asset.value > 0 ? (
                  <Pressable onPress={() => copyPrev(asset)}>
                    <Text style={{ fontSize: 12 }}>
                      <Text style={{ color: theme.textMuted }}>이전 {krwShort(asset.value)}</Text>
                      <Text style={{ color: theme.brand, fontWeight: '700' }}> 그대로</Text>
                    </Text>
                  </Pressable>
                ) : (
                  <Text style={{ color: theme.textMuted, fontSize: 12 }}>첫 입력</Text>
                )}
              </View>
              <View style={styles.inputWrap}>
                <TextField
                  variant="line"
                  placeholder="금액 입력"
                  keyboardType="numeric"
                  value={values[asset.id] ?? ''}
                  onChangeText={(t) => setValues((prev) => ({ ...prev, [asset.id]: formatAmount(t) }))}
                  style={{ width: 150 }}
                  ref={(el) => {
                    inputRefs.current[asset.id] = el;
                  }}
                  onFocus={() => setFocusedId(asset.id)}
                  onSubmitEditing={() => focusNext(asset.id)}
                />
                {filled && newVal >= 10_000 && <Text style={{ color: theme.textMuted, fontSize: 11 }}>= {krwShort(newVal)}원</Text>}
                {diff !== null && diff !== 0 && (
                  <Text style={{ color: diffGood ? theme.brand : theme.danger, fontSize: 12, fontWeight: '700' }}>
                    {diff >= 0 ? '+' : ''}
                    {krwShort(diff)}
                  </Text>
                )}
              </View>
            </View>

            {/* 포커스된 행 아래 빠른 증감 칩 */}
            {isFocused && (
              <View style={[styles.quickRow, idx < assets.length - 1 && { borderBottomWidth: 1, borderColor: theme.border }]}>
                {QUICK_STEPS.map((s) => (
                  <Pressable key={s.label} style={[styles.quickChip, { backgroundColor: theme.brandSoft }]} onPress={() => addToFocused(s.value)}>
                    <Text style={{ color: theme.brand, fontSize: 12, fontWeight: '700' }}>{s.label}</Text>
                  </Pressable>
                ))}
                <Pressable style={[styles.quickChip, { backgroundColor: theme.bg }]} onPress={clearFocused}>
                  <Text style={{ color: theme.textMuted, fontSize: 12, fontWeight: '700' }}>지우기</Text>
                </Pressable>
              </View>
            )}
          </View>
        );
      })}
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  toolbarRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  deltaSummary: { borderRadius: 12, padding: 14, marginBottom: 12, gap: 4 },
  assetRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, gap: 12 },
  assetInfo: { flex: 1, minWidth: 0, gap: 4 },
  assetNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  filledDot: { width: 6, height: 6, borderRadius: 3 },
  inputWrap: { alignItems: 'flex-end', gap: 2 },
  quickRow: { flexDirection: 'row', gap: 8, paddingBottom: 12, flexWrap: 'wrap' },
  quickChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
});
