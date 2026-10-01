import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/common/EmptyState';
import Segmented from '../../components/common/Segmented';
import { spacexApi, type SpacexEntryDto, type SpacexLatestOrderDto } from '../../api/spacex';
import { useTheme } from '../../lib/theme';
import { TE } from '../../lib/toss-emoji';
import { useLiveInterval } from '../../lib/use-live-interval';
import { signedPct } from '../../lib/live-format';
import { todayLocal } from '../../lib/date';
import { weekdayLabel } from '../../lib/spacex-insights';

type ThemeT = ReturnType<typeof useTheme>;

const WARN = '#F5A623';
const FILTERS = ['전체', '매수', '리밸런싱'] as const;
type Filter = (typeof FILTERS)[number];

function usd(v: number, d = 2): string {
  return `$${v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })}`;
}
/** 반올림이 아니라 절삭 — 토스 앱이 체결금액을 보여주는 방식과 맞춤(예: $1.999938 → $1.99) */
function usdTrunc(v: number): string {
  return usd(Math.trunc(v * 100) / 100);
}
/** 'YYYY-MM-DD' → '9. 30. (수)' */
function dateLabel(date: string): string {
  return `${Number(date.slice(5, 7))}. ${Number(date.slice(8, 10))}. (${weekdayLabel(date)})`;
}

function priceLine(e: SpacexEntryDto): { text: string; dim: boolean } {
  if (e.isRebalance && e.price === null) return { text: '현금 편입 · 매수 없음', dim: true };
  if (e.price === null) return { text: '가격 미기록 — 평단 계산에서 제외', dim: true };
  const qty = e.quantity !== null ? ` · ${Number(e.quantity).toFixed(4)}주` : '';
  return { text: `체결가 ${usd(e.price, 2)}${qty}`, dim: false };
}

/** 아직 기록(다음날 09:10 동기화)에 안 들어온 최근 주문 — 접수 대기 중이거나 체결됐지만 반영 전 */
function pendingRow(o: SpacexLatestOrderDto | null): SpacexLatestOrderDto | null {
  if (!o) return null;
  return o.status === 'PENDING' || (o.status === 'FILLED' && !o.recorded) ? o : null;
}

function PendingRow({ o, today, theme }: { o: SpacexLatestOrderDto; today: string; theme: ThemeT }) {
  const date = o.orderedAt.slice(0, 10);
  const filled = o.status === 'FILLED';
  return (
    <View style={[styles.row, { backgroundColor: WARN + '14' }]}>
      <View style={styles.rowTop}>
        <View style={styles.rowLeft}>
          <View style={[styles.dot, { backgroundColor: WARN }]} />
          <Text style={{ color: theme.textMuted, fontSize: 11.5 }}>
            {dateLabel(date)} · {date === today ? '오늘' : '최근'}
          </Text>
        </View>
        <Text style={{ color: theme.text, fontSize: 13, fontWeight: '700' }}>{o.amount !== null ? usdTrunc(o.amount) : '시장가'}</Text>
      </View>
      <View style={styles.rowSub}>
        <Text style={{ color: theme.textMuted, fontSize: 10.5 }}>
          {filled
            ? `체결가 ${o.avgPrice !== null ? usd(o.avgPrice) : '—'} · ${o.quantity !== null ? o.quantity.toFixed(4) : '—'}주`
            : `시장가 주문 접수 · 약 ${o.quantity !== null ? o.quantity.toFixed(4) : '—'}주`}
        </Text>
        <View style={[styles.statusPill, { backgroundColor: WARN + '26' }]}>
          <Text style={{ color: WARN, fontSize: 10, fontWeight: '800' }}>{filled ? '기록 반영 전' : '체결 대기'}</Text>
        </View>
      </View>
    </View>
  );
}

export default function SpacexEntriesScreen() {
  const theme = useTheme();
  const interval = useLiveInterval(5_000);
  const statusQ = useQuery({ queryKey: ['spacex-status'], queryFn: spacexApi.status, refetchInterval: interval });
  const [filter, setFilter] = useState<Filter>('전체');

  if (statusQ.isLoading || !statusQ.data) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <Loader size="large" />
      </View>
    );
  }

  const s = statusQ.data;
  const entries = s.entries;
  const pending = pendingRow(s.latestOrder);

  if (entries.length === 0 && !pending) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <EmptyState iconCode={TE.rocket} title="아직 기록이 없어요" />
      </View>
    );
  }

  const shown = entries.filter((e) => (filter === '전체' ? true : filter === '매수' ? !e.isRebalance : e.isRebalance));
  const showPending = pending !== null && filter !== '리밸런싱';
  const today = todayLocal();

  return (
    <ScrollView style={[styles.root, { backgroundColor: theme.bg }]} contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 12 }}>
      <View style={styles.sumBar}>
        <Text style={{ color: theme.textMuted, fontSize: 12 }}>
          {entries.length}건 · 원금 <Text style={{ color: theme.text, fontWeight: '800' }}>{usdTrunc(s.totalPrincipal)}</Text>
        </Text>
        {s.avgPrice !== null && (
          <Text style={{ color: theme.textMuted, fontSize: 12 }}>
            평균 체결가 <Text style={{ color: theme.text, fontWeight: '800' }}>{usd(s.avgPrice)}</Text>
          </Text>
        )}
      </View>

      <Segmented options={[...FILTERS]} value={filter} onChange={(v) => setFilter(v as Filter)} small alignment="fluid" />

      {shown.length === 0 && !showPending ? (
        <View style={[styles.listCard, { backgroundColor: theme.card, borderColor: theme.border, padding: 24, alignItems: 'center' }]}>
          <Text style={{ color: theme.textMuted, fontSize: 12.5 }}>{filter === '리밸런싱' ? '리밸런싱 기록이 없어요' : '기록이 없어요'}</Text>
        </View>
      ) : (
        <View style={[styles.listCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {showPending && <PendingRow o={pending} today={today} theme={theme} />}
          {shown.map((e, i) => {
            const price = priceLine(e);
            const vs = !e.isRebalance && e.price !== null && s.currentPrice !== null ? (s.currentPrice / e.price - 1) * 100 : null;
            return (
              <View key={e.id} style={[styles.row, (i > 0 || showPending) && { borderTopWidth: 1, borderColor: theme.border }]}>
                <View style={styles.rowTop}>
                  <View style={styles.rowLeft}>
                    <View style={[styles.dot, { backgroundColor: e.isRebalance ? theme.danger : theme.brand }]} />
                    <Text style={{ color: theme.textMuted, fontSize: 11.5 }}>{dateLabel(e.date)}</Text>
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
                <View style={styles.rowSub}>
                  <Text style={{ color: theme.textMuted, fontSize: 10.5, fontStyle: price.dim ? 'italic' : 'normal' }}>{price.text}</Text>
                  {vs !== null && (
                    <Text style={{ color: vs > 0 ? theme.brand : vs < 0 ? theme.danger : theme.textMuted, fontSize: 10.5, fontWeight: '700' }}>
                      현재가 대비 {signedPct(vs)}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {s.currentPrice !== null && filter !== '리밸런싱' && (
        <Text style={{ color: theme.textMuted, fontSize: 11, textAlign: 'center' }}>"현재가 대비"는 그 가격에 산 것이 지금 얼마나 올랐는지예요</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  sumBar: { flexDirection: 'row', justifyContent: 'space-between' },
  listCard: { borderWidth: 1, borderRadius: 14, overflow: 'hidden' },
  row: { padding: 12 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowSub: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 3 },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
  badge: { borderRadius: 999, paddingVertical: 1, paddingHorizontal: 6 },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  statusPill: { borderRadius: 999, paddingVertical: 1, paddingHorizontal: 7 },
});
