import { useState } from 'react';
import { Dimensions, Platform, Pressable, ScrollView, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Loader from '../../../components/ui/Loader';
import EmptyState from '../../../components/common/EmptyState';
import CycleTradeChart from './CycleTradeChart';
import { laofusRestApi, type CycleDto } from '../../../api/laofus';
import { SPLITS } from '../../../lib/laofus-core';
import { useTheme } from '../../../lib/theme';
import { TE } from '../../../lib/toss-emoji';
import type { LaofusStackParamList } from '../../../navigation/LaofusStack';

type Props = NativeStackScreenProps<LaofusStackParamList, 'LaofusCycleDetail'>;

/** 거래 1건당 최소 폭(px) — 이보다 촘촘해지면 가로 스크롤 (lab-front CycleDetailPage.tsx와 동일 값) */
const CHART_POINT_WIDTH = 28;

function n(v: string | number | null | undefined): number {
  return Number(v ?? 0);
}
function usd(v: number, d = 2): string {
  return `$${v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })}`;
}
function kstDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric' });
}

/** 쉼표/줄바꿈/따옴표가 섞여 있을 수 있는 필드(메모 등)만 감싸고, 내부 "는 ""로 이스케이프 */
function csvCell(v: string | number | null | undefined): string {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function csvRow(cells: (string | number | null | undefined)[]): string {
  return cells.map(csvCell).join(',');
}

/** 사이클 전체 정보(요약 + 체결 내역 전체)를 엑셀에서 바로 열 수 있는 CSV 문자열로 정리 */
function buildCycleCsv(c: CycleDto, currentT: number, currentQty: number, currentAvg: number): string {
  const lines: string[] = [];
  lines.push(csvRow(['항목', '값']));
  lines.push(csvRow(['사이클', `${c.cycleNo}차`]));
  lines.push(csvRow(['시작일', c.startDate]));
  lines.push(csvRow(['종료일', c.endDate ?? '진행 중']));
  lines.push(csvRow(['원금', n(c.principal)]));
  lines.push(csvRow(['순이익', c.profit !== null ? n(c.profit) : '']));
  lines.push(csvRow(['순이익률(%)', c.profitPct !== null ? n(c.profitPct) * 100 : '']));
  lines.push(csvRow(['현재 T', currentT]));
  lines.push(csvRow(['보유수량', currentQty]));
  lines.push(csvRow(['평단', currentAvg]));
  lines.push('');
  lines.push(csvRow(['순번', '날짜', '구분', '매수매도', '체결가', '수량', '금액', 'T전', 'T후', '체결후평단', '체결후보유', '체결후잔금', '메모']));
  for (const t of [...c.trades].sort((a, b) => a.seq - b.seq)) {
    lines.push(
      csvRow([
        t.seq,
        t.date,
        t.kind,
        t.side,
        n(t.price),
        n(t.quantity),
        n(t.amount),
        n(t.tBefore),
        n(t.tAfter),
        n(t.avgAfter),
        n(t.qtyAfter),
        n(t.cashAfter),
        t.note ?? '',
      ]),
    );
  }
  return lines.join('\r\n');
}

/** 웹 전용 — Blob + 숨긴 <a download>로 파일 저장. 네이티브에서는 호출하지 않음(Platform.OS==='web' 가드 밖에서 안 씀) */
function downloadCsv(filename: string, csv: string) {
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function Tile({
  label,
  value,
  sub,
  theme,
  valueColor,
}: {
  label: string;
  value: string;
  sub?: string;
  theme: ReturnType<typeof useTheme>;
  valueColor?: string;
}) {
  return (
    <View style={[styles.tile, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={{ color: theme.textMuted, fontSize: 11.5 }}>{label}</Text>
      <Text style={{ color: valueColor ?? theme.text, fontSize: 16, fontWeight: '800', marginTop: 2 }}>{value}</Text>
      {sub && <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 2 }}>{sub}</Text>}
    </View>
  );
}

export default function LaofusCycleDetailScreen({ route }: Props) {
  const theme = useTheme();
  const { cycleNo } = route.params;
  const statusQ = useQuery({ queryKey: ['laofus-status'], queryFn: laofusRestApi.status });
  const priceQ = useQuery({ queryKey: ['laofus-price'], queryFn: laofusRestApi.price, refetchInterval: 60_000 });
  const [cardWidth, setCardWidth] = useState(Dimensions.get('window').width - 32 - 32);

  function onCardLayout(e: LayoutChangeEvent) {
    setCardWidth(e.nativeEvent.layout.width);
  }

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
  const sellTrades = real.filter((t) => t.side === 'SELL');
  const sells = sellTrades.reduce((a, t) => a + n(t.amount), 0);
  // 매도는 평단을 안 바꾸므로 avgAfter가 곧 그 매도분의 원가 — 판매금액이 아니라 실현손익(판매금액-원가)을 보여준다
  const sellPL = sellTrades.reduce((a, t) => a + (n(t.amount) - n(t.avgAfter) * n(t.quantity)), 0);
  const last = real[real.length - 1];
  const days = last ? Math.round((new Date(last.date).getTime() - new Date(c.startDate).getTime()) / 86400000) + 1 : 0;
  const T = last ? n(last.tAfter) : 0;

  // 손익 카드 — 종료된 사이클은 백엔드가 확정한 실현손익을, 진행 중인 사이클은 현재가 기준 평가손익을 보여준다
  const isDone = c.endDate !== null;
  const qtyNow = last ? n(last.qtyAfter) : 0;
  const avgNow = last ? n(last.avgAfter) : 0;
  const currentPrice = priceQ.data?.price ?? null;

  let plLabel = '평가손익';
  let plAmount: number | null = null;
  let plPct: number | null = null;
  if (isDone && c.profit !== null) {
    plLabel = '실현손익';
    plAmount = n(c.profit);
    plPct = c.profitPct !== null ? n(c.profitPct) * 100 : null;
  } else if (currentPrice != null) {
    // buys/sells 현금 합산 방식은 이월(금액 0, 실제 원가는 있음) 물량을 공짜로 취급해 손익을 부풀린다.
    // sellPL(매도손익)에 잔여 수량의 평가손익(현재가-평단 차익)을 더하면 이월 물량까지 정확히 반영된다.
    const unrealizedNow = qtyNow * (currentPrice - avgNow);
    plAmount = sellPL + unrealizedNow;
    plPct = n(c.principal) > 0 ? (plAmount / n(c.principal)) * 100 : null;
  }
  const plColor = plAmount == null ? undefined : plAmount >= 0 ? theme.brand : theme.danger;

  const principal = n(c.principal);

  function handleExportCsv() {
    if (!c) return;
    const csv = buildCycleCsv(c, T, qtyNow, avgNow);
    const filename = `라오어_${c.cycleNo}차사이클_${c.startDate}~${c.endDate ?? '진행중'}.csv`;
    downloadCsv(filename, csv);
  }

  return (
    <ScrollView style={[styles.root, { backgroundColor: theme.bg }]} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <View style={styles.headRow}>
        <Text style={{ color: theme.text, fontSize: 15, fontWeight: '800' }}>{c.cycleNo}차 사이클</Text>
        <View style={[styles.principalBadge, { borderColor: theme.border }]}>
          <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: '700' }}>원금 {usd(principal, 0)}</Text>
        </View>
        <Text style={{ color: theme.textMuted, fontSize: 12 }}>
          {kstDate(c.startDate)} ~ {c.endDate ? kstDate(c.endDate) : '진행 중'} ({days}일째)
        </Text>
      </View>

      {Platform.OS === 'web' && (
        <Pressable
          onPress={handleExportCsv}
          style={[styles.exportBtn, { borderColor: theme.border, backgroundColor: theme.card }]}
        >
          <Text style={{ color: theme.text, fontSize: 12.5, fontWeight: '700' }}>CSV로 내보내기</Text>
        </Pressable>
      )}
      <View style={styles.tileGrid}>
        <Tile theme={theme} label="총 투입" value={usd(buys)} sub={`원금 ${usd(principal, 0)}의 ${((buys / principal) * 100).toFixed(0)}%`} />
        <Tile
          theme={theme}
          label={plLabel}
          value={plAmount != null ? `${plAmount >= 0 ? '+' : ''}${usd(plAmount)}` : '—'}
          sub={plPct != null ? `${plPct >= 0 ? '+' : ''}${plPct.toFixed(2)}%` : undefined}
          valueColor={plColor}
        />
        <Tile
          theme={theme}
          label="매도손익"
          value={`${sellPL >= 0 ? '+' : ''}${usd(sellPL)}`}
          sub={`${sellTrades.length}건`}
          valueColor={sellTrades.length > 0 ? (sellPL >= 0 ? theme.brand : theme.danger) : undefined}
        />
        <Tile theme={theme} label="총 회수" value={usd(sells)} />
        <Tile theme={theme} label="현재 T" value={String(T)} sub={`${SPLITS}분할 · 남은 회차 ${SPLITS - T}`} />
        <Tile theme={theme} label="거래 횟수" value={`${real.length}차`} sub={`${days}일간`} />
      </View>

      <View style={[styles.chartCard, { backgroundColor: theme.card, borderColor: theme.border }]} onLayout={onCardLayout}>
        <Text style={[styles.chartTitle, { color: theme.textMuted }]}>체결가 · 평단 추이</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <CycleTradeChart trades={c.trades} width={Math.max(cardWidth, real.length * CHART_POINT_WIDTH)} />
        </ScrollView>
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
  exportBtn: { alignSelf: 'flex-end', paddingVertical: 7, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, marginBottom: 10 },
  headRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  principalBadge: { borderWidth: 1, borderRadius: 999, paddingVertical: 2, paddingHorizontal: 9 },
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  tile: { width: '48%', borderWidth: 1, borderRadius: 12, padding: 12 },
  chartCard: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 12 },
  chartTitle: { fontSize: 12.5, fontWeight: '700', marginBottom: 8 },
  listCard: { borderWidth: 1, borderRadius: 14, overflow: 'hidden' },
  tradeRow: { padding: 12 },
  tradeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tradeKind: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
});
