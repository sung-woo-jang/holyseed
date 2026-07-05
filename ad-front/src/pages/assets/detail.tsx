import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Border from '../../components/ui/Border';
import Button from '../../components/ui/Button';
import ListRow from '../../components/ui/ListRow';
import Loader from '../../components/ui/Loader';
import TextField from '../../components/ui/TextField';
import ScreenHeader from '../../components/common/ScreenHeader';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useTheme } from '../../lib/theme';
import { useDataSource, useMockRole } from '../../lib/data-source';
import TossEmoji from '../../components/common/TossEmoji';
import LineChart from '../../components/charts/LineChart';
import SnapshotSheet from '../../components/sheets/SnapshotSheet';
import { getAssetCategoryMeta } from '../../lib/category-meta';
import { krw, krwShort, pct } from '../../lib/format';
import { TE } from '../../lib/toss-emoji';
import { Icon } from '../../components/common/Icon';
import { snapshotsApi } from '../../api';
import { qk } from '../../queries/keys';
import { useUpdateAsset, useDeleteAsset } from '../../queries/mutations';
import styles from './detail.module.css';

export default function AssetDetailPage() {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const theme = useTheme();
  const data = useDataSource();
  const role = useMockRole();
  // 앱 폭(최대 480px) 기준, 섹션 좌우 패딩(20*2) 제외한 차트 가용 폭
  const chartWidth = Math.min(window.innerWidth, 480) - 40;
  const [menuOpen, setMenuOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [snapshotOpen, setSnapshotOpen] = useState(false);
  const updateAsset = useUpdateAsset();
  const deleteAsset = useDeleteAsset();

  const assetId = params.id;
  const asset = assetId ? data.assets.find((a) => String(a.id) === assetId) : undefined;

  // 실제 스냅샷 쿼리 — useHouseholdData의 snapshots:{} 는 항상 빈 객체
  const snapshotsQ = useQuery({
    queryKey: qk.assetSnapshots(Number(assetId)),
    queryFn: () => snapshotsApi.list(Number(assetId)),
    enabled: !!assetId && !isNaN(Number(assetId)),
    staleTime: 30_000,
  });

  const rawSnapshots = Array.isArray(snapshotsQ.data) ? snapshotsQ.data : [];
  const snapshots = rawSnapshots
    .map((s: any) => ({
      date: s.date,
      valueKRW: s.valueKRW ?? s.value,
    }))
    .slice()
    .reverse();

  // 자산을 못 찾으면 (삭제됐거나 잘못된 id) 빈 상태 표시
  if (!asset) {
    return (
      <div className={styles.root} style={{ backgroundColor: theme.bg }}>
        <ScreenHeader title="자산 상세" onBack={() => navigate(-1)} />
        <EmptyState
          iconCode={TE.search}
          title="자산을 찾을 수 없어요"
          desc="삭제되었거나 접근할 수 없는 자산이에요"
        />
      </div>
    );
  }

  const meta = getAssetCategoryMeta(asset.category);

  const chartData = snapshots.map((s) => ({
    date: s.date,
    value: s.valueKRW,
  }));

  const relatedTxs = data.transactions
    .filter((t) => t.from === asset.id || t.to === asset.id)
    .slice(0, 4);

  async function handleRename() {
    if (!asset || !nameInput.trim()) return;
    await updateAsset.mutateAsync({ id: Number(asset.id), dto: { name: nameInput.trim() } });
    setEditingName(false);
    setNameInput('');
    setMenuOpen(false);
  }

  async function handleDelete() {
    if (!asset) return;
    await deleteAsset.mutateAsync(Number(asset.id));
    navigate(-1);
  }

  const kebabMenu = (
    <div className={styles.kebabWrap}>
      <button type="button" onClick={() => setMenuOpen(v => !v)}>
        <span className={styles.kebabIcon} style={{ color: theme.textMuted }}>⋯</span>
      </button>
      {menuOpen && (
        <>
          {/* 뒤 딤 클릭 시 닫기 */}
          <div className={styles.menuBackdrop} onClick={() => setMenuOpen(false)} />
          <div className={styles.menuDropdown} style={{ backgroundColor: theme.card, borderColor: theme.border }}>
            <button
              type="button"
              className={styles.menuItem}
              style={{ borderBottom: `1px solid ${theme.border}` }}
              onClick={() => { setNameInput(asset.name); setEditingName(true); setMenuOpen(false); }}
            >
              <TossEmoji code={TE.pencil} size={16} />
              <span className={styles.menuItemText} style={{ color: theme.text }}>자산명 수정</span>
            </button>
            <button
              type="button"
              className={styles.menuItem}
              onClick={() => { setConfirmDelete(true); setMenuOpen(false); }}
            >
              <TossEmoji code={TE.trash} size={16} />
              <span className={styles.menuItemText} style={{ color: theme.danger }}>자산 삭제</span>
            </button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className={styles.root} style={{ backgroundColor: theme.bg }}>
      <ScreenHeader
        title="자산 상세"
        onBack={() => navigate(-1)}
        right={role !== 'VIEWER' ? kebabMenu : undefined}
      />
      <div className={styles.scroll}>
        {/* 자산 요약 */}
        <div className={styles.summaryCard} style={{ backgroundColor: theme.card, borderBottom: `1px solid ${theme.border}` }}>
          <div className={styles.summaryTop}>
            <TossEmoji code={meta.iconCode} size={48} bg={meta.color + '22'} />
            <div className={styles.summaryTopText}>
              <span className={styles.catLabel} style={{ color: theme.textMuted }}>{meta.label}</span>
              {editingName ? (
                <div className={styles.renameRow}>
                  <div style={{ flex: 1 }}>
                    <TextField
                      variant="line"
                      value={nameInput}
                      onChangeText={setNameInput}
                      autoFocus
                    />
                  </div>
                  <Button
                    size="medium"
                    type="primary"
                    display="inline"
                    loading={updateAsset.isPending}
                    onPress={handleRename}
                  >
                    확인
                  </Button>
                </div>
              ) : (
                <span className={styles.assetName} style={{ color: theme.text }}>{asset.name}</span>
              )}
            </div>
          </div>
          <span className={styles.valueText} style={{ color: asset.isLiability ? theme.danger : theme.text }}>
            {krw(asset.value)}
          </span>
          <div className={styles.deltaBadge}>
            <span className={styles.deltaChip} style={{ backgroundColor: asset.delta >= 0 ? theme.brandSoft : '#FEE2E2' }}>
              <span style={{ marginRight: 4, display: 'inline-flex' }}>{Icon.arrowUp(asset.delta >= 0 ? theme.brand : theme.danger, 12)}</span>
              <span className={styles.deltaText} style={{ color: asset.delta >= 0 ? theme.brand : theme.danger }}>
                {krwShort(Math.abs(asset.delta))} ({pct(asset.deltaPct)})
              </span>
            </span>
          </div>
          {role !== 'VIEWER' && (
            <Button
              display="full"
              size="big"
              type="primary"
              style="weak"
              leftAccessory={<TossEmoji code={TE.camera} size={18} />}
              onPress={() => setSnapshotOpen(true)}
            >
              이 자산만 스냅샷 입력
            </Button>
          )}
        </div>

        {/* 평가액 추이 */}
        <div className={styles.section} style={{ backgroundColor: theme.card, marginTop: 8 }}>
          <span className={styles.sectionTitle} style={{ color: theme.text }}>평가액 추이</span>
          {chartData.length > 1 ? (
            <LineChart
              data={chartData}
              width={chartWidth}
              height={150}
              color={meta.color}
              dark={theme.dark}
              interactive
            />
          ) : (
            <div className={styles.emptyChart}>
              <span style={{ color: theme.textMuted, fontSize: 13 }}>스냅샷이 2개 이상이면 그래프가 나타나요</span>
            </div>
          )}
        </div>

        {/* 스냅샷 히스토리 */}
        <div className={styles.section} style={{ backgroundColor: theme.card, marginTop: 8 }}>
          <span className={styles.sectionTitle} style={{ color: theme.text }}>스냅샷 히스토리</span>
          {snapshotsQ.isLoading ? (
            <div className={styles.emptyRow}><Loader /></div>
          ) : snapshots.length === 0 ? (
            <div className={styles.emptyRow}>
              <span className={styles.emptyText} style={{ color: theme.textMuted }}>스냅샷이 없어요</span>
            </div>
          ) : (
            snapshots.map((s, idx) => (
              <React.Fragment key={s.date + idx}>
                <ListRow
                  contents={<span className={styles.snapDate} style={{ color: theme.textMuted }}>{s.date}</span>}
                  right={<span className={styles.snapValue} style={{ color: theme.text }}>{krw(s.valueKRW)}</span>}
                  verticalPadding="small"
                />
                {idx < snapshots.length - 1 && <Border type="full" />}
              </React.Fragment>
            ))
          )}
        </div>

        {/* 관련 거래 */}
        {relatedTxs.length > 0 && (
          <div className={styles.section} style={{ backgroundColor: theme.card, marginTop: 8, marginBottom: 32 }}>
            <span className={styles.sectionTitle} style={{ color: theme.text }}>관련 거래</span>
            {relatedTxs.map((tx, idx) => {
              const amtColor = tx.type === 'INCOME' ? theme.brand : tx.type === 'EXPENSE' ? theme.danger : theme.textMuted;
              const sign = tx.type === 'INCOME' ? '+' : tx.type === 'EXPENSE' ? '-' : '';
              return (
                <React.Fragment key={tx.id}>
                  <ListRow
                    left={
                      <div className={styles.txIcon} style={{ backgroundColor: theme.bg }}>
                        <span style={{ fontSize: 16 }}>{tx.category.slice(0, 1)}</span>
                      </div>
                    }
                    contents={
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className={styles.txTitle} style={{ color: theme.text }}>{tx.title}</span>
                        <span className={styles.txMeta} style={{ color: theme.textMuted }}>{tx.date}</span>
                      </div>
                    }
                    right={
                      <span className={styles.txAmount} style={{ color: amtColor }}>{sign}{krwShort(tx.amount)}</span>
                    }
                    verticalPadding="small"
                  />
                  {idx < relatedTxs.length - 1 && <Border type="full" />}
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>

      <SnapshotSheet
        visible={snapshotOpen}
        focusAssetId={asset.id}
        onClose={() => setSnapshotOpen(false)}
      />

      <ConfirmDialog
        visible={confirmDelete}
        title="자산을 삭제할까요?"
        description="이 자산과 모든 스냅샷 기록이 함께 삭제돼요."
        confirmText="삭제하기"
        danger
        loading={deleteAsset.isPending}
        onConfirm={handleDelete}
        onClose={() => setConfirmDelete(false)}
      />
    </div>
  );
}
