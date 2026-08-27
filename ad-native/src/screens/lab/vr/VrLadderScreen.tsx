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

function LadderTable({ title, rows, theme, danger }: { title: string; rows: LadderRow[]; theme: ReturnType<typeof useTheme>; danger?: boolean }) {
  return (
    <View style={[styles.tableCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.tableTitle, { color: theme.text }]}>{title}</Text>
      <View style={[styles.tableHeaderRow, { borderColor: theme.border }]}>
        <Text style={[styles.cell, styles.cellHeader, { color: theme.textMuted }]}>수량</Text>
        <Text style={[styles.cell, styles.cellHeader, { color: theme.textMuted }]}>트리거가</Text>
        <Text style={[styles.cell, styles.cellHeader, { color: theme.textMuted }]}>Pool</Text>
      </View>
      {rows.map((r, i) => (
        <View key={i} style={[styles.tableRow, { borderColor: theme.border }, r.exceedsLimit && danger ? { backgroundColor: theme.danger + '14' } : null]}>
          <Text style={[styles.cell, { color: theme.text }]}>{r.qtyAfter}주</Text>
          <Text style={[styles.cell, { color: theme.text, fontWeight: '700' }]}>{usd(r.triggerPrice)}</Text>
          <Text style={[styles.cell, { color: r.exceedsLimit && danger ? theme.danger : theme.textMuted }]}>{usd(r.poolAfter)}</Text>
        </View>
      ))}
      {rows.some((r) => r.exceedsLimit) && danger && (
        <Text style={{ color: theme.danger, fontSize: 11, padding: 10 }}>⚠ 사용가능 Pool 한도를 넘는 구간이에요</Text>
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

  return (
    <ScrollView style={[styles.root, { backgroundColor: theme.bg }]} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <Text style={{ color: theme.textMuted, fontSize: 12, marginBottom: 12 }}>
        현재 {state.quantity}주 · 최소 밴드 {usd(state.minBand)} · 최대 밴드 {usd(state.maxBand)} · Pool {usd(state.pool)}
      </Text>
      <LadderTable title="매수 사다리" rows={buyRows} theme={theme} danger />
      <LadderTable title="매도 사다리" rows={sellRows} theme={theme} />
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
  cell: { flex: 1, textAlign: 'center', fontSize: 12.5 },
  cellHeader: { fontSize: 11, fontWeight: '700' },
});
