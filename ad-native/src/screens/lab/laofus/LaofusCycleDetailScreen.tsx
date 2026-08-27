import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Loader from '../../../components/ui/Loader';
import EmptyState from '../../../components/common/EmptyState';
import { laofusRestApi } from '../../../api/laofus';
import { useTheme } from '../../../lib/theme';
import { TE } from '../../../lib/toss-emoji';
import type { LaofusStackParamList } from '../../../navigation/LaofusStack';

type Props = NativeStackScreenProps<LaofusStackParamList, 'LaofusCycleDetail'>;

function n(v: string | number | null | undefined): number {
  return Number(v ?? 0);
}
function usd(v: number, d = 2): string {
  return `$${v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })}`;
}
function kstDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric' });
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

export default function LaofusCycleDetailScreen({ route }: Props) {
  const theme = useTheme();
  const { cycleNo } = route.params;
  const statusQ = useQuery({ queryKey: ['laofus-status'], queryFn: laofusRestApi.status });

  if (statusQ.isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <Loader size="large" />
      </View>
    );
  }

  const c = statusQ.data?.cycles.find((x) => x.cycleNo === cycleNo);
  if (!c) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <EmptyState iconCode={TE.search} title={`${cycleNo}차 사이클을 찾을 수 없어요`} />
      </View>
    );
  }

  const sortedTrades = [...c.trades].reverse();
  const real = c.trades.filter((t) => t.kind !== '이월');
  const buys = real.filter((t) => t.side === 'BUY').reduce((a, t) => a + n(t.amount), 0);
  const sells = real.filter((t) => t.side === 'SELL').reduce((a, t) => a + n(t.amount), 0);
  const last = real[real.length - 1];
  const days = last ? Math.round((new Date(last.date).getTime() - new Date(c.startDate).getTime()) / 86400000) + 1 : 0;
  const T = last ? n(last.tAfter) : 0;

  return (
    <ScrollView style={[styles.root, { backgroundColor: theme.bg }]} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <View style={styles.tileGrid}>
        <Tile theme={theme} label="총 투입" value={usd(buys)} sub={`원금의 ${((buys / n(c.principal)) * 100).toFixed(0)}%`} />
        <Tile theme={theme} label="총 회수" value={usd(sells)} />
        <Tile theme={theme} label="현재 T" value={String(T)} sub={`남은 회차 ${40 - T}`} />
        <Tile theme={theme} label="거래 횟수" value={`${real.length}차`} sub={`${days}일간`} />
      </View>

      <View style={[styles.listCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {sortedTrades.map((t, i) => (
          <View key={t.id} style={[styles.tradeRow, i > 0 && { borderTopWidth: 1, borderColor: theme.border }]}>
            <View style={styles.tradeTop}>
              <View style={styles.tradeKind}>
                <View style={[styles.dot, { backgroundColor: t.side === 'SELL' ? theme.danger : theme.brand }]} />
                <Text style={{ color: theme.text, fontSize: 13, fontWeight: '700' }}>
                  {t.seq}차 {t.kind}
                </Text>
                <Text style={{ color: theme.textMuted, fontSize: 11.5 }}>· {kstDate(t.date)}</Text>
              </View>
              <Text style={{ color: theme.text, fontSize: 13, fontWeight: '700' }}>{usd(n(t.amount))}</Text>
            </View>
            <Text style={{ color: theme.textMuted, fontSize: 11.5, marginTop: 3 }}>
              체결가 {usd(n(t.price))} · 수량 {n(t.quantity).toFixed(6)} · T {n(t.tBefore)}→{n(t.tAfter)} · 평단 {usd(n(t.avgAfter))} · 잔금 {usd(n(t.cashAfter))}
            </Text>
            {t.note && <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 3, fontStyle: 'italic' }}>{t.note}</Text>}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  tile: { width: '48%', borderWidth: 1, borderRadius: 12, padding: 12 },
  listCard: { borderWidth: 1, borderRadius: 14, overflow: 'hidden' },
  tradeRow: { padding: 12 },
  tradeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tradeKind: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
});
