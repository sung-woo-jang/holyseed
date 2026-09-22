import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Loader from '../../../components/ui/Loader';
import EmptyState from '../../../components/common/EmptyState';
import { laofusRestApi } from '../../../api/laofus';
import { useTheme } from '../../../lib/theme';
import { TE } from '../../../lib/toss-emoji';
import type { LaofusStackParamList } from '../../../navigation/LaofusStack';

type Props = NativeStackScreenProps<LaofusStackParamList, 'LaofusCycles'>;
type StatusFilter = '전체' | '진행중' | '종료';

function n(v: string | number | null | undefined): number {
  return Number(v ?? 0);
}
function usd(v: number, d = 2): string {
  return `$${v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })}`;
}
function kstDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric' });
}

export default function LaofusCyclesScreen({ navigation }: Props) {
  const theme = useTheme();
  const statusQ = useQuery({ queryKey: ['laofus-status'], queryFn: laofusRestApi.status });
  const [filter, setFilter] = useState<StatusFilter>('전체');
  const [sortDir, setSortDir] = useState<'latest' | 'oldest'>('latest');

  if (statusQ.isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <Loader size="large" />
      </View>
    );
  }

  const cycles = [...(statusQ.data?.cycles ?? [])]
    .filter((c) => {
      if (filter === '진행중') return c.endDate === null;
      if (filter === '종료') return c.endDate !== null;
      return true;
    })
    .sort((a, b) => (sortDir === 'latest' ? b.cycleNo - a.cycleNo : a.cycleNo - b.cycleNo));

  return (
    <ScrollView style={[styles.root, { backgroundColor: theme.bg }]} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <View style={styles.filterRow}>
        {(['전체', '진행중', '종료'] as const).map((f) => {
          const active = filter === f;
          return (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.chip, { borderColor: active ? theme.brand : theme.border, backgroundColor: active ? theme.brandSoft : theme.card }]}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: active ? theme.brand : theme.text }}>{f}</Text>
            </Pressable>
          );
        })}
        <Pressable
          onPress={() => setSortDir((d) => (d === 'latest' ? 'oldest' : 'latest'))}
          style={[styles.chip, { marginLeft: 'auto', borderColor: theme.border, backgroundColor: theme.card }]}
        >
          <Text style={{ fontSize: 12, fontWeight: '700', color: theme.text }}>{sortDir === 'latest' ? '최신순 ↓' : '오래된순 ↑'}</Text>
        </Pressable>
      </View>

      {cycles.length === 0 ? (
        <EmptyState iconCode={TE.chartUp} title={filter === '전체' ? '사이클 기록이 없어요' : `${filter} 사이클이 없어요`} />
      ) : (
        cycles.map((c) => {
          const real = c.trades.filter((t) => t.kind !== '이월');
          const last = real[real.length - 1];
          const T = last ? n(last.tAfter) : 0;
          const days = last ? Math.round((new Date(last.date).getTime() - new Date(c.startDate).getTime()) / 86400000) + 1 : 0;
          const profit = c.profit != null ? n(c.profit) : null;

          return (
            <Pressable
              key={c.id}
              style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => navigation.navigate('LaofusCycleDetail', { cycleNo: c.cycleNo })}
            >
              <View style={styles.topRow}>
                <Text style={{ color: theme.text, fontSize: 15, fontWeight: '800' }}>{c.cycleNo}차 사이클</Text>
                {profit != null && (
                  <Text style={{ color: profit >= 0 ? theme.brand : theme.danger, fontSize: 13, fontWeight: '700' }}>
                    {profit >= 0 ? '+' : ''}
                    {usd(profit)} ({(n(c.profitPct) * 100).toFixed(2)}%)
                  </Text>
                )}
              </View>
              <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 4 }}>
                {kstDate(c.startDate)} ~ {c.endDate ? kstDate(c.endDate) : '진행 중'} ({days}일째)
              </Text>
              {!c.endDate && (
                <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 2 }}>
                  T={T} · 남은 회차 {20 - T}
                </Text>
              )}
              <Text style={{ color: theme.textMuted, fontSize: 11.5, marginTop: 6 }}>{real.length}차 거래 →</Text>
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 12, alignItems: 'center' },
  chip: { height: 30, paddingHorizontal: 12, borderRadius: 15, borderWidth: 1, justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 10 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
