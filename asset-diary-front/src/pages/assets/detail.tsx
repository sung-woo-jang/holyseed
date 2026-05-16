import React, { useState } from 'react';
import { createRoute } from '@granite-js/react-native';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ScreenHeader from '../../components/common/ScreenHeader';
import { useTheme } from '../../lib/theme';
import { useDataSource, useMockRole } from '../../lib/data-source';
import TossEmoji from '../../components/common/TossEmoji';
import Segmented from '../../components/common/Segmented';
import LineChart from '../../components/charts/LineChart';
import { ASSET_CATEGORY_META } from '../../lib/category-meta';
import { krw, krwShort, pct } from '../../lib/format';
import { Icon } from '../../components/common/Icon';
import type { AssetCategory } from '../../types/api';

function AssetDetailScreen({ navigation, params }: { navigation: any; params: { id: string } }) {
  const theme = useTheme();
  const data = useDataSource();
  const role = useMockRole();
  const [unit, setUnit] = useState<'KRW' | 'USD'>('KRW');

  const asset = data.assets.find((a) => a.id === params.id) ?? data.assets[0]!;
  const snapshots = (data.snapshots[asset?.id ?? ''] ?? []).slice().reverse();
  const meta = ASSET_CATEGORY_META[(asset?.category ?? 'CASH') as AssetCategory];
  const isFx = (asset?.currency ?? 'KRW') !== 'KRW';

  if (!asset) {
    return <View style={[styles.root, { backgroundColor: theme.bg }]}><ScreenHeader title="자산 상세" onBack={() => navigation?.goBack?.()} /></View>;
  }

  const chartData = snapshots.map((s) => ({
    date: s.date,
    value: unit === 'USD' ? s.value : s.valueKRW,
  }));

  const relatedTxs = data.transactions
    .filter((t) => t.from === asset.id || t.to === asset.id)
    .slice(0, 4);

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <ScreenHeader title="자산 상세" onBack={() => navigation?.goBack?.()} />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 자산 요약 */}
        <View style={[styles.summaryCard, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
          <View style={styles.summaryTop}>
            <TossEmoji code={meta.iconCode} size={48} bg={meta.color + '22'} />
            <View style={styles.summaryTopText}>
              <Text style={[styles.catLabel, { color: theme.textMuted }]}>{meta.label}</Text>
              <Text style={[styles.assetName, { color: theme.text }]}>{asset.name}</Text>
            </View>
          </View>
          {isFx ? (
            <View style={styles.fxBlock}>
              <Text style={[styles.fxMain, { color: theme.text }]}>
                ${asset.currencyValue?.toLocaleString() ?? 0}
              </Text>
              <Text style={[styles.fxSub, { color: theme.textMuted }]}>
                ≈ {krw(asset.value)} · 1 USD = {asset.fxRate?.toLocaleString()}원
              </Text>
            </View>
          ) : (
            <Text style={[styles.valueText, { color: asset.isLiability ? theme.danger : theme.text }]}>
              {krw(asset.value)}
            </Text>
          )}
          <View style={styles.deltaBadge}>
            <View style={[styles.deltaChip, { backgroundColor: asset.delta >= 0 ? theme.brandSoft : '#FEE2E2' }]}>
              <View style={{ marginRight: 4 }}>{Icon.arrowUp(asset.delta >= 0 ? theme.brand : theme.danger, 12)}</View>
              <Text style={[styles.deltaText, { color: asset.delta >= 0 ? theme.brand : theme.danger }]}>
                {krwShort(Math.abs(asset.delta))} ({pct(asset.deltaPct)})
              </Text>
            </View>
          </View>
          {role !== 'VIEWER' && (
            <TouchableOpacity style={[styles.snapshotBtn, { backgroundColor: theme.brandSoft }]} activeOpacity={0.7}>
              <Text style={[styles.snapshotBtnText, { color: theme.brand }]}>이 자산만 스냅샷 입력</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 평가액 추이 */}
        <View style={[styles.section, { backgroundColor: theme.card, marginTop: 8 }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>평가액 추이</Text>
            {isFx && (
              <Segmented options={['KRW', 'USD']} value={unit} onChange={(v) => setUnit(v as 'KRW' | 'USD')} small />
            )}
          </View>
          {chartData.length > 1 ? (
            <LineChart
              data={chartData}
              width={327}
              height={150}
              color={meta.color}
              dark={theme.dark}
              interactive
            />
          ) : (
            <View style={styles.emptyChart}>
              <Text style={{ color: theme.textMuted, fontSize: 13 }}>스냅샷이 2개 이상이면 그래프가 나타나요</Text>
            </View>
          )}
        </View>

        {/* 스냅샷 히스토리 */}
        <View style={[styles.section, { backgroundColor: theme.card, marginTop: 8 }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>스냅샷 히스토리</Text>
          {snapshots.length === 0 ? (
            <View style={styles.emptyRow}>
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>스냅샷이 없어요</Text>
            </View>
          ) : (
            snapshots.map((s, idx) => (
              <View key={s.date} style={[styles.snapRow, { borderBottomColor: theme.border, borderBottomWidth: idx < snapshots.length - 1 ? 1 : 0 }]}>
                <Text style={[styles.snapDate, { color: theme.textMuted }]}>{s.date}</Text>
                {isFx ? (
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.snapValue, { color: theme.text }]}>${s.value.toLocaleString()}</Text>
                    <Text style={[styles.snapSub, { color: theme.textMuted }]}>
                      ≈ {krwShort(s.valueKRW)} · {s.fxRate.toLocaleString()}원
                    </Text>
                  </View>
                ) : (
                  <Text style={[styles.snapValue, { color: theme.text }]}>{krw(s.valueKRW || s.value)}</Text>
                )}
              </View>
            ))
          )}
        </View>

        {/* 관련 거래 */}
        {relatedTxs.length > 0 && (
          <View style={[styles.section, { backgroundColor: theme.card, marginTop: 8, marginBottom: 32 }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>관련 거래</Text>
            {relatedTxs.map((tx, idx) => {
              const amtColor = tx.type === 'INCOME' ? theme.brand : tx.type === 'EXPENSE' ? theme.danger : theme.textMuted;
              const sign = tx.type === 'INCOME' ? '+' : tx.type === 'EXPENSE' ? '-' : '';
              return (
                <View key={tx.id} style={[styles.txRow, { borderBottomColor: theme.border, borderBottomWidth: idx < relatedTxs.length - 1 ? 1 : 0 }]}>
                  <View style={[styles.txIcon, { backgroundColor: theme.bg }]}>
                    <Text style={{ fontSize: 16 }}>{tx.category.slice(0, 1)}</Text>
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={[styles.txTitle, { color: theme.text }]}>{tx.title}</Text>
                    <Text style={[styles.txMeta, { color: theme.textMuted }]}>{tx.date}</Text>
                  </View>
                  <Text style={[styles.txAmount, { color: amtColor }]}>
                    {sign}{krwShort(tx.amount)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  summaryCard: { paddingHorizontal: 20, paddingVertical: 20, borderBottomWidth: 1 },
  summaryTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  summaryTopText: { flex: 1 },
  catLabel: { fontSize: 12, marginBottom: 2 },
  assetName: { fontSize: 22, fontWeight: '800' },
  fxBlock: { marginBottom: 8 },
  fxMain: { fontSize: 28, fontWeight: '800' },
  fxSub: { fontSize: 13, marginTop: 2 },
  valueText: { fontSize: 28, fontWeight: '800', marginBottom: 8 },
  deltaBadge: { flexDirection: 'row', marginBottom: 14 },
  deltaChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  deltaText: { fontSize: 13, fontWeight: '600' },
  snapshotBtn: { borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  snapshotBtnText: { fontSize: 14, fontWeight: '700' },
  section: { paddingHorizontal: 20, paddingVertical: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  emptyChart: { height: 80, alignItems: 'center', justifyContent: 'center' },
  emptyRow: { paddingVertical: 20, alignItems: 'center' },
  emptyText: { fontSize: 13 },
  snapRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  snapDate: { fontSize: 14 },
  snapValue: { fontSize: 15, fontWeight: '700' },
  snapSub: { fontSize: 11, marginTop: 2 },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  txIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  txInfo: { flex: 1 },
  txTitle: { fontSize: 14, fontWeight: '600' },
  txMeta: { fontSize: 11, marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: '700' },
});

export const Route = createRoute('/assets/detail', {
  component: AssetDetailScreen,
});
