import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Badge, Border, ListRow } from '@toss/tds-react-native';
import { useDataSource, useMockRole } from '../lib/data-source';
import { useTheme } from '../lib/theme';
import { krw, krwShort, pct } from '../lib/format';
import { getAssetCategoryMeta } from '../lib/category-meta';
import { TE } from '../lib/toss-emoji';
import TossEmoji from '../components/common/TossEmoji';
import SnapshotSheet from '../components/sheets/SnapshotSheet';
import AddAssetSheet from '../components/sheets/AddAssetSheet';
import EmptyState from '../components/common/EmptyState';
import ActionSheet from '../components/common/ActionSheet';
import ConfirmDialog from '../components/common/ConfirmDialog';
import AppToast from '../components/common/AppToast';
import { useDeleteAsset } from '../queries/mutations';
import type { AssetCategory } from '../types/api';
import type { MockAsset } from '../lib/mock-data';

interface AssetsScreenProps {
  onAssetPress?: (asset: MockAsset) => void;
}

export default function AssetsScreen({ onAssetPress }: AssetsScreenProps) {
  const theme = useTheme();
  const role = useMockRole();
  const data = useDataSource();
  const [snapshotOpen, setSnapshotOpen] = useState(false);
  const [snapshotFocusId, setSnapshotFocusId] = useState<string | undefined>(undefined);
  const [pickingAsset, setPickingAsset] = useState(false);
  const [addAssetOpen, setAddAssetOpen] = useState(false);
  const [actionAsset, setActionAsset] = useState<MockAsset | null>(null);
  const [editAsset, setEditAsset] = useState<MockAsset | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MockAsset | null>(null);
  const [toast, setToast] = useState('');
  const deleteAsset = useDeleteAsset();
  const isViewer = role === 'VIEWER';

  function handleAction(value: string) {
    const a = actionAsset;
    setActionAsset(null);
    if (!a) return;
    if (value === 'snapshot') { setSnapshotFocusId(a.id); setSnapshotOpen(true); }
    else if (value === 'edit') { setEditAsset(a); }
    else if (value === 'delete') { setDeleteTarget(a); }
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

  const grouped: Partial<Record<AssetCategory, MockAsset[]>> = {};
  data.assets.forEach(a => {
    if (!grouped[a.category]) grouped[a.category] = [];
    grouped[a.category]!.push(a);
  });

  const total = data.assets.reduce((s, a) => s + (a.isLiability ? -a.value : a.value), 0);

  function handlePickAsset(assetId: string) {
    setSnapshotFocusId(assetId);
    setSnapshotOpen(true);
    setPickingAsset(false);
  }

  function handleSnapshotClose() {
    setSnapshotOpen(false);
    setSnapshotFocusId(undefined);
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Total net worth */}
        <View style={styles.header}>
          <Text style={[styles.headerLabel, { color: theme.textMuted }]}>총 순자산</Text>
          <Text style={[styles.headerValue, { color: theme.text }]}>{krw(total)}</Text>
        </View>

        {/* 개별입력 피킹 배너 */}
        {pickingAsset && (
          <View style={[styles.pickingBanner, { backgroundColor: theme.brandSoft }]}>
            <Text style={[styles.pickingText, { color: theme.brand }]}>개별 입력할 자산을 선택하세요</Text>
            <TouchableOpacity onPress={() => setPickingAsset(false)}>
              <Text style={[styles.pickingCancel, { color: theme.brand }]}>취소</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Action buttons — 자산이 있을 때만 */}
        {!isViewer && !pickingAsset && data.assets.length > 0 && (
          <View style={styles.actionBlock}>
            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.brand }]} onPress={() => { setSnapshotFocusId(undefined); setSnapshotOpen(true); }}>
                <TossEmoji code={TE.camera} size={18} />
                <Text style={styles.actionBtnPrimary}>일괄 스냅샷</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.brandSoft }]} onPress={() => setPickingAsset(true)}>
                <TossEmoji code={TE.pencil} size={18} />
                <Text style={[styles.actionBtnSoft, { color: theme.brand }]}>개별 입력</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 빈 상태 */}
        {data.assets.length === 0 && (
          <EmptyState
            iconCode={TE.piggy}
            title="아직 등록된 자산이 없어요"
            desc={isViewer ? '소유자가 자산을 추가하면 여기에 표시돼요' : '아래 + 버튼으로 첫 자산을 추가해보세요'}
          />
        )}

        {/* Asset groups */}
        {(Object.entries(grouped) as [AssetCategory, MockAsset[]][]).map(([cat, items]) => {
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
                  <React.Fragment key={a.id}>
                    <ListRow
                      contents={
                        <View style={{ minWidth: 0 }}>
                          <Text style={[styles.assetName, { color: theme.text }]} numberOfLines={1}>{a.name}</Text>
                          <Text style={[styles.assetMeta, { color: theme.textMuted }]}>
                            <Text style={{ color: a.delta >= 0 ? theme.brand : theme.danger, fontWeight: '600' }}>
                              {a.delta > 0 ? '+' : ''}{krwShort(a.delta)} ({pct(a.deltaPct)})
                            </Text>
                          </Text>
                        </View>
                      }
                      right={
                        <View style={styles.assetRight}>
                          <Text style={[styles.assetValue, { color: a.isLiability ? theme.danger : theme.text }]}>
                            {krw(a.value)}
                          </Text>
                          {pickingAsset ? (
                            <Badge type="blue" badgeStyle="weak" size="small">선택</Badge>
                          ) : !isViewer ? (
                            <TouchableOpacity
                              onPress={() => setActionAsset(a)}
                              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                              style={styles.kebabBtn}
                            >
                              <Text style={[styles.kebabIcon, { color: theme.textMuted }]}>⋯</Text>
                            </TouchableOpacity>
                          ) : null}
                        </View>
                      }
                      withArrow={pickingAsset}
                      onPress={() => pickingAsset ? handlePickAsset(a.id) : onAssetPress?.(a)}
                      verticalPadding="small"
                    />
                    {i < items.length - 1 && <Border type="full" />}
                  </React.Fragment>
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* FAB */}
      {!isViewer && !pickingAsset && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.brand }]}
          onPress={() => setAddAssetOpen(true)}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}

      <SnapshotSheet
        visible={snapshotOpen}
        focusAssetId={snapshotFocusId}
        onClose={handleSnapshotClose}
      />
      <AddAssetSheet
        visible={addAssetOpen}
        onClose={() => setAddAssetOpen(false)}
        onSaved={() => setToast('자산을 추가했어요')}
      />
      <AddAssetSheet
        visible={!!editAsset}
        editAsset={editAsset}
        onClose={() => setEditAsset(null)}
        onSaved={() => setToast('자산을 수정했어요')}
      />

      {/* 행 액션 메뉴 */}
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

      {/* 삭제 확인 */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  headerLabel: { fontSize: 13, fontWeight: '500', marginBottom: 4 },
  headerValue: { fontSize: 28, fontWeight: '800', letterSpacing: -0.8 },
  pickingBanner: { marginHorizontal: 20, marginBottom: 12, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pickingText: { fontSize: 13, fontWeight: '600' },
  pickingCancel: { fontSize: 13, fontWeight: '700' },
  actionBlock: { paddingHorizontal: 20, paddingBottom: 16 },
  actionRow: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  actionBtnPrimary: { color: '#fff', fontSize: 13, fontWeight: '700' },
  actionBtnSoft: { fontSize: 13, fontWeight: '700' },
  groupBlock: { paddingHorizontal: 20, paddingBottom: 14 },
  groupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingHorizontal: 4 },
  groupHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  groupLabel: { fontSize: 13, fontWeight: '700' },
  groupCount: { fontSize: 11 },
  groupSum: { fontSize: 12, fontWeight: '600' },
  groupCard: { borderRadius: 14, borderWidth: 1 },
  assetName: { fontSize: 14, fontWeight: '600', marginBottom: 3 },
  assetMeta: { fontSize: 11 },
  assetRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  assetValue: { fontSize: 14, fontWeight: '700', textAlign: 'right' },
  kebabBtn: { paddingHorizontal: 2 },
  kebabIcon: { fontSize: 20, fontWeight: '700' },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3182F6',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  fabText: { fontSize: 28, color: '#fff', lineHeight: 32 },
});
