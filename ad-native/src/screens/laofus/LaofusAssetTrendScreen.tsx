import { useMemo, useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/common/EmptyState';
import ChartLegend from '../../components/charts/ChartLegend';
import SheetModal from '../../components/sheets/SheetModal';
import { ReturnChart, StackedValueChart, trendColors } from '../../components/charts/TrendCharts';
import { laofusRestApi, type AssetTrendPoint } from '../../api/laofus';
import { dcaColor } from '../../lib/dca';
import {
  availablePeriods,
  compositionOf,
  dayChange,
  fxEffectKrw,
  principalOf,
  returnsOf,
  sliceRows,
  soxlOf,
  stockOf,
  tqqqOf,
  type Ccy,
} from '../../lib/laofus-trend';
import { useTheme } from '../../lib/theme';
import { TE } from '../../lib/toss-emoji';
import QueryError from '../../components/common/QueryError';

type ThemeT = ReturnType<typeof useTheme>;
type Mode = 'val' | 'ret';

const chartWidth = Dimensions.get('window').width - 32 - 28;
const DEFAULT_PERIOD = 30;
const DAYS_COLLAPSED = 7;

function krw(v: number): string {
  return `${v < 0 ? '-' : ''}₩${Math.abs(Math.round(v)).toLocaleString('en-US')}`;
}
function usdFmt(v: number): string {
  return `${v < 0 ? '-' : ''}$${Math.abs(Math.round(v)).toLocaleString('en-US')}`;
}
function fmt(v: number, ccy: Ccy): string {
  return ccy === 'usd' ? usdFmt(v) : krw(v);
}
function signed(v: number, ccy: Ccy): string {
  return `${v >= 0 ? '+' : ''}${fmt(v, ccy)}`;
}
function pctStr(v: number): string {
  return `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`;
}
function dayLabel(date: string): string {
  const [, m, d] = date.split('-');
  return `${Number(m)}월 ${Number(d)}일`;
}
function md(date: string): string {
  const [, m, d] = date.split('-');
  return `${Number(m)}/${Number(d)}`;
}
const gain = (v: number, theme: ThemeT) => (v >= 0 ? theme.brand : theme.danger);

function CcyToggle({ ccy, onChange, theme }: { ccy: Ccy; onChange: (c: Ccy) => void; theme: ThemeT }) {
  return (
    <View style={[styles.ccyToggle, { backgroundColor: theme.bg, borderColor: theme.border }]}>
      {(['krw', 'usd'] as const).map((c) => (
        <Pressable key={c} onPress={() => onChange(c)} hitSlop={6} style={[styles.ccyBtn, ccy === c && { backgroundColor: theme.card }]}>
          <Text style={{ fontSize: 12, fontWeight: '800', color: ccy === c ? theme.text : theme.textMuted }}>{c === 'krw' ? '원' : '$'}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function Chip({ text, color, bg }: { text: string; color: string; bg: string }) {
  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      <Text style={{ color, fontSize: 11, fontWeight: '800' }}>{text}</Text>
    </View>
  );
}

function Badge({ color }: { color: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={{ color: '#fff', fontSize: 10.5, fontWeight: '800' }}>3x</Text>
    </View>
  );
}

export default function LaofusAssetTrendScreen() {
  const theme = useTheme();
  const trendQ = useQuery({ queryKey: ['laofus-asset-trend'], queryFn: laofusRestApi.assetTrend });

  const [ccy, setCcy] = useState<Ccy>('krw');
  const [period, setPeriod] = useState<number | null>(null);
  const [mode, setMode] = useState<Mode>('val');
  const [hover, setHover] = useState<number | null>(null);
  const [sheetIdx, setSheetIdx] = useState<number | null>(null);
  const [allDays, setAllDays] = useState(false);

  const series = trendQ.data ?? [];
  const periods = useMemo(() => availablePeriods(series.length), [series.length]);
  // 아직 고르지 않았으면 1달(없으면 전체), 고른 기간이 데이터 부족으로 사라지면 전체
  const effPeriod = periods.some((p) => p.value === period) ? (period as number) : periods.some((p) => p.value === DEFAULT_PERIOD) ? DEFAULT_PERIOD : 0;
  const rows = useMemo(() => sliceRows(series, effPeriod), [series, effPeriod]);

  if (trendQ.isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <Loader size="large" />
      </View>
    );
  }
  if ((trendQ.isError && !trendQ.data)) return <QueryError onRetry={() => { void trendQ.refetch(); }} />;
  if (series.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <EmptyState iconCode={TE.chartBar} title="아직 쌓인 스냅샷이 없어요" />
      </View>
    );
  }

  const first = rows[0]!;
  const last = rows[rows.length - 1]!;
  const stock = stockOf(last, ccy);
  const profit = stock - principalOf(last, ccy);
  const profitPct = last.principalUsd > 0 ? (last.stockUsd / last.principalUsd - 1) * 100 : 0;
  const periodDelta = stockOf(last, ccy) - stockOf(first, ccy);
  const periodText = effPeriod === 0 ? `전체 ${rows.length}일` : `${effPeriod}일`;
  const fx = fxEffectKrw(first, last);
  const colors = trendColors(theme.dark);
  const offset = series.length - rows.length;
  const hoverRow = hover !== null ? rows[hover] : undefined;
  const shown = hoverRow ?? last;
  const shownRet = returnsOf(shown);
  const comp = compositionOf(last);
  const compColors = { tqqq: colors.tqqq, soxl: colors.soxl, usd: '#C8930A', krw: theme.dark ? '#3A4250' : '#C9CFD8' };
  const rets = returnsOf(last);

  const dayRows = [...series.keys()].reverse();
  const visibleDays = allDays ? dayRows : dayRows.slice(0, DAYS_COLLAPSED);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <View style={styles.topRow}>
          <Text style={{ fontSize: 12, color: theme.textMuted }}>{dayLabel(last.date)} 기준 · 해외주식 평가금</Text>
          <CcyToggle ccy={ccy} onChange={setCcy} theme={theme} />
        </View>
        <Text style={[styles.bigValue, { color: theme.text }]}>{fmt(stock, ccy)}</Text>
        <Text style={{ fontSize: 13, fontWeight: '800', color: gain(profit, theme) }}>
          평가손익 {signed(profit, ccy)} ({pctStr(profitPct)})
        </Text>
        <View style={styles.chips}>
          <Chip text={`${periodText} 평가금 ${signed(periodDelta, ccy)}`} color={gain(periodDelta, theme)} bg={periodDelta >= 0 ? theme.brandSoft : theme.dark ? '#3A1A1E' : '#FDECEE'} />
          {ccy === 'krw' && (
            <>
              <Chip text={`환율 영향 ${signed(fx, 'krw')}`} color={gain(fx, theme)} bg={fx >= 0 ? theme.brandSoft : theme.dark ? '#3A1A1E' : '#FDECEE'} />
              <Chip text={`환율 ${Math.round(first.fx).toLocaleString('en-US')}→${Math.round(last.fx).toLocaleString('en-US')}원`} color={theme.textMuted} bg={theme.card} />
            </>
          )}
        </View>

        <View style={styles.periodRow}>
          {periods.map((p) => (
            <Pressable
              key={p.value}
              onPress={() => {
                setPeriod(p.value);
                setHover(null);
              }}
              style={[styles.periodBtn, { borderColor: theme.border, backgroundColor: effPeriod === p.value ? theme.text : theme.card }]}
            >
              <Text style={{ fontSize: 11.5, fontWeight: '700', color: effPeriod === p.value ? theme.bg : theme.textMuted }}>{p.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.seg, { backgroundColor: theme.bg }]}>
            {([['val', '평가금'], ['ret', '수익률']] as const).map(([k, label]) => (
              <Pressable key={k} onPress={() => setMode(k)} style={[styles.segBtn, mode === k && { backgroundColor: theme.card }]}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: mode === k ? theme.text : theme.textMuted }}>{label}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.readout}>
            <Text style={{ fontSize: 11.5, color: theme.textMuted }}>{md(shown.date)}{hoverRow ? '' : ' (최신)'}</Text>
            {mode === 'val' ? (
              <Text style={{ fontSize: 11.5, color: theme.textMuted }}>
                TQQQ <Text style={{ color: theme.text, fontWeight: '800' }}>{fmt(tqqqOf(shown, ccy), ccy)}</Text> · SOXL{' '}
                <Text style={{ color: theme.text, fontWeight: '800' }}>{fmt(soxlOf(shown, ccy), ccy)}</Text>
              </Text>
            ) : (
              <Text style={{ fontSize: 11.5, color: theme.textMuted }}>
                TQQQ <Text style={{ color: gain(shownRet.tqqq, theme), fontWeight: '800' }}>{pctStr(shownRet.tqqq)}</Text> · SOXL{' '}
                <Text style={{ color: gain(shownRet.soxl, theme), fontWeight: '800' }}>{pctStr(shownRet.soxl)}</Text>
              </Text>
            )}
          </View>

          {mode === 'val' ? (
            <StackedValueChart rows={rows} width={chartWidth} ccy={ccy} hover={hover} onHover={setHover} onPick={(i) => setSheetIdx(offset + i)} />
          ) : (
            <ReturnChart rows={rows} width={chartWidth} hover={hover} onHover={setHover} onPick={(i) => setSheetIdx(offset + i)} />
          )}

          {mode === 'val' ? (
            <ChartLegend
              items={[
                { kind: 'area', color: colors.tqqq, label: 'TQQQ (VR)', value: fmt(tqqqOf(last, ccy), ccy) },
                { kind: 'area', color: colors.soxl, label: 'SOXL (무한매수법)', value: fmt(soxlOf(last, ccy), ccy) },
                { kind: 'dash', color: theme.text, label: '매입 원금', value: fmt(principalOf(last, ccy), ccy) },
              ]}
              hint="두 면을 합친 높이가 주식 평가금이에요. 원금 점선은 SOXL을 사고팔 때 계단처럼 바뀌어요(평단×보유수량 기준). 그래프를 눌러 그날 스냅샷을 열 수 있어요."
            />
          ) : (
            <ChartLegend
              items={[
                { kind: 'line', color: colors.tqqq, label: 'TQQQ', value: pctStr(rets.tqqq) },
                { kind: 'line', color: colors.soxl, label: 'SOXL', value: pctStr(rets.soxl) },
                { kind: 'dash', color: theme.textMuted, label: '합계', value: pctStr(rets.all) },
              ]}
              hint="각 전략의 (평가금 ÷ 원금 − 1)이에요. 입금·매수 시점에 영향받지 않아 두 전략을 같은 눈금에서 비교할 수 있어요."
            />
          )}
        </View>

        <View style={styles.cards}>
          {(
            [
              ['TQQQ · VR', '입금 누계 기준', colors.tqqq, last.tqqqValueUsd, last.tqqqPrincipalUsd],
              ['SOXL · 무한매수법', '평단×수량 기준', colors.soxl, last.soxlValueUsd, last.soxlPrincipalUsd],
            ] as const
          ).map(([name, basis, color, v, p]) => {
            const pc = p > 0 ? (v / p - 1) * 100 : 0;
            const f = ccy === 'usd' ? 1 : last.fx;
            return (
              <View key={name} style={[styles.sCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.sTitle}>
                  <Badge color={color} />
                  <Text style={{ fontSize: 12.5, fontWeight: '800', color: theme.text }}>{name}</Text>
                </View>
                <Text style={{ fontSize: 16, fontWeight: '800', color: theme.text, marginTop: 6 }}>{fmt(v * f, ccy)}</Text>
                <Text style={{ fontSize: 12, fontWeight: '800', color: gain(pc, theme) }}>{pctStr(pc)}</Text>
                <Text style={{ fontSize: 10.5, color: theme.textMuted, marginTop: 2 }}>
                  원금 {fmt(p * f, ccy)} · {basis}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, marginTop: 10 }]}>
          <View style={styles.rowBetween}>
            <Text style={{ fontSize: 12.5, fontWeight: '800', color: theme.text }}>계좌 구성</Text>
            <Text style={{ fontSize: 11.5, color: theme.textMuted }}>총 {fmt(ccy === 'usd' ? comp.total / last.fx : comp.total, ccy)}</Text>
          </View>
          <View style={styles.compBar}>
            {comp.parts.map((p) => (
              <View key={p.key} style={{ flex: Math.max(p.krw, 0.0001), backgroundColor: compColors[p.key] }} />
            ))}
          </View>
          <View style={styles.compLegend}>
            {comp.parts.map((p) => (
              <View key={p.key} style={styles.compItem}>
                <View style={[styles.dot, { backgroundColor: compColors[p.key] }]} />
                <Text style={{ fontSize: 11, color: theme.textMuted }}>
                  {p.label} {comp.total > 0 ? ((p.krw / comp.total) * 100).toFixed(0) : 0}%
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, marginTop: 10, paddingVertical: 4 }]}>
          <View style={[styles.dayHead, { borderColor: theme.border }]}>
            <Text style={[styles.dCellL, styles.dHeadText, { color: theme.textMuted }]}>날짜</Text>
            <Text style={[styles.dCell, styles.dHeadText, { color: theme.textMuted }]}>평가금</Text>
            <Text style={[styles.dCell, styles.dHeadText, { color: theme.textMuted }]}>전일 대비</Text>
            <Text style={[styles.dCell, styles.dHeadText, { color: theme.textMuted }]}>손익률</Text>
          </View>
          {visibleDays.map((i, k) => {
            const r = series[i]!;
            const ch = dayChange(series, i, ccy);
            const pc = returnsOf(r).all;
            return (
              <Pressable key={r.date} onPress={() => setSheetIdx(i)} style={({ pressed }) => [styles.dayRow, k > 0 && { borderTopWidth: 1, borderColor: theme.border }, pressed && { opacity: 0.6 }]}>
                <Text style={[styles.dCellL, { color: theme.textMuted, fontSize: 12 }]}>{md(r.date)}</Text>
                <Text style={[styles.dCell, { color: theme.text, fontSize: 12 }]}>{fmt(stockOf(r, ccy), ccy)}</Text>
                <Text style={[styles.dCell, { color: ch === null ? theme.textMuted : gain(ch, theme), fontSize: 12, fontWeight: '700' }]}>{ch === null ? '—' : signed(ch, ccy)}</Text>
                <Text style={[styles.dCell, { color: gain(pc, theme), fontSize: 12, fontWeight: '700' }]}>{pctStr(pc)}</Text>
              </Pressable>
            );
          })}
          {dayRows.length > DAYS_COLLAPSED && (
            <Pressable onPress={() => setAllDays(!allDays)} style={[styles.moreBtn, { borderColor: theme.border }]}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: theme.brand }}>{allDays ? '접기' : `전체 ${dayRows.length}일 보기`}</Text>
            </Pressable>
          )}
        </View>
        <Text style={{ fontSize: 11, color: theme.textMuted, textAlign: 'center', marginTop: 8 }}>날짜를 누르면 그날 스냅샷이 아래에서 올라와요</Text>
      </ScrollView>

      <SheetModal
        visible={sheetIdx !== null}
        onClose={() => setSheetIdx(null)}
        header={sheetIdx !== null ? `${dayLabel(series[sheetIdx]!.date)} 스냅샷` : ''}
        headerRight={
          sheetIdx !== null ? (
            <View style={{ flexDirection: 'row', gap: 4 }}>
              <Pressable disabled={sheetIdx === 0} hitSlop={8} onPress={() => setSheetIdx(sheetIdx - 1)} style={styles.navBtn}>
                <Text style={{ fontSize: 18, color: sheetIdx === 0 ? theme.border : theme.text }}>‹</Text>
              </Pressable>
              <Pressable disabled={sheetIdx === series.length - 1} hitSlop={8} onPress={() => setSheetIdx(sheetIdx + 1)} style={styles.navBtn}>
                <Text style={{ fontSize: 18, color: sheetIdx === series.length - 1 ? theme.border : theme.text }}>›</Text>
              </Pressable>
            </View>
          ) : undefined
        }
      >
        {sheetIdx !== null && <Snapshot r={series[sheetIdx]!} ccy={ccy} theme={theme} />}
      </SheetModal>
    </View>
  );
}

function Snapshot({ r, ccy, theme }: { r: AssetTrendPoint; ccy: Ccy; theme: ThemeT }) {
  const colors = trendColors(theme.dark);
  const isUsd = ccy === 'usd';
  const stock = stockOf(r, ccy);
  const principal = principalOf(r, ccy);
  const profit = stock - principal;
  const rets = returnsOf(r);
  const total = isUsd ? r.totalValueUsd : r.totalValueKrw;
  const f = isUsd ? 1 : r.fx;

  const Holding = ({ name, color, qty, v, p, pc }: { name: string; color: string; qty: number; v: number; p: number; pc: number }) => (
    <View style={[styles.holdRow, { borderColor: theme.border }]}>
      <Badge color={color} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text }}>{name}</Text>
        <Text style={{ fontSize: 11, color: theme.textMuted }}>
          {qty}주 · 원금 {fmt(p * f, ccy)}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text }}>{fmt(v * f, ccy)}</Text>
        <Text style={{ fontSize: 11.5, fontWeight: '700', color: gain(pc, theme) }}>{pctStr(pc)}</Text>
      </View>
    </View>
  );

  return (
    <View>
      <Text style={{ fontSize: 28, fontWeight: '800', color: theme.text, textAlign: 'center' }}>{fmt(stock, ccy)}</Text>
      <Text style={{ fontSize: 12.5, fontWeight: '800', color: gain(profit, theme), textAlign: 'center', marginTop: 2, marginBottom: 10 }}>
        평가손익 {signed(profit, ccy)} ({pctStr(rets.all)})
      </Text>
      <Holding name="TQQQ · VR" color={colors.tqqq} qty={r.tqqqQty} v={r.tqqqValueUsd} p={r.tqqqPrincipalUsd} pc={rets.tqqq} />
      <Holding name="SOXL · 무한매수법" color={colors.soxl} qty={r.soxlQty} v={r.soxlValueUsd} p={r.soxlPrincipalUsd} pc={rets.soxl} />
      {/* 모으기(스페이스X·UPRO)는 계좌총액엔 들어가지만 위 전략 평가금·수익률엔 넣지 않는다 */}
      {(r.dcaValueUsd ?? 0) > 0 && (
        <View style={[styles.holdRow, { borderColor: theme.border }]}>
          <Badge color={dcaColor('UPRO')} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text }}>모으기 · 스페이스X·UPRO</Text>
            <Text style={{ fontSize: 11, color: theme.textMuted }}>전략 수익률엔 포함하지 않아요</Text>
          </View>
          <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text }}>{fmt(r.dcaValueUsd! * f, ccy)}</Text>
        </View>
      )}

      <View style={[styles.cashCard, { borderColor: '#C8930A', backgroundColor: theme.dark ? '#332708' : '#FFF7E6' }]}>
        <View style={styles.rowBetween}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text }}>USD 예수금</Text>
          <Text style={{ fontSize: 13.5, fontWeight: '700', color: theme.text }}>{isUsd ? usdFmt(r.cashUsd) : krw(r.cashUsd * r.fx)}</Text>
        </View>
        <Text style={{ fontSize: 10.5, color: theme.textMuted }}>환율 {r.fx.toLocaleString('en-US', { minimumFractionDigits: 2 })}원 적용</Text>
        <View style={[styles.rowBetween, { borderTopWidth: 1, borderColor: theme.border, marginTop: 8, paddingTop: 8 }]}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text }}>KRW 예수금</Text>
          <Text style={{ fontSize: 13.5, fontWeight: '700', color: theme.text }}>{isUsd ? usdFmt(r.cashKrw / r.fx) : krw(r.cashKrw)}</Text>
        </View>
      </View>

      <View style={[styles.totalRow, { borderColor: theme.border }]}>
        <Text style={{ fontSize: 13, fontWeight: '800', color: theme.text }}>계좌총액</Text>
        <Text style={{ fontSize: 17, fontWeight: '800', color: theme.brand }}>{fmt(total, ccy)}</Text>
      </View>

      <Text style={{ fontSize: 10.5, lineHeight: 16, color: theme.textMuted, marginTop: 12 }}>
        평가금은 실계좌 스냅샷 기준 추정 데이터예요. SOXL 원금은 체결 이력의 평단가×보유수량, TQQQ(VR) 원금은 사이클 입금액 누계로 계산했어요 — 참고용으로만 활용해 주세요.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ccyToggle: { flexDirection: 'row', gap: 2, borderWidth: 1, borderRadius: 99, padding: 2 },
  ccyBtn: { paddingHorizontal: 13, paddingVertical: 5, borderRadius: 99 },
  bigValue: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5, marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  chip: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 99 },
  periodRow: { flexDirection: 'row', gap: 6, marginTop: 14, marginBottom: 10 },
  periodBtn: { flex: 1, borderWidth: 1, borderRadius: 99, paddingVertical: 7, alignItems: 'center' },
  card: { borderWidth: 1, borderRadius: 14, padding: 14 },
  seg: { flexDirection: 'row', borderRadius: 10, padding: 3, marginBottom: 8 },
  segBtn: { flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: 8 },
  readout: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 20, marginBottom: 4 },
  cards: { flexDirection: 'row', gap: 8, marginTop: 10 },
  sCard: { flex: 1, borderWidth: 1, borderRadius: 14, padding: 12 },
  sTitle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badge: { minWidth: 26, height: 20, borderRadius: 6, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  compBar: { flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', marginTop: 8, marginBottom: 8 },
  compLegend: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 12, rowGap: 4 },
  compItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dayHead: { flexDirection: 'row', borderBottomWidth: 1, paddingVertical: 8 },
  dayRow: { flexDirection: 'row', paddingVertical: 11, alignItems: 'center' },
  dCell: { flex: 1.3, textAlign: 'right', fontVariant: ['tabular-nums'] },
  dCellL: { flex: 0.8, textAlign: 'left' },
  dHeadText: { fontSize: 10.5, fontWeight: '700' },
  moreBtn: { alignItems: 'center', paddingVertical: 12, borderTopWidth: 1 },
  navBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  holdRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1 },
  cashCard: { borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 12, padding: 12, marginTop: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 14, borderTopWidth: 1.5 },
});
