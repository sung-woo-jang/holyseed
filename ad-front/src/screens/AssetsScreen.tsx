import React, { useState } from 'react';
import Badge from '../components/ui/Badge';
import Border from '../components/ui/Border';
import ListRow from '../components/ui/ListRow';
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
import styles from './AssetsScreen.module.css';

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
    <div className={styles.root} style={{ backgroundColor: theme.bg }}>
      <div className={styles.scroll}>
        {/* Total net worth */}
        <div className={styles.header}>
          <span className={styles.headerLabel} style={{ color: theme.textMuted }}>총 순자산</span>
          <span className={styles.headerValue} style={{ color: theme.text }}>{krw(total)}</span>
        </div>

        {/* 개별입력 피킹 배너 */}
        {pickingAsset && (
          <div className={styles.pickingBanner} style={{ backgroundColor: theme.brandSoft }}>
            <span className={styles.pickingText} style={{ color: theme.brand }}>개별 입력할 자산을 선택하세요</span>
            <button type="button" onClick={() => setPickingAsset(false)}>
              <span className={styles.pickingCancel} style={{ color: theme.brand }}>취소</span>
            </button>
          </div>
        )}

        {/* Action buttons — 자산이 있을 때만 */}
        {!isViewer && !pickingAsset && data.assets.length > 0 && (
          <div className={styles.actionBlock}>
            <div className={styles.actionRow}>
              <button
                type="button"
                className={styles.actionBtn}
                style={{ backgroundColor: theme.brand }}
                onClick={() => { setSnapshotFocusId(undefined); setSnapshotOpen(true); }}
              >
                <TossEmoji code={TE.camera} size={18} />
                <span className={styles.actionBtnPrimary}>일괄 스냅샷</span>
              </button>
              <button
                type="button"
                className={styles.actionBtn}
                style={{ backgroundColor: theme.brandSoft }}
                onClick={() => setPickingAsset(true)}
              >
                <TossEmoji code={TE.pencil} size={18} />
                <span className={styles.actionBtnSoft} style={{ color: theme.brand }}>개별 입력</span>
              </button>
            </div>
          </div>
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
            <div key={cat} className={styles.groupBlock}>
              <div className={styles.groupHeader}>
                <div className={styles.groupHeaderLeft}>
                  <TossEmoji code={meta.iconCode} size={18} />
                  <span className={styles.groupLabel} style={{ color: theme.text }}>{meta.label}</span>
                  <span className={styles.groupCount} style={{ color: theme.textMuted }}>· {items.length}건</span>
                </div>
                <span className={styles.groupSum} style={{ color: theme.textMuted }}>{krwShort(sum)}원</span>
              </div>
              <div className={styles.groupCard} style={{ backgroundColor: theme.card, borderColor: theme.border }}>
                {items.map((a, i) => (
                  <React.Fragment key={a.id}>
                    <ListRow
                      contents={
                        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                          <span className={styles.assetName} style={{ color: theme.text }}>{a.name}</span>
                          {a.delta != null && (
                            <span className={styles.assetMeta}>
                              <span style={{ color: a.delta >= 0 ? theme.brand : theme.danger, fontWeight: 600 }}>
                                {a.delta > 0 ? '+' : ''}{krwShort(a.delta)} ({pct(a.deltaPct ?? 0)})
                              </span>
                            </span>
                          )}
                        </div>
                      }
                      right={
                        <div className={styles.assetRight}>
                          <span className={styles.assetValue} style={{ color: a.isLiability ? theme.danger : theme.text }}>
                            {krw(a.value)}
                          </span>
                          {pickingAsset ? (
                            <Badge type="blue" badgeStyle="weak" size="small">선택</Badge>
                          ) : !isViewer ? (
                            <button
                              type="button"
                              className={styles.kebabBtn}
                              onClick={(e) => { e.stopPropagation(); setActionAsset(a); }}
                            >
                              <span className={styles.kebabIcon} style={{ color: theme.textMuted }}>⋯</span>
                            </button>
                          ) : null}
                        </div>
                      }
                      withArrow={pickingAsset}
                      onPress={() => pickingAsset ? handlePickAsset(a.id) : onAssetPress?.(a)}
                      verticalPadding="small"
                    />
                    {i < items.length - 1 && <Border type="full" />}
                  </React.Fragment>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* FAB */}
      {!isViewer && !pickingAsset && (
        <button
          type="button"
          className={styles.fab}
          style={{ backgroundColor: theme.brand }}
          onClick={() => setAddAssetOpen(true)}
        >
          <span className={styles.fabText}>+</span>
        </button>
      )}

      <SnapshotSheet
        visible={snapshotOpen}
        focusAssetId={snapshotFocusId}
        onClose={handleSnapshotClose}
        onSaved={() => setToast('스냅샷을 저장했어요')}
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
    </div>
  );
}
