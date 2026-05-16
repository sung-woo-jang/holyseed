import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useDataSource, useMockRole } from '../lib/data-source';
import { useTheme } from '../lib/theme';
import { krw, krwShort, pct } from '../lib/format';
import { ASSET_CATEGORY_META } from '../lib/category-meta';
import { TE } from '../lib/toss-emoji';
import TossEmoji from '../components/common/TossEmoji';
import { Icon } from '../components/common/Icon';
import SnapshotSheet from '../components/sheets/SnapshotSheet';
import type { AssetCategory } from '../types/api';
import type { MockAsset } from '../lib/mock-data';

interface AssetsScreenProps {
  onAssetPress?: (asset: MockAsset) => void;
}

export default function AssetsScreen({ onAssetPress }: AssetsScreenProps) {
  const theme = useTheme();
  const role = useMockRole();
  const data = useDataSource();
  const [snapshotAll, setSnapshotAll] = useState(false);
  const isViewer = role === 'VIEWER';

  const grouped: Partial<Record<AssetCategory, MockAsset[]>> = {};
  data.assets.forEach(a => {
    if (!grouped[a.category]) grouped[a.category] = [];
    grouped[a.category]!.push(a);
  });

  const total = data.assets.reduce((s, a) => s + (a.isLiability ? -a.value : a.value), 0);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.bg }} contentContainerStyle={{ paddingBottom: 120 }}>
      {/* Total net worth */}
      <View style={styles.header}>
        <Text style={[styles.headerLabel, { color: theme.textMuted }]}>총 순자산</Text>
        <Text style={[styles.headerValue, { color: theme.text }]}>{krw(total)}</Text>
      </View>

      {/* Action buttons */}
      {!isViewer && (
        <View style={styles.actionBlock}>
          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.brand }]} onPress={() => setSnapshotAll(true)}>
              <TossEmoji code={TE.camera} size={18} />
              <Text style={styles.actionBtnPrimary}>일괄 스냅샷</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.brandSoft }]}>
              <TossEmoji code={TE.pencil} size={18} />
              <Text style={[styles.actionBtnSoft, { color: theme.brand }]}>개별 입력</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.actionCaption, { color: theme.textMuted }]}>개별 입력은 자산을 탭한 후 "이 자산만 스냅샷 입력" 버튼으로도 가능해요</Text>
        </View>
      )}

      {/* Asset groups */}
      {(Object.entries(grouped) as [AssetCategory, MockAsset[]][]).map(([cat, items]) => {
        const meta = ASSET_CATEGORY_META[cat];
        const sum = items.reduce((s, a) => s + (a.isLiability ? -a.value : a.value), 0);
        return (
          <View key={cat} style={styles.groupBlock}>
            <View style={styles.groupHeader}>
              <View style={styles.groupHeaderLeft}>
                <TossEmoji code={meta.iconCode} size={18} />
                <Text style={[styles.groupLabel, { color: theme.text }]}>{meta.label}</Text>
                <Text style={[styles.groupCount, { color: theme.textMuted }]}>· {items.length}건</Text>
              </View>
              <Text style={[styles.groupSum, { color: theme.textMuted }]}>{krwShort(sum)}원</Text>
            </View>
            <View style={[styles.groupCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              {items.map((a, i) => (
                <TouchableOpacity
                  key={a.id}
                  style={[styles.assetRow, i < items.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }]}
                  onPress={() => onAssetPress?.(a)}
                >
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[styles.assetName, { color: theme.text }]} numberOfLines={1}>{a.name}</Text>
                    <Text style={[styles.assetMeta, { color: theme.textMuted }]}>
                      {a.currency !== 'KRW' && `$${a.currencyValue?.toLocaleString()} · 1${a.currency}=${a.fxRate}원 · `}
                      <Text style={{ color: a.delta >= 0 ? theme.brand : theme.danger, fontWeight: '600' }}>
                        {a.delta > 0 ? '+' : ''}{krwShort(a.delta)} ({pct(a.deltaPct)})
                      </Text>
                    </Text>
                  </View>
                  <Text style={[styles.assetValue, { color: a.isLiability ? theme.danger : theme.text }]}>
                    {krw(a.value)}
                  </Text>
                  {Icon.chevronRight(theme.textMuted)}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      })}

      <SnapshotSheet
        visible={snapshotAll}
        onClose={() => setSnapshotAll(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  headerLabel: { fontSize: 13, fontWeight: '500', marginBottom: 4 },
  headerValue: { fontSize: 28, fontWeight: '800', letterSpacing: -0.8 },
  actionBlock: { paddingHorizontal: 20, paddingBottom: 16 },
  actionRow: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  actionBtnPrimary: { color: '#fff', fontSize: 13, fontWeight: '700' },
  actionBtnSoft: { fontSize: 13, fontWeight: '700' },
  actionCaption: { fontSize: 11, textAlign: 'center', marginTop: 8 },
  groupBlock: { paddingHorizontal: 20, paddingBottom: 14 },
  groupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingHorizontal: 4 },
  groupHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  groupLabel: { fontSize: 13, fontWeight: '700' },
  groupCount: { fontSize: 11 },
  groupSum: { fontSize: 12, fontWeight: '600' },
  groupCard: { borderRadius: 14, borderWidth: 1 },
  assetRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  assetName: { fontSize: 14, fontWeight: '600', marginBottom: 3 },
  assetMeta: { fontSize: 11 },
  assetValue: { fontSize: 14, fontWeight: '700', textAlign: 'right' },
});
