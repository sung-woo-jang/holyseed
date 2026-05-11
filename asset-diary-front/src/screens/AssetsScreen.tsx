import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { assetsApi } from '../api';
import EmptyState from '../components/common/EmptyState';
import ScreenHeader, { HeaderButton } from '../components/common/ScreenHeader';
import SnapshotSheet from '../components/sheets/SnapshotSheet';
import { useCanEdit, useHousehold } from '../hooks';
import { qk } from '../queries/keys';
import type { Asset } from '../types/api';
import { ASSET_CATEGORY_LABEL, krwShort } from '../lib/format';

interface AssetsScreenProps {
  onAssetPress: (asset: Asset) => void;
}

export default function AssetsScreen({ onAssetPress }: AssetsScreenProps) {
  const { household } = useHousehold();
  const canEdit = useCanEdit();
  const [search, setSearch] = useState('');
  const [snapshotAsset, setSnapshotAsset] = useState<Asset | null>(null);

  const { data: assets = [], isLoading } = useQuery({
    queryKey: qk.assets(household?.id ?? 0),
    queryFn: () => assetsApi.list(household!.id),
    enabled: !!household,
  });

  const filtered = assets.filter(
    (a) => !a.archivedAt && a.name.includes(search),
  );

  const totalKrw = filtered.reduce((sum, a) => {
    const v = a.latestSnapshot?.valueKRW ?? 0;
    return sum + (a.isLiability ? -v : v);
  }, 0);

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="자산"
        right={
          canEdit ? (
            <HeaderButton label="일괄 스냅샷" onPress={() => setSnapshotAsset(filtered[0] ?? null)} />
          ) : undefined
        }
      />

      <View style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          placeholder="자산 검색"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>순자산</Text>
        <Text style={[styles.summaryValue, totalKrw < 0 && styles.negative]}>
          {krwShort(totalKrw)}
        </Text>
      </View>

      {isLoading ? null : filtered.length === 0 ? (
        <EmptyState icon="💰" title="자산이 없어요" desc="자산을 추가해 순자산을 추적해보세요." />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.assetRow} onPress={() => onAssetPress(item)}>
              <View style={styles.assetLeft}>
                <Text style={styles.assetName}>{item.name}</Text>
                <Text style={styles.assetCategory}>{ASSET_CATEGORY_LABEL[item.category]}</Text>
              </View>
              <View style={styles.assetRight}>
                <Text style={[styles.assetValue, item.isLiability && styles.negative]}>
                  {item.latestSnapshot ? krwShort(item.latestSnapshot.valueKRW) : '-'}
                </Text>
                {canEdit && (
                  <TouchableOpacity
                    style={styles.snapBtn}
                    onPress={() => setSnapshotAsset(item)}
                  >
                    <Text style={styles.snapBtnText}>입력</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      <SnapshotSheet
        visible={!!snapshotAsset}
        asset={snapshotAsset}
        onClose={() => setSnapshotAsset(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  searchBox: { paddingHorizontal: 20, paddingBottom: 12 },
  searchInput: {
    backgroundColor: '#F2F4F6',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  summaryCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 14,
  },
  summaryLabel: { fontSize: 12, color: '#8B95A1', marginBottom: 4 },
  summaryValue: { fontSize: 22, fontWeight: '700', color: '#191F28' },
  negative: { color: '#FF3B30' },
  list: { paddingHorizontal: 20, gap: 2 },
  assetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F6',
  },
  assetLeft: { flex: 1 },
  assetName: { fontSize: 15, fontWeight: '600', color: '#191F28', marginBottom: 2 },
  assetCategory: { fontSize: 12, color: '#8B95A1' },
  assetRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  assetValue: { fontSize: 15, fontWeight: '600', color: '#191F28' },
  snapBtn: {
    backgroundColor: '#EBF3FF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  snapBtnText: { fontSize: 12, color: '#3182F6', fontWeight: '600' },
});
