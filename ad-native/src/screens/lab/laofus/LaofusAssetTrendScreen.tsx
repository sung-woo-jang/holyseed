import { useMemo, useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import Loader from '../../../components/ui/Loader';
import EmptyState from '../../../components/common/EmptyState';
import LineChart from '../../../components/charts/LineChart';
import DatePicker from '../../../components/common/DatePicker';
import { laofusRestApi, type AssetTrendPoint } from '../../../api/laofus';
import { useTheme } from '../../../lib/theme';
import { TE } from '../../../lib/toss-emoji';

/** 정확히 일치하는 날짜가 없으면(공휴일 등 스냅샷 누락) 그 이하 중 가장 가까운 날짜로 스냅 */
function findClosestIndex(series: AssetTrendPoint[], dateStr: string): number {
  const exact = series.findIndex((s) => s.date === dateStr);
  if (exact >= 0) return exact;
  let idx = 0;
  for (let i = 0; i < series.length; i++) {
    if (series[i].date <= dateStr) idx = i;
    else break;
  }
  return idx;
}

type Ccy = 'krw' | 'usd';
type Tab = 'detail' | 'trend' | 'daily';
type Period = 7 | 30 | 90 | 365;

const TQQQ_COLOR = '#1F3A52';
const SOXL_COLOR = '#E8871E';

const screenWidth = Dimensions.get('window').width;
const contentWidth = screenWidth - 32;
const chartWidth = contentWidth - 28;

function krw(v: number): string {
  return `${v < 0 ? '-' : ''}₩${Math.abs(Math.round(v)).toLocaleString('en-US')}`;
}
function usdFmt(v: number): string {
  return `${v < 0 ? '-' : ''}$${Math.abs(Math.round(v)).toLocaleString('en-US')}`;
}
function fmt(v: number, ccy: Ccy): string {
  return ccy === 'usd' ? usdFmt(v) : krw(v);
}
function pctStr(v: number): string {
  return `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`;
}
function dayLabel(date: string): string {
  const [, m, d] = date.split('-');
  return `${Number(m)}월 ${Number(d)}일`;
}

function TabBar({ tab, onChange, theme }: { tab: Tab; onChange: (t: Tab) => void; theme: ReturnType<typeof useTheme> }) {
  const items: { key: Tab; label: string }[] = [
    { key: 'detail', label: '평가금 상세' },
    { key: 'trend', label: '투자 자산 추이' },
    { key: 'daily', label: '일별 평가금' },
  ];
  return (
    <View style={styles.tabBar}>
      {items.map((it) => (
        <Pressable
          key={it.key}
          onPress={() => onChange(it.key)}
          style={[
            styles.tabBtn,
            { borderColor: theme.border, backgroundColor: tab === it.key ? theme.brand : theme.card },
          ]}
        >
          <Text style={{ fontSize: 11.5, fontWeight: '700', color: tab === it.key ? '#fff' : theme.textMuted }}>{it.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function CcyToggle({ ccy, onChange, theme }: { ccy: Ccy; onChange: (c: Ccy) => void; theme: ReturnType<typeof useTheme> }) {
  return (
    <View style={[styles.ccyToggle, { backgroundColor: theme.bg, borderColor: theme.border }]}>
      {(['krw', 'usd'] as const).map((c) => (
        <Pressable
          key={c}
          onPress={() => onChange(c)}
          style={[styles.ccyBtn, ccy === c && { backgroundColor: theme.card }]}
        >
          <Text style={{ fontSize: 11, fontWeight: '800', color: ccy === c ? theme.text : theme.textMuted }}>{c === 'krw' ? '원' : '$'}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={{ color: '#fff', fontSize: 10.5, fontWeight: '800' }}>3x</Text>
    </View>
  );
}

export default function LaofusAssetTrendScreen() {
  const theme = useTheme();
  const trendQ = useQuery({ queryKey: ['laofus-asset-trend'], queryFn: laofusRestApi.assetTrend });

  const [tab, setTab] = useState<Tab>('detail');
  const [dayIdx, setDayIdx] = useState<number | null>(null);
  const [detailCcy, setDetailCcy] = useState<Ccy>('krw');
  const [dailyCcy, setDailyCcy] = useState<Ccy>('krw');
  const [period, setPeriod] = useState<Period>(90);
  const [showPrincipal, setShowPrincipal] = useState(true);

  const series = trendQ.data ?? [];
  const resolvedDayIdx = dayIdx ?? series.length - 1;

  if (trendQ.isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <Loader size="large" />
      </View>
    );
  }
  if (series.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <EmptyState iconCode={TE.chartBar} title="아직 쌓인 스냅샷이 없어요" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <TabBar tab={tab} onChange={setTab} theme={theme} />
      {tab === 'detail' && (
        <DetailView series={series} dayIdx={resolvedDayIdx} setDayIdx={setDayIdx} ccy={detailCcy} setCcy={setDetailCcy} theme={theme} />
      )}
      {tab === 'trend' && <TrendView series={series} period={period} setPeriod={setPeriod} showPrincipal={showPrincipal} setShowPrincipal={setShowPrincipal} theme={theme} />}
      {tab === 'daily' && <DailyView series={series} ccy={dailyCcy} setCcy={setDailyCcy} theme={theme} />}
    </View>
  );
}

function DetailView({
  series,
  dayIdx,
  setDayIdx,
  ccy,
  setCcy,
  theme,
}: {
  series: AssetTrendPoint[];
  dayIdx: number;
  setDayIdx: (i: number) => void;
  ccy: Ccy;
  setCcy: (c: Ccy) => void;
  theme: ReturnType<typeof useTheme>;
}) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const r = series[dayIdx];
  const isUsd = ccy === 'usd';
  const stock = isUsd ? r.stockUsd : r.stockKrw;
  const principal = isUsd ? r.principalUsd : r.principalKrw;
  const tqqqVal = isUsd ? r.tqqqValueUsd : Math.round(r.tqqqValueUsd * r.fx);
  const tqqqPrin = isUsd ? r.tqqqPrincipalUsd : Math.round(r.tqqqPrincipalUsd * r.fx);
  const soxlVal = isUsd ? r.soxlValueUsd : Math.round(r.soxlValueUsd * r.fx);
  const soxlPrin = isUsd ? r.soxlPrincipalUsd : Math.round(r.soxlPrincipalUsd * r.fx);
  const cashUsdKrw = Math.round(r.cashUsd * r.fx);
  const total = isUsd ? r.totalValueUsd : r.totalValueKrw;
  const profit = stock - principal;
  const profitPct = principal > 0 ? (profit / principal) * 100 : 0;
  const tqqqPct = tqqqPrin > 0 ? ((tqqqVal - tqqqPrin) / tqqqPrin) * 100 : 0;
  const soxlPct = soxlPrin > 0 ? ((soxlVal - soxlPrin) / soxlPrin) * 100 : 0;
  const isLoss = profit < 0;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <View style={styles.dayNav}>
        <Pressable disabled={dayIdx === 0} onPress={() => setDayIdx(dayIdx - 1)}>
          <Text style={{ fontSize: 13, color: dayIdx === 0 ? theme.border : theme.textMuted }}>◀</Text>
        </Pressable>
        <Text style={{ fontSize: 13, fontWeight: '700', color: theme.textMuted }}>{dayLabel(r.date)} 평가금</Text>
        <Pressable disabled={dayIdx === series.length - 1} onPress={() => setDayIdx(dayIdx + 1)}>
          <Text style={{ fontSize: 13, color: dayIdx === series.length - 1 ? theme.border : theme.textMuted }}>▶</Text>
        </Pressable>
        <Pressable onPress={() => setCalendarOpen(true)} style={[styles.calBtn, { backgroundColor: theme.brandSoft }]}>
          <Text style={{ fontSize: 13 }}>📅</Text>
        </Pressable>
      </View>

      <DatePicker
        visible={calendarOpen}
        value={r.date}
        maxDate={series[series.length - 1].date}
        onSelect={(date) => setDayIdx(findClosestIndex(series, date))}
        onClose={() => setCalendarOpen(false)}
      />

      <CcyToggle ccy={ccy} onChange={setCcy} theme={theme} />

      <Text style={[styles.bigValue, { color: theme.text }]}>{fmt(stock, ccy)}</Text>

      <View style={[styles.kvTable, { borderColor: theme.border }]}>
        <View style={[styles.kvRow, { borderColor: theme.border }]}>
          <Text style={{ color: theme.textMuted, fontSize: 13 }}>원금</Text>
          <Text style={{ color: theme.text, fontSize: 13, fontWeight: '700' }}>{fmt(principal, ccy)}</Text>
        </View>
        <View style={[styles.kvRow, { borderColor: theme.border, borderBottomWidth: 0 }]}>
          <Text style={{ color: theme.textMuted, fontSize: 13 }}>총 수익</Text>
          <Text style={{ color: isLoss ? theme.danger : theme.brand, fontSize: 13, fontWeight: '700' }}>
            {profit >= 0 ? '+' : ''}
            {fmt(profit, ccy)} ({pctStr(profitPct)})
          </Text>
        </View>
      </View>

      <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>해외주식</Text>
      <View style={styles.sectionTotalRow}>
        <Text style={{ fontSize: 17, fontWeight: '800', color: theme.text }}>{fmt(stock, ccy)}</Text>
        <Text style={{ fontSize: 13, fontWeight: '700', color: profitPct >= 0 ? theme.brand : theme.danger }}>{pctStr(profitPct)}</Text>
      </View>

      <View style={[styles.holdRow, { borderColor: theme.border }]}>
        <Badge label="TQQQ" color={TQQQ_COLOR} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text }}>TQQQ</Text>
          <Text style={{ fontSize: 11, color: theme.textMuted }}>{r.tqqqQty}주</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text }}>{fmt(tqqqVal, ccy)}</Text>
          <Text style={{ fontSize: 11.5, fontWeight: '700', color: tqqqPct >= 0 ? theme.brand : theme.danger }}>{pctStr(tqqqPct)}</Text>
        </View>
      </View>
      <View style={[styles.holdRow, { borderColor: theme.border }]}>
        <Badge label="SOXL" color={SOXL_COLOR} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text }}>SOXL</Text>
          <Text style={{ fontSize: 11, color: theme.textMuted }}>{r.soxlQty}주</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text }}>{fmt(soxlVal, ccy)}</Text>
          <Text style={{ fontSize: 11.5, fontWeight: '700', color: soxlPct >= 0 ? theme.brand : theme.danger }}>{pctStr(soxlPct)}</Text>
        </View>
      </View>

      <Text style={[styles.sectionLabel, { color: theme.textMuted, marginTop: 16 }]}>예수금</Text>
      <View style={[styles.cashCard, { borderColor: '#C8930A', backgroundColor: theme.dark ? '#332708' : '#FFF7E6' }]}>
        <View style={styles.cashRow}>
          <View style={[styles.badge, { backgroundColor: '#C8930A' }]}>
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>$</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text }}>USD 예수금</Text>
            <Text style={{ fontSize: 10.5, color: theme.textMuted }}>환율 {r.fx.toLocaleString('en-US', { minimumFractionDigits: 2 })}원 적용</Text>
          </View>
          <Text style={{ fontSize: 13.5, fontWeight: '700', color: theme.text }}>{isUsd ? usdFmt(r.cashUsd) : krw(cashUsdKrw)}</Text>
        </View>
        <View style={[styles.cashRow, { borderTopWidth: 1, borderColor: theme.border, marginTop: 8, paddingTop: 8 }]}>
          <View style={[styles.badge, { backgroundColor: '#C8930A' }]}>
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>₩</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text }}>KRW 예수금</Text>
          </View>
          <Text style={{ fontSize: 13.5, fontWeight: '700', color: theme.text }}>{krw(r.cashKrw)}</Text>
        </View>
      </View>

      <View style={[styles.totalRow, { borderColor: theme.border }]}>
        <Text style={{ fontSize: 13, fontWeight: '800', color: theme.text }}>계좌총액</Text>
        <Text style={{ fontSize: 17, fontWeight: '800', color: theme.brand }}>{fmt(total, ccy)}</Text>
      </View>

      <View style={styles.fxRow}>
        <Text style={{ fontSize: 12.5, color: theme.textMuted }}>기준 환율{'\n'}{dayLabel(r.date)} 기준</Text>
        <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text }}>{r.fx.toLocaleString('en-US', { minimumFractionDigits: 2 })}원</Text>
      </View>

      <View style={[styles.disclaimer, { backgroundColor: theme.bg }]}>
        <Text style={{ fontSize: 10.5, lineHeight: 16, color: theme.textMuted }}>
          평가금은 실계좌 스냅샷 기준 추정 데이터예요. 라오어(SOXL)는 체결 이력의 평단가×보유수량, VR(TQQQ)은 사이클 입금액 누계를 "원금"으로 계산했어요 — 참고용으로만 활용해 주세요.
        </Text>
      </View>
    </ScrollView>
  );
}

function TrendView({
  series,
  period,
  setPeriod,
  showPrincipal,
  setShowPrincipal,
  theme,
}: {
  series: AssetTrendPoint[];
  period: Period;
  setPeriod: (p: Period) => void;
  showPrincipal: boolean;
  setShowPrincipal: (v: boolean) => void;
  theme: ReturnType<typeof useTheme>;
}) {
  const slice = useMemo(() => series.slice(Math.max(0, series.length - period)), [series, period]);
  const last = slice[slice.length - 1];
  const first = slice[0];
  const delta = last.stockKrw - first.stockKrw;
  const profit = last.stockKrw - last.principalKrw;
  const profitPct = last.principalKrw > 0 ? (profit / last.principalKrw) * 100 : 0;
  const periodLabel = period === 7 ? '1주' : period === 30 ? '1달' : period === 90 ? '3달' : slice.length < 365 ? `${slice.length}일(데이터 전체)` : '1년';

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <View style={{ alignItems: 'center', marginBottom: 6 }}>
        <Text style={{ fontSize: 11.5, color: theme.textMuted }}>{dayLabel(last.date)} 기준</Text>
        <Text style={{ fontSize: 26, fontWeight: '800', color: theme.text, marginTop: 2 }}>{krw(last.stockKrw)}</Text>
        <Text style={{ fontSize: 12.5, fontWeight: '700', marginTop: 2, color: delta >= 0 ? theme.danger : theme.brand }}>
          {periodLabel} 전보다 {delta >= 0 ? '+' : ''}
          {krw(delta)}
        </Text>
      </View>

      <View style={[styles.chartCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <LineChart
          data={slice.map((r) => ({ date: r.date, value: r.stockKrw }))}
          series2={showPrincipal ? slice.map((r) => ({ date: r.date, value: r.principalKrw })) : undefined}
          width={chartWidth}
          height={160}
          color={TQQQ_COLOR}
          color2={theme.textMuted}
          dark={theme.dark}
          formatValue={krw}
        />
      </View>

      <View style={styles.periodTabs}>
        {([7, 30, 90, 365] as const).map((p) => (
          <Pressable
            key={p}
            onPress={() => setPeriod(p)}
            style={[styles.periodBtn, { borderColor: theme.border, backgroundColor: period === p ? theme.text : theme.card }]}
          >
            <Text style={{ fontSize: 11.5, fontWeight: '700', color: period === p ? theme.bg : theme.textMuted }}>
              {p === 7 ? '1주' : p === 30 ? '1달' : p === 90 ? '3달' : '1년'}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable onPress={() => setShowPrincipal(!showPrincipal)} style={styles.principalToggle}>
        <View style={[styles.toggleDot, { borderColor: showPrincipal ? theme.brand : theme.textMuted }]}>
          {showPrincipal && <Text style={{ fontSize: 9, color: theme.brand }}>✓</Text>}
        </View>
        <Text style={{ fontSize: 11.5, color: theme.textMuted }}>원금과 비교</Text>
      </Pressable>

      <View style={[styles.trendFoot, { borderColor: theme.border }]}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: TQQQ_COLOR }} />
            <Text style={{ fontSize: 11, color: theme.textMuted }}>평가금</Text>
          </View>
          <Text style={{ fontSize: 15, fontWeight: '800', color: theme.text, marginTop: 2 }}>{krw(last.stockKrw)}</Text>
          <Text style={{ fontSize: 10.5, color: theme.textMuted, marginTop: 1 }}>
            {profit >= 0 ? '+' : ''}
            {krw(profit)} ({pctStr(profitPct)})
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Text style={{ fontSize: 11, color: theme.textMuted }}>원금</Text>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: theme.textMuted }} />
          </View>
          <Text style={{ fontSize: 15, fontWeight: '800', color: theme.text, marginTop: 2 }}>{krw(last.principalKrw)}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

function DailyView({
  series,
  ccy,
  setCcy,
  theme,
}: {
  series: AssetTrendPoint[];
  ccy: Ccy;
  setCcy: (c: Ccy) => void;
  theme: ReturnType<typeof useTheme>;
}) {
  const rows = useMemo(() => series.slice().reverse(), [series]);
  const isUsd = ccy === 'usd';

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <CcyToggle ccy={ccy} onChange={setCcy} theme={theme} />
      <View style={[styles.dailyHeaderRow, { borderColor: theme.border }]}>
        <Text style={[styles.dailyCellLeft, styles.dailyHeaderText, { color: theme.textMuted }]}>날짜</Text>
        <Text style={[styles.dailyCell, styles.dailyHeaderText, { color: theme.textMuted }]}>평가금</Text>
        <Text style={[styles.dailyCell, styles.dailyHeaderText, { color: theme.textMuted }]}>평가손익</Text>
        <Text style={[styles.dailyCell, styles.dailyHeaderText, { color: theme.textMuted }]}>매입원금</Text>
      </View>
      <ScrollView>
        {rows.map((r) => {
          const stock = isUsd ? r.stockUsd : r.stockKrw;
          const principal = isUsd ? r.principalUsd : r.principalKrw;
          const profit = stock - principal;
          const pct = principal > 0 ? (profit / principal) * 100 : 0;
          return (
            <View key={r.date} style={[styles.dailyRow, { borderColor: theme.border }]}>
              <Text style={[styles.dailyCellLeft, { color: theme.textMuted, fontSize: 11.5 }]}>{r.date.slice(2).replaceAll('-', '.')}</Text>
              <Text style={[styles.dailyCell, { color: theme.text, fontSize: 11.5 }]}>{fmt(stock, ccy)}</Text>
              <Text style={[styles.dailyCell, { color: pct >= 0 ? theme.danger : theme.brand, fontSize: 11.5, fontWeight: '700' }]}>
                {pctStr(pct)}
                {'\n'}
                <Text style={{ fontWeight: '400', fontSize: 10 }}>{fmt(profit, ccy)}</Text>
              </Text>
              <Text style={[styles.dailyCell, { color: theme.text, fontSize: 11.5 }]}>{fmt(principal, ccy)}</Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  tabBar: { flexDirection: 'row', gap: 6, padding: 12, paddingBottom: 4 },
  tabBtn: { flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 8, alignItems: 'center' },

  ccyToggle: { flexDirection: 'row', gap: 2, borderWidth: 1, borderRadius: 8, padding: 2, alignSelf: 'center', marginBottom: 14 },
  ccyBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6 },

  bigValue: { textAlign: 'center', fontSize: 30, fontWeight: '800', marginBottom: 16 },

  dayNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 10 },

  kvTable: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, marginBottom: 18 },
  kvRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1 },

  sectionLabel: { fontSize: 11, fontWeight: '800', marginBottom: 4 },
  sectionTotalRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 10 },

  holdRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1 },
  badge: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },

  calBtn: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  cashCard: { borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 12, padding: 12, marginTop: 8 },
  cashRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 14, borderTopWidth: 1.5 },

  fxRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 14, marginTop: 6 },
  disclaimer: { borderRadius: 10, padding: 12, marginTop: 8 },

  chartCard: { borderWidth: 1, borderRadius: 14, padding: 14, marginTop: 8, marginBottom: 12 },
  periodTabs: { flexDirection: 'row', gap: 6 },
  periodBtn: { flex: 1, borderWidth: 1, borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  principalToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  toggleDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  trendFoot: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, paddingTop: 14, marginTop: 14 },

  dailyHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, paddingBottom: 6, marginTop: 8 },
  dailyRow: { flexDirection: 'row', borderBottomWidth: 1, paddingVertical: 8 },
  dailyCell: { flex: 1, textAlign: 'right', fontVariant: ['tabular-nums'] },
  dailyCellLeft: { flex: 1, textAlign: 'left' },
  dailyHeaderText: { fontSize: 10.5, fontWeight: '700' },
});
