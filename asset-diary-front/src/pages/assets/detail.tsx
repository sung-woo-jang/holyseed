import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createRoute } from '@granite-js/react-native';
import React, { useState } from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { assetsApi, snapshotsApi } from '../../api';
import ScreenHeader, { HeaderButton } from '../../components/common/ScreenHeader';
import SnapshotSheet from '../../components/sheets/SnapshotSheet';
import { useCanEdit } from '../../hooks';
import { qk } from '../../queries/keys';
import { ASSET_CATEGORY_LABEL, dateStr, krw, krwShort } from '../../lib/format';
import type { Asset } from '../../types/api';

export const Route = createRoute('/assets/detail', {
  component: AssetDetailPage,
});

function AssetDetailPage() {
  const navigation = Route.useNavigation();
  const params = Route.useParams();
  const assetId = Number((params as Record<string, unknown>)['assetId'] ?? 0);
  const qc = useQueryClient();
  const canEdit = useCanEdit();
  const [snapshotVisible, setSnapshotVisible] = useState(false);

  const { data: asset, isLoading } = useQuery({
    queryKey: qk.asset(assetId),
    queryFn: () => assetsApi.get(assetId),
    enabled: !!assetId,
  });

  const { data: snapshots = [] } = useQuery({
    queryKey: qk.assetSnapshots(assetId),
    queryFn: () => snapshotsApi.list(assetId),
    enabled: !!assetId,
  });

  const { mutate: archiveAsset } = useMutation({
    mutationFn: () => assetsApi.archive(assetId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.assets(asset?.householdId ?? 0) });
      navigation.goBack();
    },
  });

  if (isLoading || !asset) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="자산 상세" onBack={() => navigation.goBack()} />
      </View>
    );
  }

  const currentValue = asset.latestSnapshot?.valueKRW ?? 0;

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={asset.name}
        onBack={() => navigation.goBack()}
        right={
          canEdit ? (
            <HeaderButton label="입력" onPress={() => setSnapshotVisible(true)} />
          ) : undefined
        }
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.summaryCard}>
          <Text style={styles.categoryLabel}>{ASSET_CATEGORY_LABEL[asset.category]}</Text>
          <Text style={[styles.valueText, asset.isLiability && styles.negative]}>
            {krw(currentValue)}
          </Text>
          {asset.latestSnapshot && (
            <Text style={styles.dateLabel}>{dateStr(asset.latestSnapshot.date)} 기준</Text>
          )}
          {asset.isLiability && (
            <View style={styles.liabilityBadge}>
              <Text style={styles.liabilityText}>부채</Text>
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>스냅샷 히스토리</Text>
        {snapshots.length === 0 ? (
          <Text style={styles.emptyText}>아직 평가액 기록이 없어요.</Text>
        ) : (
          <FlatList
            data={[...snapshots].sort((a, b) => b.date.localeCompare(a.date))}
            keyExtractor={(item) => String(item.id)}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.snapshotRow}>
                <Text style={styles.snapshotDate}>{dateStr(item.date)}</Text>
                <Text style={[styles.snapshotValue, asset.isLiability && styles.negative]}>
                  {krwShort(item.valueKRW)}
                </Text>
              </View>
            )}
          />
        )}

        {canEdit && (
          <TouchableOpacity
            style={styles.archiveBtn}
            onPress={() => archiveAsset()}
          >
            <Text style={styles.archiveBtnText}>자산 보관</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <SnapshotSheet
        visible={snapshotVisible}
        asset={asset as Asset}
        onClose={() => setSnapshotVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, paddingBottom: 40 },
  summaryCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
    marginBottom: 28,
  },
  categoryLabel: { fontSize: 12, color: '#8B95A1', marginBottom: 8 },
  valueText: { fontSize: 28, fontWeight: '800', color: '#191F28', marginBottom: 4 },
  dateLabel: { fontSize: 12, color: '#8B95A1' },
  negative: { color: '#FF3B30' },
  liabilityBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFEEEE',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 8,
  },
  liabilityText: { fontSize: 11, color: '#FF3B30', fontWeight: '600' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#191F28', marginBottom: 12 },
  emptyText: { fontSize: 14, color: '#8B95A1', textAlign: 'center', paddingVertical: 24 },
  snapshotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F6',
  },
  snapshotDate: { fontSize: 14, color: '#4E5968' },
  snapshotValue: { fontSize: 14, fontWeight: '600', color: '#191F28' },
  archiveBtn: {
    marginTop: 32,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E8EB',
    alignItems: 'center',
  },
  archiveBtnText: { fontSize: 14, color: '#8B95A1' },
});
