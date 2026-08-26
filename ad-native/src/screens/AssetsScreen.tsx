import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import ActionSheet from '../components/common/ActionSheet';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import TossEmoji from '../components/common/TossEmoji';
import JointAvatar from '../components/common/JointAvatar';
import AppToast from '../components/common/AppToast';
import AddAssetSheet from '../components/sheets/AddAssetSheet';
import SnapshotSheet from '../components/sheets/SnapshotSheet';
import Border from '../components/ui/Border';
import ListRow from '../components/ui/ListRow';
import { getAssetCategoryMeta } from '../lib/category-meta';
import { useHouseholdData, type HouseholdAsset } from '../queries/useHouseholdData';
import { krw, krwShort, pct } from '../lib/format';
import { useTheme } from '../lib/theme';
import { TE } from '../lib/toss-emoji';
import { useAuthStore } from '../stores/auth.store';
import { useDeleteAsset } from '../queries/mutations';
import type { AssetCategory } from '../types/api';
import type { AssetsStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AssetsStackParamList, 'AssetsList'>;

export default function AssetsScreen({ navigation }: Props) {
  const theme = useTheme();
  const data = useHouseholdData();
  const { user, currentHousehold } = useAuthStore();
  const myId = user ? Number(user.id) : null;
  const isViewer = currentHousehold?.role === 'VIEWER';
  const [snapshotOpen, setSnapshotOpen] = useState(false);
  const [addAssetOpen, setAddAssetOpen] = useState(false);
  const [actionAsset, setActionAsset] = useState<HouseholdAsset | null>(null);
  const [editAsset, setEditAsset] = useState<HouseholdAsset | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HouseholdAsset | null>(null);
  const [toast, setToast] = useState('');
  const [ownerFilter, setOwnerFilter] = useState<'all' | 'joint' | number>('all');
  const [refreshing, setRefreshing] = useState(false);
  const deleteAsset = useDeleteAsset();

  async function onRefresh() {
    setRefreshing(true);
    try {
      await data.refetch();
    } finally {
      setRefreshing(false);
    }
  }

  function handleAction(value: string) {
    const a = actionAsset;
    setActionAsset(null);
    if (!a) return;
    if (value === 'snapshot') {
      setSnapshotOpen(true);
    } else if (value === 'edit') {
      setEditAsset(a);
      setAddAssetOpen(true);
    } else if (value === 'delete') {
      setDeleteTarget(a);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteAsset.mutateAsync(Number(deleteTarget.id));
      setToast('자산을 삭제했어요');
    } catch {
      setToast('삭제에 실패했어요');
    } finally {
      setDeleteTarget(null);
    }
  }

  const filteredAssets = data.assets.filter((a) => {
    if (ownerFilter === 'all') return true;
    if (ownerFilter === 'joint') return a.ownerUserId == null;
    return a.ownerUserId === ownerFilter;
  });

  const grouped: Partial<Record<AssetCategory, HouseholdAsset[]>> = {};
  filteredAssets.forEach((a) => {
    if (!grouped[a.category]) grouped[a.category] = [];
    grouped[a.category]!.push(a);
  });

  const total = filteredAssets.reduce((s, a) => s + (a.isLiability ? -a.value : a.value), 0);

  function ownerBadge(ownerUserId: number | null | undefined, size = 24) {
    if (ownerUserId == null) return <JointAvatar size={size} brand={theme.brand} muted={theme.textMuted} />;
    const owner = data.members.find((m) => Number(m.id) === ownerUserId);
    return (
      <View style={[styles.ownerBadge, { width: size, height: size, borderRadius: size / 2, backgroundColor: owner?.avatar ?? theme.textMuted }]}>
        <Text style={styles.ownerBadgeText}>{owner?.initial ?? '?'}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={[styles.root, { backgroundColor: theme.bg }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.brand} colors={[theme.brand]} />}
      >
        <View style={styles.header}>
          <Text style={[styles.headerLabel, { color: theme.textMuted }]}>총 순자산</Text>
          <Text style={[styles.headerValue, { color: theme.text }]}>{krw(total)}</Text>
        </View>

        {data.isLoading && (
          <View style={styles.ownerFilterSkeleton}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={[styles.ownerChipSkeleton, { backgroundColor: theme.border }]} />
            ))}
          </View>
        )}
        {!data.isLoading && data.members.length > 1 && data.assets.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ownerFilterRow}>
            <Pressable
              style={[styles.ownerChip, { backgroundColor: ownerFilter === 'all' ? theme.brandSoft : theme.card, borderColor: ownerFilter === 'all' ? theme.brand : theme.border }]}
              onPress={() => setOwnerFilter('all')}
            >
              <Text style={[styles.ownerChipLabel, { color: ownerFilter === 'all' ? theme.brand : theme.text, marginLeft: 6 }]}>전체</Text>
            </Pressable>
            {data.members.map((m) => {
              const active = ownerFilter === Number(m.id);
              return (
                <Pressable
                  key={m.id}
                  style={[styles.ownerChip, { backgroundColor: active ? theme.brandSoft : theme.card, borderColor: active ? theme.brand : theme.border }]}
                  onPress={() => setOwnerFilter(Number(m.id))}
                >
                  <View style={[styles.ownerChipDot, { backgroundColor: m.avatar }]}>
                    <Text style={styles.ownerChipDotText}>{m.initial}</Text>
                  </View>
                  <Text style={[styles.ownerChipLabel, { color: active ? theme.brand : theme.text }]}>{m.name}</Text>
                </Pressable>
              );
            })}
            <Pressable
              style={[styles.ownerChip, { backgroundColor: ownerFilter === 'joint' ? theme.brandSoft : theme.card, borderColor: ownerFilter === 'joint' ? theme.brand : theme.border }]}
              onPress={() => setOwnerFilter('joint')}
            >
              <View style={styles.ownerChipDot}>
                <JointAvatar size={18} brand={theme.brand} muted={theme.textMuted} />
              </View>
              <Text style={[styles.ownerChipLabel, { color: ownerFilter === 'joint' ? theme.brand : theme.text }]}>공동</Text>
            </Pressable>
          </ScrollView>
        )}

        {!isViewer && data.assets.length > 0 && (
          <View style={styles.actionRow}>
            <Pressable
              style={[styles.actionBtn, { backgroundColor: theme.brand }]}
              onPress={() => setSnapshotOpen(true)}
            >
              <TossEmoji code={TE.camera} size={18} />
              <Text style={styles.actionBtnPrimary}>일괄 스냅샷</Text>
            </Pressable>
          </View>
        )}

        {data.assets.length === 0 && <EmptyState iconCode={TE.piggy} title="아직 등록된 자산이 없어요" desc="아래 + 버튼으로 첫 자산을 추가해보세요" />}
        {data.assets.length > 0 && filteredAssets.length === 0 && <EmptyState compact iconCode={TE.piggy} title="이 소유자의 자산이 없어요" />}

        {(Object.entries(grouped) as [AssetCategory, HouseholdAsset[]][]).map(([cat, items]) => {
          const meta = getAssetCategoryMeta(cat);
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
                  <View key={a.id}>
                    <ListRow
                      left={ownerBadge(a.ownerUserId)}
                      contents={
                        <View style={{ minWidth: 0 }}>
                          <Text style={[styles.assetName, { color: theme.text }]} numberOfLines={1}>
                            {a.name}
                          </Text>
                          {a.delta != null && (
                            <Text style={{ color: a.delta >= 0 ? theme.brand : theme.danger, fontWeight: '600', fontSize: 11 }}>
                              {a.delta > 0 ? '+' : ''}
                              {krwShort(a.delta)} ({pct(a.deltaPct ?? 0)})
                            </Text>
                          )}
                        </View>
                      }
                      right={
                        <View style={styles.assetRight}>
                          <Text style={[styles.assetValue, { color: a.isLiability ? theme.danger : theme.text }]}>{krw(a.value)}</Text>
                          {!isViewer && (a.ownerUserId == null || a.ownerUserId === myId) && (
                            <Pressable hitSlop={8} onPress={() => setActionAsset(a)}>
                              <Text style={[styles.kebabIcon, { color: theme.textMuted }]}>⋯</Text>
                            </Pressable>
                          )}
                        </View>
                      }
                      onPress={() => navigation.navigate('AssetDetail', { id: a.id })}
                      verticalPadding="small"
                    />
                    {i < items.length - 1 && <Border type="full" />}
                  </View>
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {!isViewer && (
        <Pressable style={[styles.fab, { backgroundColor: theme.brand }]} onPress={() => setAddAssetOpen(true)}>
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      )}

      <SnapshotSheet visible={snapshotOpen} onClose={() => setSnapshotOpen(false)} onSaved={() => setToast('스냅샷을 저장했어요')} />
      <AddAssetSheet
        visible={addAssetOpen}
        editAsset={editAsset}
        onClose={() => {
          setAddAssetOpen(false);
          setEditAsset(null);
        }}
        onSaved={(mode) => setToast(mode === 'edit' ? '자산을 수정했어요' : '자산을 추가했어요')}
      />

      <ActionSheet
        visible={!!actionAsset}
        title={actionAsset?.name}
        items={[
          { iconCode: TE.camera, label: '스냅샷 입력', value: 'snapshot' },
          { iconCode: TE.pencil, label: '자산 수정', value: 'edit' },
          { iconCode: TE.trash, label: '자산 삭제', value: 'delete', danger: true },
        ]}
        onSelect={handleAction}
        onClose={() => setActionAsset(null)}
      />

      <ConfirmDialog
        visible={!!deleteTarget}
        title="자산을 삭제할까요?"
        description="이 자산과 모든 스냅샷 기록이 함께 삭제돼요."
        confirmText="삭제하기"
        danger
        loading={deleteAsset.isPending}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />

      <AppToast open={!!toast} text={toast} onClose={() => setToast('')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingBottom: 100 },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  headerLabel: { fontSize: 13, fontWeight: '500', marginBottom: 4 },
  headerValue: { fontSize: 28, fontWeight: '800', letterSpacing: -0.8 },
  ownerFilterSkeleton: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingBottom: 12 },
  ownerChipSkeleton: { width: 64, height: 30, borderRadius: 999, opacity: 0.5 },
  ownerFilterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingBottom: 12 },
  ownerChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1.4 },
  ownerChipDot: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  ownerChipDotText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  ownerChipLabel: { fontSize: 12.5, fontWeight: '700' },
  ownerBadge: { alignItems: 'center', justifyContent: 'center' },
  ownerBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  actionRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingBottom: 16 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12 },
  actionBtnPrimary: { color: '#fff', fontSize: 13, fontWeight: '700' },
  groupBlock: { paddingHorizontal: 20, paddingBottom: 14 },
  groupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingHorizontal: 4 },
  groupHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  groupLabel: { fontSize: 13, fontWeight: '700' },
  groupCount: { fontSize: 11 },
  groupSum: { fontSize: 12, fontWeight: '600' },
  groupCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  assetName: { fontSize: 14, fontWeight: '600' },
  assetRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  assetValue: { fontSize: 14, fontWeight: '700' },
  kebabIcon: { fontSize: 20, fontWeight: '700', paddingHorizontal: 6 },
  fab: { position: 'absolute', bottom: 20, right: 20, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  fabText: { fontSize: 28, color: '#fff' },
});
