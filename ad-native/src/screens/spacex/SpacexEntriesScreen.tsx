import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/common/EmptyState';
import Segmented from '../../components/common/Segmented';
import SheetModal from '../../components/sheets/SheetModal';
import { spacexApi, type SpacexEntryDto, type SpacexLatestOrderDto } from '../../api/spacex';
import { dcaColor, dcaLabel } from '../../lib/dca';
import { useTheme } from '../../lib/theme';
import { TE } from '../../lib/toss-emoji';
import { useLiveInterval } from '../../lib/use-live-interval';
import { signedPct } from '../../lib/live-format';
import { todayLocal } from '../../lib/date';
import { weekdayLabel } from '../../lib/spacex-insights';
import QueryError from '../../components/common/QueryError';

type ThemeT = ReturnType<typeof useTheme>;

const WARN = '#F5A623';
const ALL = '전체';

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

function SymbolBadge({ symbol }: { symbol: string }) {
  const color = dcaColor(symbol);
  return (
    <View style={[styles.symBadge, { backgroundColor: color + '1F' }]}>
      <Text style={{ color, fontSize: 9.5, fontWeight: '800' }}>{symbol}</Text>
    </View>
  );
}

function PendingRow({ o, symbol, today, theme }: { o: SpacexLatestOrderDto; symbol: string; today: string; theme: ThemeT }) {
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
          <SymbolBadge symbol={symbol} />
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

function DetailTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.detailTile, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={{ color: theme.textMuted, fontSize: 11 }}>{label}</Text>
      <Text style={{ color: theme.text, fontSize: 15, fontWeight: '800', marginTop: 2 }}>{value}</Text>
      {sub ? <Text style={{ color: theme.textMuted, fontSize: 10.5, marginTop: 2 }}>{sub}</Text> : null}
    </View>
  );
}

/** 기록 상세 — 기록 내용과 그날 일봉(시가·고가·저가·종가) */
function EntrySheet({ entry, onClose }: { entry: SpacexEntryDto | null; onClose: () => void }) {
  const theme = useTheme();
  const e = entry;
  const hasDay = !!e && e.dayOpen != null && e.dayHigh != null && e.dayLow != null && e.dayClose != null;
  const pos = e && hasDay && e.price !== null && e.dayHigh! > e.dayLow! ? ((e.price - e.dayLow!) / (e.dayHigh! - e.dayLow!)) * 100 : null;

  return (
    <SheetModal visible={!!e} onClose={onClose} header={e ? dateLabel(e.date) : undefined}>
      {e ? (
        <View style={{ gap: 16 }}>
          <View style={styles.detailGrid}>
            <DetailTile label={e.isRebalance ? '금액 (리밸런싱)' : '매수 금액'} value={`${e.amount >= 0 ? '' : '-'}${usdTrunc(Math.abs(e.amount))}`} />
            <DetailTile label="체결가" value={e.price !== null ? usd(e.price) : '—'} sub={e.quantity !== null ? `${Number(e.quantity).toFixed(4)}주` : undefined} />
          </View>
          {e.note ? <Text style={{ color: theme.textMuted, fontSize: 12.5, lineHeight: 18 }}>{e.note}</Text> : null}

          <View>
            <Text style={{ color: theme.textMuted, fontSize: 12.5, fontWeight: '700', marginBottom: 8 }}>그날 일봉</Text>
            {hasDay ? (
              <>
                <View style={styles.detailGrid}>
                  <DetailTile label="시가" value={usd(e.dayOpen!)} />
                  <DetailTile label="종가" value={usd(e.dayClose!)} />
                  <DetailTile label="고가" value={usd(e.dayHigh!)} />
                  <DetailTile label="저가" value={usd(e.dayLow!)} />
                </View>
                {pos !== null ? (
                  <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 8 }}>
                    체결가 {usd(e.price!)}는 그날 저가~고가 범위의 {Math.round(pos)}% 지점이에요
                  </Text>
                ) : null}
              </>
            ) : (
              <Text style={{ color: theme.textMuted, fontSize: 12.5, lineHeight: 18 }}>
                아직 일봉이 없어요. 그날 장이 끝난 뒤(기록은 보통 다음 날) 자동으로 채워져요.
              </Text>
            )}
          </View>
        </View>
      ) : null}
    </SheetModal>
  );
}

/** 모으기 매수 내역 — 전 종목 기록(최신순) + 종목 필터 */
export default function SpacexEntriesScreen() {
  const theme = useTheme();
  const interval = useLiveInterval(5_000);
  const entriesQ = useQuery({ queryKey: ['spacex-entries'], queryFn: spacexApi.entries, refetchInterval: interval });
  // 종목 이름·현재가·접수 대기 주문은 전체 화면과 같은 요약을 같이 쓴다
  const overviewQ = useQuery({ queryKey: ['dca-overview'], queryFn: spacexApi.overview, refetchInterval: interval });
  const [filter, setFilter] = useState<string>(ALL);
  const [detail, setDetail] = useState<SpacexEntryDto | null>(null);

  if (entriesQ.isError && !entriesQ.data) return <QueryError onRetry={() => void entriesQ.refetch()} />;
  if (entriesQ.isLoading || !entriesQ.data) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <Loader size="large" />
      </View>
    );
  }

  const plans = overviewQ.data?.plans ?? [];
  const entries = entriesQ.data;
  const today = todayLocal();
  const labelOf = (symbol: string) => plans.find((p) => p.symbol === symbol)?.name ?? dcaLabel(symbol);
  const symbols = plans.length > 0 ? plans.map((p) => p.symbol) : [...new Set(entries.map((e) => e.symbol))];
  const options = [ALL, ...symbols.map(labelOf)];
  const selected = filter === ALL ? null : (symbols.find((sym) => labelOf(sym) === filter) ?? null);

  const shown = entries.filter((e) => selected === null || e.symbol === selected);
  const pendings = plans
    .filter((p) => selected === null || p.symbol === selected)
    .map((p) => ({ symbol: p.symbol, o: pendingRow(p.latestOrder) }))
    .filter((x): x is { symbol: string; o: SpacexLatestOrderDto } => x.o !== null);
  const priceOf = (symbol: string) => plans.find((p) => p.symbol === symbol)?.currentPrice ?? null;
  const principal = shown.reduce((sum, e) => sum + Number(e.amount), 0);
  const selectedPlan = selected ? plans.find((p) => p.symbol === selected) : undefined;

  return (
    <ScrollView style={[styles.root, { backgroundColor: theme.bg }]} contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 12 }}>
      <Segmented options={options} value={options.includes(filter) ? filter : ALL} onChange={setFilter} small alignment="fluid" />

      <View style={styles.sumBar}>
        <Text style={{ color: theme.textMuted, fontSize: 12 }}>
          {shown.length}건 · 원금 <Text style={{ color: theme.text, fontWeight: '800' }}>{usdTrunc(principal)}</Text>
        </Text>
        {selectedPlan?.avgPrice != null && (
          <Text style={{ color: theme.textMuted, fontSize: 12 }}>
            평균 체결가 <Text style={{ color: theme.text, fontWeight: '800' }}>{usd(selectedPlan.avgPrice)}</Text>
          </Text>
        )}
      </View>

      {shown.length === 0 && pendings.length === 0 ? (
        <View style={[styles.listCard, { backgroundColor: theme.card, borderColor: theme.border, padding: 24, alignItems: 'center', gap: 4 }]}>
          {entries.length === 0 ? (
            <EmptyState iconCode={TE.piggy} title="아직 기록이 없어요" />
          ) : (
            <>
              <Text style={{ color: theme.text, fontSize: 13.5, fontWeight: '700' }}>아직 {filter} 매수 기록이 없어요</Text>
              <Text style={{ color: theme.textMuted, fontSize: 12, textAlign: 'center', lineHeight: 17 }}>
                {selectedPlan && selectedPlan.planStartDate > today
                  ? `${Number(selectedPlan.planStartDate.slice(5, 7))}/${Number(selectedPlan.planStartDate.slice(8, 10))} 밤 첫 매수가 체결되면 다음날 오전 9시 10분에 들어와요`
                  : '체결되면 다음날 오전 9시 10분에 들어와요'}
              </Text>
            </>
          )}
        </View>
      ) : (
        <View style={[styles.listCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {pendings.map((p, i) => (
            <View key={p.o.orderId} style={i > 0 ? { borderTopWidth: 1, borderColor: theme.border } : null}>
              <PendingRow o={p.o} symbol={p.symbol} today={today} theme={theme} />
            </View>
          ))}
          {shown.map((e, i) => {
            const price = priceLine(e);
            const current = priceOf(e.symbol);
            const vs = !e.isRebalance && e.price !== null && current !== null ? (current / e.price - 1) * 100 : null;
            return (
              <Pressable
                key={e.id}
                onPress={() => setDetail(e)}
                style={({ pressed }) => [styles.row, (i > 0 || pendings.length > 0) && { borderTopWidth: 1, borderColor: theme.border }, pressed && { opacity: 0.6 }]}
              >
                <View style={styles.rowTop}>
                  <View style={styles.rowLeft}>
                    <View style={[styles.dot, { backgroundColor: e.isRebalance ? theme.danger : dcaColor(e.symbol) }]} />
                    <Text style={{ color: theme.textMuted, fontSize: 11.5 }}>{dateLabel(e.date)}</Text>
                    <SymbolBadge symbol={e.symbol} />
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
              </Pressable>
            );
          })}
        </View>
      )}

      {shown.length > 0 && (
        <Text style={{ color: theme.textMuted, fontSize: 11, textAlign: 'center' }}>"현재가 대비"는 그 가격에 산 것이 지금 얼마나 올랐는지예요</Text>
      )}
      <EntrySheet entry={detail ? entries.find((x) => x.id === detail.id) ?? detail : null} onClose={() => setDetail(null)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  detailTile: { width: '48%', borderWidth: 1, borderRadius: 12, padding: 12 },
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
  symBadge: { borderRadius: 5, paddingVertical: 1, paddingHorizontal: 5 },
});
