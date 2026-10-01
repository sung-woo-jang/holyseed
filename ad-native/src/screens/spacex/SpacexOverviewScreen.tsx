import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import Loader from '../../components/ui/Loader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import AppToast from '../../components/common/AppToast';
import Segmented from '../../components/common/Segmented';
import { spacexApi } from '../../api/spacex';
import { laofusRestApi, type LiveSessionDto } from '../../api/laofus';
import { useTheme } from '../../lib/theme';
import { getErrorMessage } from '../../lib/error';
import { todayLocal } from '../../lib/date';
import { useLiveInterval, useNowTick } from '../../lib/use-live-interval';
import { freshnessTag, signedPct, usd } from '../../lib/live-format';
import {
  buildCalendar,
  buildScenarios,
  buildTodayCard,
  buyEntries,
  chartSeries,
  compareLumpSum,
  computeStats,
  projectPrincipal,
  typicalDailyAmount,
  type CalendarState,
  type TodayCardModel,
} from '../../lib/spacex-insights';
import SpacexPriceChart from './SpacexPriceChart';

type ThemeT = ReturnType<typeof useTheme>;

const WARN = '#F5A623';
const RANGES = { 전체: 'all', '1개월': '1m', '2주': '2w' } as const;
type RangeLabel = keyof typeof RANGES;

/** 반올림이 아니라 절삭 — 기록 리스트(SpacexEntriesScreen)와 같은 표시 방식으로 맞춤 */
function usdTrunc(v: number): string {
  return usd(Math.trunc(v * 100) / 100);
}
function kstDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric' });
}
function mmdd(date: string): string {
  return `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`;
}
function signedUsd(v: number): string {
  return `${v >= 0 ? '+' : '−'}${usd(Math.abs(v))}`;
}

function tone(v: number | null | undefined, theme: ThemeT): string {
  if (v === null || v === undefined || v === 0) return theme.text;
  return v > 0 ? theme.brand : theme.danger;
}

function sessionColors(session: LiveSessionDto | null, theme: ThemeT): { fg: string; bg: string } {
  if (!session || session.session === 'CLOSED') return { fg: theme.textMuted, bg: theme.border };
  if (session.session === 'REGULAR') return { fg: theme.brand, bg: theme.brandSoft };
  return { fg: WARN, bg: WARN + '26' };
}

function pillColors(t: TodayCardModel['pill']['tone'], theme: ThemeT): { fg: string; bg: string } {
  if (t === 'warn') return { fg: WARN, bg: WARN + '26' };
  if (t === 'ok') return theme.dark ? { fg: '#4CD08A', bg: '#4CD08A26' } : { fg: '#1B8A4B', bg: '#E3F6EC' };
  return { fg: theme.textMuted, bg: theme.border };
}

function Tile({ label, value, sub, theme }: { label: string; value: string; sub?: string; theme: ThemeT }) {
  return (
    <View style={[styles.tile, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={{ color: theme.textMuted, fontSize: 11.5 }}>{label}</Text>
      <Text style={{ color: theme.text, fontSize: 16, fontWeight: '800', marginTop: 2 }}>{value}</Text>
      {sub && <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 2 }}>{sub}</Text>}
    </View>
  );
}

function Card({ children, theme }: { children: React.ReactNode; theme: ThemeT }) {
  return <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>{children}</View>;
}

function MineCell({ label, value, color, flex = 1, theme }: { label: string; value: string; color: string; flex?: number; theme: ThemeT }) {
  return (
    <View style={{ flex }}>
      <Text style={{ color: theme.textMuted, fontSize: 11 }}>{label}</Text>
      <Text style={{ color, fontSize: 14.5, fontWeight: '800', marginTop: 1 }}>{value}</Text>
    </View>
  );
}

function calendarCell(state: CalendarState, theme: ThemeT): { bg: string; fg: string; border?: string; dashed?: boolean; caption: string; opacity?: number } {
  switch (state) {
    case 'buy':
      return { bg: theme.brandSoft, fg: theme.brand, caption: '●' };
    case 'pending':
      return { bg: WARN + '1A', fg: WARN, border: WARN, dashed: true, caption: '대기' };
    case 'today':
      return { bg: theme.bg, fg: theme.text, border: theme.border, caption: '오늘' };
    case 'missed':
      return { bg: theme.danger + '1F', fg: theme.danger, caption: '빠짐' };
    case 'closed':
      return { bg: theme.bg, fg: theme.textMuted, caption: '휴장', opacity: 0.7 };
    case 'upcoming':
      return { bg: theme.bg, fg: theme.textMuted, caption: '예정', opacity: 0.5 };
    default:
      return { bg: theme.bg, fg: theme.textMuted, caption: '', opacity: 0.45 };
  }
}

export default function SpacexOverviewScreen() {
  const theme = useTheme();
  const interval = useLiveInterval(5_000);
  const nowMs = useNowTick(interval !== false);
  const statusQ = useQuery({ queryKey: ['spacex-status'], queryFn: spacexApi.status, refetchInterval: interval });
  const liveQ = useQuery({ queryKey: ['laofus-live'], queryFn: laofusRestApi.live, refetchInterval: interval });
  const [rangeLabel, setRangeLabel] = useState<RangeLabel>('전체');
  const rangeKey = RANGES[rangeLabel];
  const allCandlesQ = useQuery({ queryKey: ['spacex-candles', 'all'], queryFn: () => spacexApi.candles('all'), staleTime: 5 * 60_000 });
  const rangeCandlesQ = useQuery({
    queryKey: ['spacex-candles', rangeKey],
    queryFn: () => spacexApi.candles(rangeKey),
    staleTime: 5 * 60_000,
    enabled: rangeKey !== 'all',
  });
  const [chartWidth, setChartWidth] = useState(0);
  const [closeConfirm, setCloseConfirm] = useState(false);
  const [closing, setClosing] = useState(false);
  const [toast, setToast] = useState('');

  if (statusQ.isLoading || !statusQ.data) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <Loader size="large" />
      </View>
    );
  }

  const s = statusQ.data;
  const isClosed = s.closedAt !== null;
  const today = todayLocal();
  const days = s.startDate
    ? Math.round((new Date(isClosed ? s.closedAt! : new Date().toISOString()).getTime() - new Date(s.startDate).getTime()) / 86400000) + 1
    : 0;
  const lastRebalance = [...s.entries].find((e) => e.isRebalance);

  const liveSpcx = liveQ.data?.symbols.find((x) => x.symbol === 'SPCX');
  const price = liveSpcx?.price ?? s.currentPrice;
  const session = liveQ.data?.session ?? null;
  const buys = buyEntries(s.entries);
  const stats = price !== null ? computeStats(buys, price) : null;
  const lump = price !== null ? compareLumpSum(buys, price) : null;
  const holdValue = price !== null && stats ? stats.quantity * price : s.currentValue;
  const holdDiff = holdValue !== null ? holdValue - s.totalPrincipal : null;
  const holdDiffPct = holdDiff !== null && s.totalPrincipal > 0 ? (holdDiff / s.totalPrincipal) * 100 : null;

  const listing = allCandlesQ.data?.listing ?? null;
  const calendar = allCandlesQ.data
    ? buildCalendar({
        buyDates: buys.map((b) => b.date),
        tradingDates: allCandlesQ.data.candles.map((c) => c.date),
        startDate: s.startDate,
        today,
        latestOrder: s.latestOrder,
      })
    : null;
  const todayCard = buildTodayCard({ latestOrder: s.latestOrder, today, formatUsd: usd });
  const todayColors = pillColors(todayCard.pill.tone, theme);

  const chartData = rangeKey === 'all' ? allCandlesQ.data : rangeCandlesQ.data;
  const points = chartData ? chartSeries(chartData.candles, price, today) : [];
  const chartBuys = buys.filter((b) => points.length > 0 && b.date >= points[0]!.date).map((b) => ({ date: b.date, price: b.price }));

  const scenarios = stats && price !== null ? buildScenarios(stats.quantity, stats.principal, price) : [];
  const daily = typicalDailyAmount(buys);

  async function handleClose() {
    setClosing(true);
    try {
      await spacexApi.close();
      setCloseConfirm(false);
      setToast('투자를 종료 처리했어요');
      statusQ.refetch();
    } catch (e) {
      setToast(getErrorMessage(e, '종료 처리에 실패했어요'));
      setCloseConfirm(false);
    } finally {
      setClosing(false);
    }
  }

  const sessionC = sessionColors(session, theme);

  return (
    <ScrollView style={[styles.root, { backgroundColor: theme.bg }]} contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 12 }}>
      <Text style={{ color: theme.textMuted, fontSize: 12 }}>
        {s.startDate ? kstDate(s.startDate) : '-'} 시작 · {days}일째 · {isClosed ? `${kstDate(s.closedAt!)} 종료` : '진행 중'}
      </Text>

      {/* 성과 */}
      <Card theme={theme}>
        <View style={styles.rowBetween}>
          <View style={styles.rowCenter}>
            <Text style={{ color: theme.text, fontSize: 15, fontWeight: '800' }}>SPCX</Text>
            {session && (
              <View style={[styles.pill, { backgroundColor: sessionC.bg }]}>
                <Text style={{ color: sessionC.fg, fontSize: 11, fontWeight: '800' }}>{session.label}</Text>
              </View>
            )}
          </View>
          {liveQ.data && (
            <Text style={{ color: theme.brand, fontSize: 11, fontWeight: '700' }}>{freshnessTag(null, liveQ.dataUpdatedAt, nowMs, !!liveSpcx?.stale)}</Text>
          )}
        </View>
        <Text style={{ color: theme.text, fontSize: 30, fontWeight: '700', marginTop: 6, fontVariant: ['tabular-nums'] }}>{price !== null ? usd(price) : '—'}</Text>
        {liveSpcx?.changePct !== null && liveSpcx?.changePct !== undefined && (
          <Text style={{ color: theme.textMuted, fontSize: 11.5, marginTop: 2 }}>
            <Text style={{ color: tone(liveSpcx.changePct, theme), fontWeight: '700' }}>오늘 {signedPct(liveSpcx.changePct, 2)}</Text>
            {listing && price !== null ? ` · 상장가 ${usd(listing.openPrice, 0)} 대비 ${signedPct((price / listing.openPrice - 1) * 100)}` : ''}
          </Text>
        )}
        {listing && price !== null && (
          <Text style={{ color: theme.textMuted, fontSize: 11.5, marginTop: 2 }}>
            상장 후 고점 {usd(listing.high.price)} 대비 {signedPct((price / listing.high.price - 1) * 100)} · 저점 {usd(listing.low.price)} 대비{' '}
            {signedPct((price / listing.low.price - 1) * 100)}
          </Text>
        )}
        <View style={[styles.mineRow, { borderColor: theme.border }]}>
          <MineCell theme={theme} label="내 평가금" value={holdValue !== null ? usdTrunc(holdValue) : '—'} color={theme.text} />
          <MineCell
            theme={theme}
            label="손익"
            value={holdDiff !== null ? `${signedUsd(holdDiff)} (${signedPct(holdDiffPct, 2)})` : '—'}
            color={tone(holdDiff, theme)}
            flex={1.4}
          />
          <MineCell theme={theme} label="매수원금" value={usdTrunc(s.totalPrincipal)} color={theme.text} />
        </View>
      </Card>

      {/* 오늘의 매수 */}
      {!isClosed && (
        <Card theme={theme}>
          <View style={styles.rowBetween}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>{todayCard.title}</Text>
            <View style={[styles.pill, { backgroundColor: todayColors.bg }]}>
              <Text style={{ color: todayColors.fg, fontSize: 11, fontWeight: '800' }}>{todayCard.pill.text}</Text>
            </View>
          </View>
          <Text style={{ color: theme.text, fontSize: 15, fontWeight: '800', marginTop: 8 }}>{todayCard.big}</Text>
          {todayCard.sub && <Text style={{ color: theme.textMuted, fontSize: 11.5, marginTop: 2 }}>{todayCard.sub}</Text>}
        </Card>
      )}

      {/* 가격 차트 */}
      <Card theme={theme}>
        <View style={styles.rowBetween}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>가격과 내 매수</Text>
          <Segmented options={Object.keys(RANGES)} value={rangeLabel} onChange={(v) => setRangeLabel(v as RangeLabel)} small alignment="fluid" />
        </View>
        <View style={{ marginTop: 8 }} onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}>
          {points.length >= 2 && chartWidth > 0 ? (
            <SpacexPriceChart
              points={points}
              buys={chartBuys}
              avgPrice={stats?.avgPrice ?? null}
              currentPrice={price}
              high={rangeKey === 'all' ? listing?.high : null}
              low={rangeKey === 'all' ? listing?.low : null}
              width={chartWidth}
            />
          ) : (
            <View style={{ height: 120, alignItems: 'center', justifyContent: 'center' }}>
              {(rangeKey === 'all' ? allCandlesQ.isError : rangeCandlesQ.isError) ? (
                <Text style={{ color: theme.textMuted, fontSize: 12 }}>가격 차트를 불러오지 못했어요</Text>
              ) : (
                <Loader />
              )}
            </View>
          )}
        </View>
        <View style={styles.legend}>
          <View style={styles.rowCenter}>
            <View style={[styles.legendDot, { backgroundColor: theme.brand }]} />
            <Text style={{ color: theme.textMuted, fontSize: 10.5 }}>내 매수</Text>
          </View>
          <View style={styles.rowCenter}>
            <View style={{ width: 14, borderTopWidth: 1.5, borderStyle: 'dashed', borderColor: theme.brand }} />
            <Text style={{ color: theme.textMuted, fontSize: 10.5 }}>평단</Text>
          </View>
          <Text style={{ color: '#FF3B30', fontSize: 10.5 }}>● 현재가</Text>
        </View>
      </Card>

      {/* 숫자 타일 */}
      {stats && (
        <View style={styles.tileGrid}>
          <Tile theme={theme} label="총 수량" value={`${stats.quantity.toFixed(5)}주`} />
          <Tile theme={theme} label="평단" value={usd(stats.avgPrice, 4)} sub={`현재가 대비 ${signedPct(stats.vsAvgPct, 2)}`} />
          <Tile theme={theme} label="손익분기 가격" value={usd(stats.avgPrice)} sub={`현재가에서 ${signedPct(stats.breakEvenGapPct)}`} />
          <Tile
            theme={theme}
            label="매수 일수"
            value={`${s.daysCount}일`}
            sub={calendar ? `연속 ${calendar.streak}일 · 빠진 날 ${calendar.missedDays.length}일` : undefined}
          />
          <Tile theme={theme} label="내 최저 매수가" value={usd(stats.minBuy.price)} sub={mmdd(stats.minBuy.date)} />
          <Tile theme={theme} label="내 최고 매수가" value={usd(stats.maxBuy.price)} sub={mmdd(stats.maxBuy.date)} />
        </View>
      )}

      {/* 분할 매수 효과 */}
      {stats && lump && (
        <Card theme={theme}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>분할 매수 효과</Text>
          <Text style={{ color: theme.textMuted, fontSize: 11.5, marginTop: 2 }}>첫날({mmdd(lump.firstDate)})에 같은 돈을 한 번에 샀다면?</Text>
          <View style={{ marginTop: 10, gap: 10 }}>
            {[
              { label: '한 번에 샀다면', value: lump.lumpValue, pct: lump.lumpPct, color: theme.border },
              { label: `매일 ${daily !== null ? usd(daily) : ''}씩 (지금)`, value: stats.value, pct: stats.profitPct, color: theme.brand },
            ].map((r) => (
              <View key={r.label}>
                <View style={styles.rowBetween}>
                  <Text style={{ color: theme.text, fontSize: 12.5 }}>{r.label}</Text>
                  <Text style={{ color: tone(r.pct, theme), fontSize: 12.5, fontWeight: '800' }}>
                    {usd(r.value)} ({signedPct(r.pct)})
                  </Text>
                </View>
                <View style={[styles.bar, { backgroundColor: theme.bg }]}>
                  <View style={{ width: `${(r.value / Math.max(lump.lumpValue, stats.value)) * 100}%`, height: '100%', backgroundColor: r.color, borderRadius: 4 }} />
                </View>
              </View>
            ))}
          </View>
          <Text style={{ color: theme.textMuted, fontSize: 11.5, marginTop: 8, lineHeight: 17 }}>
            {lump.advantage >= 0 ? '나눠 산 쪽이 ' : '한 번에 샀다면 '}
            <Text style={{ color: theme.text, fontWeight: '800' }}>{usd(Math.abs(lump.advantage))}</Text>
            {lump.advantage >= 0 ? ' 더 벌고 있어요' : ' 더 벌었을 거예요'}. 내 평단 {usd(stats.avgPrice)}는 매수가 단순 평균 {usd(stats.simpleAvgPrice)}보다{' '}
            {usd(Math.abs(stats.simpleAvgPrice - stats.avgPrice))} {stats.avgPrice <= stats.simpleAvgPrice ? '낮아요' : '높아요'}(같은 금액씩 사면 싼 날 더 많이 사져요).
          </Text>
        </Card>
      )}

      {/* 매수 캘린더 */}
      {calendar && (
        <Card theme={theme}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>매수 캘린더</Text>
          <View style={{ marginTop: 10, gap: 4 }}>
            <View style={styles.calRow}>
              <View style={styles.calWeekLabel} />
              {['월', '화', '수', '목', '금'].map((w) => (
                <Text key={w} style={[styles.calHead, { color: theme.textMuted }]}>
                  {w}
                </Text>
              ))}
            </View>
            {calendar.weeks.map((w) => (
              <View key={w.monday} style={styles.calRow}>
                <Text style={[styles.calWeekLabel, { color: theme.textMuted }]}>{mmdd(w.monday)}</Text>
                {w.days.map((d) => {
                  const c = calendarCell(d.state, theme);
                  return (
                    <View
                      key={d.date}
                      style={[
                        styles.calCell,
                        { backgroundColor: c.bg, opacity: c.opacity ?? 1 },
                        c.border ? { borderWidth: 1.5, borderColor: c.border, borderStyle: c.dashed ? 'dashed' : 'solid' } : null,
                      ]}
                    >
                      <Text style={{ color: c.fg, fontSize: 12, fontWeight: '800' }}>{d.day}</Text>
                      {c.caption ? <Text style={{ color: c.fg, fontSize: 9.5 }}>{c.caption}</Text> : null}
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
          <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 8 }}>● 체결 · 거래일인데 기록이 없으면 "빠짐"으로 표시돼요 (일봉 날짜로 거래일을 판단해요)</Text>
        </Card>
      )}

      {/* 가격 시나리오 */}
      {stats && scenarios.length > 0 && (
        <Card theme={theme}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>가격이 움직이면?</Text>
          <View style={{ marginTop: 8 }}>
            <View style={styles.scenRow}>
              {['가격 변화', '가격', '평가금', '원금 대비'].map((h, i) => (
                <Text key={h} style={[styles.scenHead, { color: theme.textMuted, textAlign: i === 0 ? 'left' : 'right' }]}>
                  {h}
                </Text>
              ))}
            </View>
            {scenarios.map((sc) => (
              <View key={sc.pct} style={[styles.scenRow, { borderTopWidth: 1, borderColor: theme.border }, sc.pct === 0 && { backgroundColor: theme.brandSoft }]}>
                <Text style={[styles.scenCell, { color: theme.text, textAlign: 'left', fontWeight: sc.pct === 0 ? '800' : '500' }]}>
                  {sc.pct === 0 ? '현재가' : signedPct(sc.pct, 0)}
                </Text>
                <Text style={[styles.scenCell, { color: theme.text, textAlign: 'right' }]}>{usd(sc.price)}</Text>
                <Text style={[styles.scenCell, { color: theme.text, textAlign: 'right' }]}>{usd(sc.value)}</Text>
                <Text style={[styles.scenCell, { color: tone(sc.returnPct, theme), textAlign: 'right', fontWeight: '700' }]}>{signedPct(sc.returnPct)}</Text>
              </View>
            ))}
          </View>
          {daily !== null && !isClosed && (
            <Text style={{ color: theme.textMuted, fontSize: 11.5, marginTop: 8 }}>
              지금처럼 매일 {usd(daily)}면 한 달(거래일 21일) 뒤 원금 약 ${Math.round(projectPrincipal(stats.principal, daily, 21)).toLocaleString('en-US')}, 1년 뒤 약 $
              {Math.round(projectPrincipal(stats.principal, daily, 252)).toLocaleString('en-US')}
            </Text>
          )}
        </Card>
      )}

      {lastRebalance && (
        <View style={[styles.memoCard, { backgroundColor: theme.brandSoft, borderColor: theme.border }]}>
          <Text style={{ color: theme.brand, fontSize: 10.5, fontWeight: '800', marginBottom: 6 }}>최근 리밸런싱 메모</Text>
          <Text style={{ color: theme.text, fontSize: 12.5, lineHeight: 18 }}>{lastRebalance.note ?? '(메모 없음)'}</Text>
          <Text style={{ color: theme.textMuted, fontSize: 10.5, marginTop: 5 }}>{kstDate(lastRebalance.date)}</Text>
        </View>
      )}

      <View style={styles.btnRow}>
        {!isClosed && (
          <Pressable style={[styles.btn, styles.btnGhost, { borderColor: theme.border }]} onPress={() => setCloseConfirm(true)}>
            <Text style={[styles.btnTextGhost, { color: theme.textMuted }]}>투자 종료</Text>
          </Pressable>
        )}
      </View>

      <ConfirmDialog
        visible={closeConfirm}
        title="투자 종료"
        description="종료하면 이후엔 조회만 가능해요. 계속할까요?"
        confirmText="종료"
        danger
        loading={closing}
        onConfirm={handleClose}
        onClose={() => setCloseConfirm(false)}
      />
      <AppToast open={toast.length > 0} text={toast} onClose={() => setToast('')} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { borderWidth: 1, borderRadius: 14, padding: 14 },
  cardTitle: { fontSize: 14, fontWeight: '700' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowCenter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pill: { paddingHorizontal: 9, paddingVertical: 2, borderRadius: 999 },
  mineRow: { flexDirection: 'row', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
  legend: { flexDirection: 'row', gap: 12, marginTop: 4, flexWrap: 'wrap' },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: { width: '48%', borderWidth: 1, borderRadius: 12, padding: 12 },
  bar: { height: 8, borderRadius: 4, overflow: 'hidden', marginTop: 4 },
  calRow: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  calWeekLabel: { width: 26, fontSize: 10 },
  calHead: { flex: 1, textAlign: 'center', fontSize: 10.5 },
  calCell: { flex: 1, height: 38, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  scenRow: { flexDirection: 'row', paddingVertical: 6 },
  scenHead: { flex: 1, fontSize: 10.5, fontWeight: '600' },
  scenCell: { flex: 1, fontSize: 12, fontVariant: ['tabular-nums'] },
  memoCard: { borderWidth: 1, borderRadius: 12, padding: 13 },
  btnRow: { flexDirection: 'row', gap: 8 },
  btn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 10 },
  btnGhost: { borderWidth: 1 },
  btnTextGhost: { fontSize: 13, fontWeight: '700' },
});
