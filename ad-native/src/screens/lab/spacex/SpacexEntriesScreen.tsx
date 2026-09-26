import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import Loader from '../../../components/ui/Loader';
import EmptyState from '../../../components/common/EmptyState';
import { spacexApi, type SpacexEntryDto } from '../../../api/spacex';
import { useTheme } from '../../../lib/theme';
import { TE } from '../../../lib/toss-emoji';

function usd(v: number, d = 2): string {
  return `$${v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })}`;
}
/** 반올림이 아니라 절삭 — 토스 앱이 체결금액을 보여주는 방식과 맞춤(예: $1.999938 → $1.99) */
function usdTrunc(v: number): string {
  return usd(Math.trunc(v * 100) / 100);
}
function kstDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric' });
}

function priceLine(e: SpacexEntryDto): { text: string; dim: boolean } {
  if (e.isRebalance && e.price === null) return { text: '현금 편입 · 매수 없음', dim: true };
  if (e.price === null) return { text: '가격 미기록 — 평단 계산에서 제외', dim: true };
  const qty = e.quantity !== null ? ` · ${Number(e.quantity).toFixed(4)}주` : '';
  return { text: `체결가 ${usd(e.price, 2)}${qty}`, dim: false };
}

export default function SpacexEntriesScreen() {
  const theme = useTheme();
  const statusQ = useQuery({ queryKey: ['spacex-status'], queryFn: spacexApi.status });

  if (statusQ.isLoading || !statusQ.data) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <Loader size="large" />
      </View>
    );
  }

  const entries = statusQ.data.entries;

  if (entries.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <EmptyState iconCode={TE.rocket} title="아직 기록이 없어요" />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.root, { backgroundColor: theme.bg }]} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <View style={[styles.listCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {entries.map((e, i) => {
          const price = priceLine(e);
          return (
            <View key={e.id} style={[styles.row, i > 0 && { borderTopWidth: 1, borderColor: theme.border }]}>
              <View style={styles.rowTop}>
                <View style={styles.rowLeft}>
                  <View style={[styles.dot, { backgroundColor: e.isRebalance ? theme.danger : theme.brand }]} />
                  <Text style={{ color: theme.textMuted, fontSize: 11.5 }}>{kstDate(e.date)}</Text>
                  {e.isRebalance && (
                    <View style={[styles.badge, { backgroundColor: theme.danger }]}>
                      <Text style={styles.badgeText}>리밸런싱</Text>
                    </View>
                  )}
                </View>
                <Text style={{ color: theme.text, fontSize: 13, fontWeight: '700' }}>
                  {e.amount >= 0 ? '' : '-'}
                  {usdTrunc(Math.abs(e.amount))}
                </Text>
              </View>
              {e.note && <Text style={{ color: theme.textMuted, fontSize: 11.5, marginTop: 3 }}>{e.note}</Text>}
              <Text style={{ color: price.dim ? theme.textMuted : theme.textMuted, fontSize: 10.5, marginTop: 3, fontStyle: price.dim ? 'italic' : 'normal' }}>
                {price.text}
              </Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listCard: { borderWidth: 1, borderRadius: 14, overflow: 'hidden' },
  row: { padding: 12 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
  badge: { borderRadius: 999, paddingVertical: 1, paddingHorizontal: 6 },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
});
