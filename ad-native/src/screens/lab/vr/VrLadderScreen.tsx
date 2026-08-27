import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import Loader from '../../../components/ui/Loader';
import EmptyState from '../../../components/common/EmptyState';
import { vrApi } from '../../../api/vr';
import { buildBuyLadder, buildSellLadder, type LadderRow } from '../../../lib/vr-ladder';
import { useTheme } from '../../../lib/theme';
import { TE } from '../../../lib/toss-emoji';

function usd(v: number): string {
  return `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function LadderTable({
  title,
  formula,
  rows,
  kind,
  cycleStartPool,
  theme,
}: {
  title: string;
  formula: string;
  rows: LadderRow[];
  kind: 'buy' | 'sell';
  cycleStartPool: number | null;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={[styles.tableCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.tableTitle, { color: theme.text }]}>
        {title} <Text style={{ fontWeight: '400', color: theme.textMuted, fontSize: 11 }}>{formula}</Text>
      </Text>

      {rows.length === 0 ? (
        <Text style={{ color: theme.textMuted, fontSize: 12.5, padding: 12, paddingTop: 0 }}>보유수량이 없습니다.</Text>
      ) : (
        <>
          <View style={[styles.tableHeaderRow, { borderColor: theme.border }]}>
            <Text style={[styles.cell, styles.cellHeader, { color: theme.textMuted }]}>체결 후 보유</Text>
            <Text style={[styles.cell, styles.cellHeader, { color: theme.textMuted }]}>트리거가</Text>
            <Text style={[styles.cell, styles.cellHeader, { color: theme.textMuted }]}>{kind === 'buy' ? 'Pool 잔액 (차감)' : 'Pool 잔액 (가산)'}</Text>
            <Text style={[styles.cell, styles.cellHeader, { color: theme.textMuted }]}>Pool 소진율</Text>
          </View>
          {rows.map((r, i) => {
            const usageRate = cycleStartPool && cycleStartPool > 0 ? ((cycleStartPool - r.poolAfter) / cycleStartPool) * 100 : null;
            const warn = r.exceedsLimit;
            const rowColor = warn ? theme.danger : theme.text;
            return (
              <View key={i} style={[styles.tableRow, { borderColor: theme.border }, warn && { backgroundColor: theme.danger + '14' }]}>
                <Text style={[styles.cell, { color: rowColor }]}>
                  {r.qtyAfter}주{warn ? ' ⚠ 한도 초과' : ''}
                </Text>
                <Text style={[styles.cell, { color: rowColor, fontWeight: '700' }]}>{usd(r.triggerPrice)}</Text>
                <Text style={[styles.cell, { color: rowColor }]}>{usd(r.poolAfter)}</Text>
                <Text style={[styles.cell, { color: rowColor }]}>{usageRate !== null ? `${usageRate.toFixed(1)}%` : '—'}</Text>
              </View>
            );
          })}
        </>
      )}

      {kind === 'buy' && rows.some((r) => r.exceedsLimit) && (
        <Text style={{ color: theme.danger, fontSize: 11, padding: 10, paddingTop: 4 }}>
          ⚠ 표시는 누적 매수액이 사용가능 Pool을 초과하는 구간
        </Text>
      )}
    </View>
  );
}

export default function VrLadderScreen() {
  const theme = useTheme();
  const stateQ = useQuery({ queryKey: ['vr-state'], queryFn: vrApi.state, refetchInterval: 30_000 });
  const state = stateQ.data;

  const buyRows = useMemo(
    () => (state ? buildBuyLadder({ quantity: state.quantity, minBand: state.minBand, pool: state.pool, usablePool: state.usablePool }) : []),
    [state],
  );
  const sellRows = useMemo(
    () => (state ? buildSellLadder({ quantity: state.quantity, maxBand: state.maxBand, pool: state.pool }) : []),
    [state],
  );

  if (stateQ.isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <Loader size="large" />
      </View>
    );
  }

  if (!state) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <EmptyState iconCode={TE.chartBar} title="상태를 불러오지 못했어요" />
      </View>
    );
  }

  const cycleStartPool = state.cycle?.poolStart ?? null;

  return (
    <ScrollView style={[styles.root, { backgroundColor: theme.bg }]} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <Text style={{ color: theme.textMuted, fontSize: 12, marginBottom: 12 }}>
        보유 {state.quantity}주 · 최소밴드 {usd(state.minBand)} · 최대밴드 {usd(state.maxBand)} · Pool {usd(state.pool)} — 1주씩 순차 체결 가정, 매 단계
        트리거가 재계산
      </Text>

      <LadderTable
        title="매수표"
        formula="— 트리거가 = 최소밴드 ÷ 직전 보유수량"
        rows={buyRows}
        kind="buy"
        cycleStartPool={cycleStartPool}
        theme={theme}
      />
      <LadderTable
        title="매도표"
        formula="— 트리거가 = 최대밴드 ÷ 직전 보유수량"
        rows={sellRows}
        kind="sell"
        cycleStartPool={cycleStartPool}
        theme={theme}
      />

      <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 4 }}>
        ※ 실제 증권사 예약 주문이 아닌 참조/시뮬레이션 용도(수동 시장가 체결). 계산 전 보유수량·밴드·Pool을 개요에서 재확인하세요.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tableCard: { borderWidth: 1, borderRadius: 14, overflow: 'hidden', marginBottom: 16 },
  tableTitle: { fontSize: 13.5, fontWeight: '800', padding: 12, paddingBottom: 8 },
  tableHeaderRow: { flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, paddingVertical: 6 },
  tableRow: { flexDirection: 'row', borderTopWidth: 1, paddingVertical: 8 },
  cell: { flex: 1, textAlign: 'center', fontSize: 11 },
  cellHeader: { fontSize: 9.5, fontWeight: '700' },
});
