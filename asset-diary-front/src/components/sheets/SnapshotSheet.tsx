import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button, TextField } from '@toss/tds-react-native';
import SheetModal from './SheetModal';
import EmptyState from '../common/EmptyState';
import { useTheme } from '../../lib/theme';
import { useDataSource } from '../../lib/data-source';
import { krw, krwShort } from '../../lib/format';
import TossEmoji from '../common/TossEmoji';
import { TE } from '../../lib/toss-emoji';
import { useUpsertSnapshot, useBatchSnapshots } from '../../queries/mutations';

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
          dto: { date: today, value, ...(asset.fxRate ? { fxRateToKRW: asset.fxRate } : {}) },
        });
      } else {
        const items = assets
          .map((a) => ({ a, value: getNum(a.id) }))
          .filter((x): x is { a: typeof x.a; value: number } => x.value !== null)
          .map(({ a, value }) => ({
            assetId: Number(a.id),
            date: today,
            value,
            ...(a.fxRate ? { fxRateToKRW: a.fxRate } : {}),
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
        <View style={styles.confirmBox}>
          <TossEmoji code={TE.check} size={64} />
          <Text style={[styles.confirmTitle, { color: theme.text }]}>저장 완료!</Text>
          <Text style={[styles.confirmSub, { color: theme.textMuted }]}>대시보드가 업데이트됐어요</Text>
        </View>
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
          <View style={styles.cta}>
            <Button display="full" size="big" type="primary" style="weak" onPress={onClose}>
              닫기
            </Button>
          </View>
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
        <View style={styles.cta}>
          {error ? <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text> : null}
          <Button display="full" size="big" type="primary" disabled={!hasInput} loading={isPending} onPress={handleSave}>
            저장하기
          </Button>
        </View>
      }
    >
      <View style={styles.body}>
        {!focusAssetId && hasInput && (
          <View style={[styles.deltaSummary, { backgroundColor: delta >= 0 ? theme.brandSoft : '#FEE2E2' }]}>
            <Text style={[styles.deltaSumLabel, { color: delta >= 0 ? theme.brand : theme.danger }]}>합계 변화</Text>
            <Text style={[styles.deltaSumValue, { color: delta >= 0 ? theme.brand : theme.danger }]}>
              {delta >= 0 ? '+' : ''}{krw(delta)}
            </Text>
          </View>
        )}
        {assets.map((asset, idx) => {
          const newVal = getNum(asset.id);
          const diff = newVal !== null ? newVal - asset.value : null;
          return (
            <View key={asset.id} style={[styles.assetRow, { borderBottomColor: theme.border, borderBottomWidth: idx < assets.length - 1 ? 1 : 0 }]}>
              <View style={styles.assetInfo}>
                <Text style={[styles.assetName, { color: theme.text }]}>{asset.name}</Text>
                <Text style={[styles.prevVal, { color: theme.textMuted }]}>이전: {krwShort(asset.value)}</Text>
              </View>
              <View style={styles.inputWrap}>
                <TextField
                  variant="line"
                  placeholder="금액 입력"
                  keyboardType="numeric"
                  value={values[asset.id] ?? ''}
                  onChangeText={(t) => setValues((prev) => ({ ...prev, [asset.id]: formatAmount(t) }))}
                  style={styles.tfInput}
                />
                {diff !== null && (
                  <Text style={[styles.diffText, { color: diff >= 0 ? theme.brand : theme.danger }]}>
                    {diff >= 0 ? '+' : ''}{krwShort(diff)}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  confirmBox: { paddingVertical: 60, alignItems: 'center', gap: 12 },
  confirmTitle: { fontSize: 22, fontWeight: '800' },
  confirmSub: { fontSize: 14 },
  body: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 12 },
  deltaSummary: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  deltaSumLabel: { fontSize: 13 },
  deltaSumValue: { fontSize: 16, fontWeight: '700' },
  assetRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  assetInfo: { flex: 1 },
  assetName: { fontSize: 14, fontWeight: '600' },
  prevVal: { fontSize: 12, marginTop: 2 },
  inputWrap: { alignItems: 'flex-end', gap: 4, width: 140 },
  tfInput: { width: 140 },
  diffText: { fontSize: 12, fontWeight: '600' },
  cta: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 },
  errorText: { fontSize: 13, textAlign: 'center', marginBottom: 8 },
});
