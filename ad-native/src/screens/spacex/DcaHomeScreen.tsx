import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Loader from '../../components/ui/Loader';
import QueryError from '../../components/common/QueryError';
import { Icon } from '../../components/common/Icon';
import { spacexApi, type DcaPlanSummaryDto } from '../../api/spacex';
import { laofusRestApi, type LiveDto } from '../../api/laofus';
import { useTheme } from '../../lib/theme';
import { todayLocal } from '../../lib/date';
import { useLiveInterval } from '../../lib/use-live-interval';
import { signedPct, usd } from '../../lib/live-format';
import { weekdayLabel } from '../../lib/spacex-insights';
import { dcaColor, dcaRoute } from '../../lib/dca';
import type { RecordsStackParamList } from '../../navigation/RecordsStack';

type ThemeT = ReturnType<typeof useTheme>;
type Props = NativeStackScreenProps<RecordsStackParamList, 'DcaHome'>;

const WARN = '#F5A623';
const WEEKS_SHOWN = 8;
const BAR_MAX_H = 110;

function mdw(date: string): string {
  return `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}(${weekdayLabel(date)})`;
}
function signedUsd(v: number): string {
  return `${v >= 0 ? '+' : '−'}${usd(Math.abs(v))}`;
}
function tone(v: number | null, theme: ThemeT): string {
  if (v === null || v === 0) return theme.text;
  return v > 0 ? theme.brand : theme.danger;
}

/** 종목 하나의 이번 매수 상태 한 줄 — 접수 대기 → 체결(기록 전) → 마지막 기록 → 첫 매수 예정 순으로 판단 */
function buyStatus(p: DcaPlanSummaryDto, today: string): { text: string; sub: string; pill: string; tone: 'ok' | 'warn' | 'muted' } {
  const o = p.latestOrder;
  if (p.closedAt) return { text: `${p.name} 모으기 종료`, sub: `${mdw(p.closedAt)} 종료`, pill: '종료', tone: 'muted' };
  if (o && o.status === 'PENDING') {
    return { text: `${p.name} ${o.amount !== null ? usd(o.amount) : ''} 주문 접수`, sub: `${mdw(o.orderedAt.slice(0, 10))} · 체결되면 다음날 기록돼요`, pill: '체결 대기', tone: 'warn' };
  }
  if (o && o.status === 'FILLED' && !o.recorded) {
    return {
      text: `${p.name} ${o.amount !== null ? usd(o.amount) : ''} 체결`,
      sub: `${o.avgPrice !== null ? `${usd(o.avgPrice)}에 ` : ''}체결 · 다음날 오전 9시 10분 기록`,
      pill: '기록 전',
      tone: 'warn',
    };
  }
  const e = p.lastEntry;
  if (e) {
    return {
      text: `${p.name} ${usd(Number(e.amount))}`,
      sub: `${mdw(e.date)} 밤 ${e.price !== null ? `${usd(e.price)}에 ` : ''}체결${e.quantity !== null ? ` · ${Number(e.quantity).toFixed(6)}주` : ''}`,
      pill: '기록 완료',
      tone: 'ok',
    };
  }
  return {
    text: `${p.name} ${usd(p.dailyAmount)}`,
    sub: p.planStartDate > today ? `${mdw(p.planStartDate)} 밤 첫 매수 · 다음날 오전 9시 10분 기록` : '첫 매수를 기다리는 중이에요',
    pill: '예정',
    tone: 'muted',
  };
}

function pillColors(t: 'ok' | 'warn' | 'muted', theme: ThemeT): { fg: string; bg: string } {
  if (t === 'warn') return { fg: WARN, bg: WARN + '26' };
  if (t === 'ok') return theme.dark ? { fg: '#4CD08A', bg: '#4CD08A26' } : { fg: '#1B8A4B', bg: '#E3F6EC' };
  return { fg: theme.textMuted, bg: theme.border };
}

/** 계좌 안 비중 — 시세 탭 응답(보유 평가금 + 달러 예수금)으로 전략 종목과 모으기 종목을 나눈다 */
function accountShares(live: LiveDto | undefined, dcaSymbols: string[]) {
  if (!live?.totals || live.totals.cashUsd === null) return null;
  const valueOf = (pred: (sym: string) => boolean) =>
    live.symbols.filter((s) => pred(s.symbol)).reduce((sum, s) => sum + (s.marketValueUsd ?? 0), 0);
  const rows = [
    { label: 'TQQQ · VR', color: '#3182F6', value: valueOf((s) => s === 'TQQQ') },
    { label: 'SOXL · 라오어', color: '#F59E0B', value: valueOf((s) => s === 'SOXL') },
    { label: '모으기', color: '#0AB39C', value: valueOf((s) => dcaSymbols.includes(s)) },
    { label: '달러 현금', color: '#B0B8C1', value: live.totals.cashUsd },
  ];
  const total = rows.reduce((sum, r) => sum + r.value, 0);
  if (total <= 0) return null;
  return { total, rows: rows.map((r) => ({ ...r, pct: (r.value / total) * 100 })) };
}

function Card({ children, theme }: { children: React.ReactNode; theme: ThemeT }) {
  return <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>{children}</View>;
}

/** 모으기 전체 — 종목 합산 성과, 이번 매수 상태, 종목 목록, 주별 누적 원금, 계좌 안 비중 */
export default function DcaHomeScreen({ navigation }: Props) {
  const theme = useTheme();
  const interval = useLiveInterval(5_000);
  const overviewQ = useQuery({ queryKey: ['dca-overview'], queryFn: spacexApi.overview, refetchInterval: interval });
  const liveQ = useQuery({ queryKey: ['laofus-live'], queryFn: laofusRestApi.live, refetchInterval: interval });

  if (overviewQ.isError && !overviewQ.data) return <QueryError onRetry={() => void overviewQ.refetch()} />;
  if (overviewQ.isLoading || !overviewQ.data) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <Loader size="large" />
      </View>
    );
  }

  const { plans, weekly } = overviewQ.data;
  const today = todayLocal();
  const active = plans.filter((p) => !p.closedAt);
  // 시세 탭 가격이 더 자주 갱신되니 있으면 그걸로 평가금을 다시 계산
  const priceOf = (p: DcaPlanSummaryDto) => liveQ.data?.symbols.find((s) => s.symbol === p.symbol)?.price ?? p.currentPrice;
  const valueOf = (p: DcaPlanSummaryDto) => {
    const price = priceOf(p);
    return price !== null && p.quantity > 0 ? p.quantity * price : null;
  };
  const principal = plans.reduce((sum, p) => sum + p.totalPrincipal, 0);
  const valued = plans.filter((p) => valueOf(p) !== null);
  const value = valued.reduce((sum, p) => sum + valueOf(p)!, 0);
  const valuedPrincipal = valued.reduce((sum, p) => sum + p.totalPrincipal, 0);
  const profit = valued.length > 0 ? value - valuedPrincipal : null;
  const profitPct = profit !== null && valuedPrincipal > 0 ? (profit / valuedPrincipal) * 100 : null;
  const perDay = active.reduce((sum, p) => sum + p.dailyAmount, 0);
  const fx = liveQ.data?.fx ?? null;

  const weeks = weekly.slice(-WEEKS_SHOWN);
  const weekTotal = (w: (typeof weeks)[number]) => Object.values(w.principal).reduce((a, b) => a + b, 0);
  const maxWeek = Math.max(...weeks.map(weekTotal), 1);
  const shares = accountShares(
    liveQ.data,
    plans.map((p) => p.symbol),
  );

  function open(symbol: string) {
    const route = dcaRoute(symbol);
    // 상단 알약 탭과 같이 쌓지 않고 교체
    if (route) navigation.replace(route);
  }

  return (
    <ScrollView style={[styles.root, { backgroundColor: theme.bg }]} contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 12 }}>
      <Text style={{ color: theme.textMuted, fontSize: 12 }}>
        모으는 종목 {active.length}개 · 거래일마다 {usd(perDay, perDay % 1 === 0 ? 0 : 2)}
      </Text>

      {/* 합산 성과 */}
      <Card theme={theme}>
        <Text style={{ color: theme.textMuted, fontSize: 12 }}>모으기 평가금</Text>
        <Text style={{ color: theme.text, fontSize: 30, fontWeight: '700', marginTop: 2, fontVariant: ['tabular-nums'] }}>{valued.length > 0 ? usd(value) : '—'}</Text>
        {fx !== null && valued.length > 0 && (
          <Text style={{ color: theme.textMuted, fontSize: 11.5, marginTop: 2 }}>
            원화 약 {Math.round(value * fx).toLocaleString('ko-KR')}원 · 환율 {fx.toLocaleString('en-US', { maximumFractionDigits: 1 })}
          </Text>
        )}
        <View style={[styles.mineRow, { borderColor: theme.border }]}>
          <View style={{ flex: 1.4 }}>
            <Text style={{ color: theme.textMuted, fontSize: 11 }}>손익</Text>
            <Text style={{ color: tone(profit, theme), fontSize: 14.5, fontWeight: '800', marginTop: 1 }}>
              {profit !== null ? `${signedUsd(profit)} (${signedPct(profitPct, 1)})` : '—'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.textMuted, fontSize: 11 }}>매수원금</Text>
            <Text style={{ color: theme.text, fontSize: 14.5, fontWeight: '800', marginTop: 1 }}>{usd(principal)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.textMuted, fontSize: 11 }}>하루 매수</Text>
            <Text style={{ color: theme.text, fontSize: 14.5, fontWeight: '800', marginTop: 1 }}>{usd(perDay, perDay % 1 === 0 ? 0 : 2)}</Text>
          </View>
        </View>
      </Card>

      {/* 이번 매수 */}
      <Card theme={theme}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>이번 매수</Text>
        <View style={{ marginTop: 6 }}>
          {plans.map((p) => {
            const st = buyStatus(p, today);
            const c = pillColors(st.tone, theme);
            return (
              <View key={p.symbol} style={styles.statusRow}>
                <View style={[styles.dot, { backgroundColor: dcaColor(p.symbol) }]} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontSize: 13.5, fontWeight: '700' }}>{st.text}</Text>
                  <Text style={{ color: theme.textMuted, fontSize: 11.5, marginTop: 1 }}>{st.sub}</Text>
                </View>
                <View style={[styles.pill, { backgroundColor: c.bg }]}>
                  <Text style={{ color: c.fg, fontSize: 11, fontWeight: '800' }}>{st.pill}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </Card>

      {/* 종목 목록 */}
      <View style={[styles.listCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {plans.map((p, i) => {
          const v = valueOf(p);
          const pct = v !== null && p.totalPrincipal > 0 ? (v / p.totalPrincipal - 1) * 100 : null;
          const color = dcaColor(p.symbol);
          const started = p.buyCount > 0;
          return (
            <Pressable
              key={p.symbol}
              onPress={() => open(p.symbol)}
              style={({ pressed }) => [styles.planRow, i > 0 && { borderTopWidth: 1, borderColor: theme.border }, pressed && { opacity: 0.6 }]}
            >
              <View style={[styles.symBox, { backgroundColor: color + '1F' }]}>
                <Text style={{ color, fontSize: 10, fontWeight: '800' }}>{p.symbol}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontSize: 14, fontWeight: '700' }}>{p.name}</Text>
                <Text style={{ color: theme.textMuted, fontSize: 11.5, marginTop: 1 }}>
                  매일 {usd(p.dailyAmount, p.dailyAmount % 1 === 0 ? 0 : 2)}
                  {started ? ` · ${p.buyCount}회` : ''}
                  {p.closedAt ? ' · 종료' : ''}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                {started ? (
                  <>
                    <Text style={{ color: theme.text, fontSize: 14, fontWeight: '800' }}>{v !== null ? usd(v) : usd(p.totalPrincipal)}</Text>
                    <Text style={{ color: tone(pct, theme), fontSize: 11.5, fontWeight: '700', marginTop: 1 }}>{pct !== null ? signedPct(pct, 1) : '—'}</Text>
                  </>
                ) : (
                  <>
                    <Text style={{ color: theme.textMuted, fontSize: 14, fontWeight: '800' }}>시작 전</Text>
                    <Text style={{ color: theme.textMuted, fontSize: 11.5, marginTop: 1 }}>{mdw(p.planStartDate)} 시작</Text>
                  </>
                )}
              </View>
              {Icon.chevronRight(theme.textMuted)}
            </Pressable>
          );
        })}
      </View>

      {/* 주별 누적 원금 */}
      {weeks.length > 0 && (
        <Card theme={theme}>
          <View style={styles.rowBetween}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>원금이 쌓이는 모습</Text>
            <Text style={{ color: theme.textMuted, fontSize: 11.5 }}>주별 누적</Text>
          </View>
          <View style={styles.barRow}>
            {weeks.map((w) => {
              const total = weekTotal(w);
              return (
                <View key={w.weekStart} style={styles.barCol}>
                  <Text style={{ color: theme.text, fontSize: 10.5, fontWeight: '700', marginBottom: 3 }}>{usd(total, 0)}</Text>
                  {/* 아래부터 계획 순서대로 쌓기 */}
                  <View style={{ width: '100%', height: Math.max(3, (total / maxWeek) * BAR_MAX_H), flexDirection: 'column-reverse', borderRadius: 5, overflow: 'hidden' }}>
                    {plans.map((p) => {
                      const v = w.principal[p.symbol] ?? 0;
                      return v > 0 ? <View key={p.symbol} style={{ flex: v, backgroundColor: dcaColor(p.symbol) }} /> : null;
                    })}
                  </View>
                  <Text style={{ color: theme.textMuted, fontSize: 10, marginTop: 4 }}>
                    {Number(w.weekStart.slice(5, 7))}/{Number(w.weekStart.slice(8, 10))}
                  </Text>
                </View>
              );
            })}
          </View>
          <View style={styles.legend}>
            {plans.map((p) => (
              <View key={p.symbol} style={styles.rowCenter}>
                <View style={[styles.legendSq, { backgroundColor: dcaColor(p.symbol) }]} />
                <Text style={{ color: theme.textMuted, fontSize: 11 }}>{p.name}</Text>
              </View>
            ))}
            <Text style={{ color: theme.textMuted, fontSize: 11 }}>날짜는 그 주 월요일</Text>
          </View>
        </Card>
      )}

      {/* 계좌 안 비중 */}
      {shares && (
        <Card theme={theme}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>계좌 안에서의 비중</Text>
          <View style={[styles.shareBar, { backgroundColor: theme.border }]}>
            {shares.rows.map((r) => (r.pct > 0 ? <View key={r.label} style={{ flex: Math.max(r.pct, 0.6), backgroundColor: r.color }} /> : null))}
          </View>
          <View style={styles.shareGrid}>
            {shares.rows.map((r) => (
              <View key={r.label} style={styles.shareItem}>
                <View style={[styles.legendSq, { backgroundColor: r.color }]} />
                <Text style={{ color: theme.text, fontSize: 12, flex: 1 }}>{r.label}</Text>
                <Text style={{ color: theme.text, fontSize: 12, fontWeight: '700' }}>{r.pct < 1 && r.pct > 0 ? r.pct.toFixed(1) : Math.round(r.pct)}%</Text>
              </View>
            ))}
          </View>
          <Text style={{ color: theme.textMuted, fontSize: 11.5, marginTop: 8, lineHeight: 17 }}>
            계좌 {usd(shares.total, 0)} 기준이에요. TQQQ·SOXL·UPRO는 모두 3배 레버리지 미국 주식이라 같은 날 같은 방향으로 움직이기 쉬워요.
          </Text>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { borderWidth: 1, borderRadius: 14, padding: 14 },
  cardTitle: { fontSize: 14, fontWeight: '700' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowCenter: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  pill: { paddingHorizontal: 9, paddingVertical: 2, borderRadius: 999 },
  mineRow: { flexDirection: 'row', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  listCard: { borderWidth: 1, borderRadius: 14, overflow: 'hidden' },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  symBox: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  barRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 12, minHeight: BAR_MAX_H + 34 },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  legendSq: { width: 8, height: 8, borderRadius: 2 },
  shareBar: { flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden', marginTop: 10 },
  shareGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 6, columnGap: 16, marginTop: 10 },
  shareItem: { width: '46%', flexDirection: 'row', alignItems: 'center', gap: 6 },
});
