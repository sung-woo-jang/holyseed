import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import Loader from '../../../components/ui/Loader';
import Button from '../../../components/ui/Button';
import AppToast from '../../../components/common/AppToast';
import { laofusRestApi } from '../../../api/laofus';
import { useTheme } from '../../../lib/theme';
import { getErrorMessage } from '../../../lib/error';
import { todayLocal } from '../../../lib/date';

function n(v: string | number | null | undefined): number {
  return Number(v ?? 0);
}
function usd(v: number, d = 2): string {
  return `$${v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })}`;
}
function krw(v: number): string {
  return `₩${Math.round(v).toLocaleString('ko-KR')}`;
}

function Tile({ label, value, sub, theme }: { label: string; value: string; sub?: string; theme: ReturnType<typeof useTheme> }) {
  return (
    <View style={[styles.tile, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={{ color: theme.textMuted, fontSize: 11.5 }}>{label}</Text>
      <Text style={{ color: theme.text, fontSize: 16, fontWeight: '800', marginTop: 2 }}>{value}</Text>
      {sub && <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 2 }}>{sub}</Text>}
    </View>
  );
}

export default function LaofusWealthScreen() {
  const theme = useTheme();
  const [recording, setRecording] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState('');

  const accountQ = useQuery({ queryKey: ['laofus-account'], queryFn: laofusRestApi.account });
  const snapshotsQ = useQuery({ queryKey: ['laofus-account-snapshots'], queryFn: laofusRestApi.accountSnapshots });

  async function onRefresh() {
    setRefreshing(true);
    try {
      await Promise.all([accountQ.refetch(), snapshotsQ.refetch()]);
    } finally {
      setRefreshing(false);
    }
  }

  async function recordToday() {
    setRecording(true);
    try {
      await laofusRestApi.recordAccountSnapshot();
      await snapshotsQ.refetch();
      setToast('오늘 스냅샷을 기록했어요');
    } catch (e) {
      setToast(getErrorMessage(e, '스냅샷 기록에 실패했어요'));
    } finally {
      setRecording(false);
    }
  }

  if (accountQ.isLoading || snapshotsQ.isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <Loader size="large" />
      </View>
    );
  }

  const account = accountQ.data;
  const snapshots = [...(snapshotsQ.data ?? [])].reverse();
  const fx = account?.exchangeRate ? n(account.exchangeRate.rate) : null;
  const stockValueUsd = account?.holdings.items.reduce((a, h) => a + n(h.marketValue.amount), 0) ?? 0;
  const cashUsd = n(account?.buyingPower.usd);
  const cashKrw = n(account?.buyingPower.krw);
  const totalValueUsd = stockValueUsd + cashUsd;
  const totalValueKrw = fx ? totalValueUsd * fx + cashKrw : null;
  const alreadyRecordedToday = snapshots[0]?.date === todayLocal();

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: theme.bg }]}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.brand} colors={[theme.brand]} />}
    >
      <Text style={{ color: theme.textMuted, fontSize: 12.5, lineHeight: 18, marginBottom: 12 }}>
        무매(SOXL)+VR(TQQQ)이 공유하는 토스증권 계좌의 총자산이에요. 매일 자동 기록되고, 아래 버튼으로 지금 즉시 다시 기록할 수도 있어요.
      </Text>

      <View style={styles.tileGrid}>
        <Tile theme={theme} label="총자산 (실시간)" value={totalValueKrw !== null ? krw(totalValueKrw) : '—'} sub={usd(totalValueUsd)} />
        <Tile theme={theme} label="주식 평가금" value={usd(stockValueUsd)} />
        <Tile theme={theme} label="예수금 USD" value={usd(cashUsd)} />
        <Tile theme={theme} label="예수금 KRW" value={krw(cashKrw)} />
      </View>

      <View style={{ marginBottom: 16 }}>
        <Button display="full" size="medium" type="primary" style="weak" loading={recording} onPress={recordToday}>
          {alreadyRecordedToday ? '오늘 스냅샷 다시 기록' : '오늘 스냅샷 기록'}
        </Button>
        {alreadyRecordedToday && (
          <Text style={{ color: theme.textMuted, fontSize: 11.5, marginTop: 6, textAlign: 'center' }}>오늘 이미 기록됨 — 다시 누르면 최신 값으로 덮어써요</Text>
        )}
      </View>

      <Text style={[styles.sectionTitle, { color: theme.text }]}>일별 기록 ({snapshots.length}건)</Text>
      {snapshots.length === 0 ? (
        <Text style={{ color: theme.textMuted, fontSize: 13 }}>아직 기록 없음 — 위 버튼으로 오늘자를 기록해보세요</Text>
      ) : (
        <View style={[styles.listCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {snapshots.map((s, i) => {
            const prev = snapshots[i + 1];
            const delta = prev ? n(s.totalValueKrw) - n(prev.totalValueKrw) : null;
            return (
              <View key={s.id} style={[styles.snapRow, i > 0 && { borderTopWidth: 1, borderColor: theme.border }]}>
                <Text style={{ color: theme.text, fontSize: 13, fontWeight: '700' }}>{s.date}</Text>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: theme.text, fontSize: 13, fontWeight: '700' }}>{krw(n(s.totalValueKrw))}</Text>
                  <Text style={{ color: delta == null ? theme.textMuted : delta >= 0 ? theme.brand : theme.danger, fontSize: 11.5 }}>
                    {delta == null ? '—' : `${delta >= 0 ? '+' : ''}${krw(delta)}`}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
      <AppToast open={!!toast} text={toast} onClose={() => setToast('')} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  tile: { width: '48%', borderWidth: 1, borderRadius: 12, padding: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  listCard: { borderWidth: 1, borderRadius: 14, overflow: 'hidden' },
  snapRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12 },
});
