import React, { useState } from 'react';
import { createRoute } from '@granite-js/react-native';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Border, Button, ListRow, Loader, TextField } from '@toss/tds-react-native';
import { useQuery } from '@tanstack/react-query';
import ScreenHeader from '../../components/common/ScreenHeader';
import EmptyState from '../../components/common/EmptyState';
import { useTheme } from '../../lib/theme';
import { useDataSource, useMockRole } from '../../lib/data-source';
import TossEmoji from '../../components/common/TossEmoji';
import Segmented from '../../components/common/Segmented';
import LineChart from '../../components/charts/LineChart';
import SnapshotSheet from '../../components/sheets/SnapshotSheet';
import { ASSET_CATEGORY_META } from '../../lib/category-meta';
import { krw, krwShort, pct } from '../../lib/format';
import { TE } from '../../lib/toss-emoji';
import { Icon } from '../../components/common/Icon';
import { snapshotsApi } from '../../api';
import { qk } from '../../queries/keys';
import { useUpdateAsset, useDeleteAsset } from '../../queries/mutations';
import type { AssetCategory } from '../../types/api';

function AssetDetailScreen() {
  const navigation = Route.useNavigation();
  const params = Route.useParams() as { id?: string };
  const theme = useTheme();
  const data = useDataSource();
  const role = useMockRole();
  const [unit, setUnit] = useState<'KRW' | 'USD'>('KRW');
  const [menuOpen, setMenuOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [snapshotOpen, setSnapshotOpen] = useState(false);
  const updateAsset = useUpdateAsset();
  const deleteAsset = useDeleteAsset();

  const assetId = params?.id;
  const asset = assetId ? data.assets.find((a) => a.id === assetId) : undefined;

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
      value: s.value,
      fxRate: s.fxRateToKRW ?? 0,
      valueKRW: s.valueKRW ?? s.value,
    }))
    .slice()
    .reverse();

  // 자산을 못 찾으면 (삭제됐거나 잘못된 id) 빈 상태 표시
  if (!asset) {
    return (
      <View style={[styles.root, { backgroundColor: theme.bg }]}>
        <ScreenHeader title="자산 상세" onBack={() => navigation?.goBack?.()} />
        <EmptyState
          iconCode={TE.search}
          title="자산을 찾을 수 없어요"
          desc="삭제되었거나 접근할 수 없는 자산이에요"
        />
      </View>
    );
  }

  const meta = ASSET_CATEGORY_META[asset.category as AssetCategory];
  const isFx = asset.currency !== 'KRW';

  const chartData = snapshots.map((s) => ({
    date: s.date,
    value: unit === 'USD' ? s.value : s.valueKRW,
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
    navigation?.goBack?.();
  }

  const kebabMenu = (
    <View style={styles.kebabWrap}>
      <TouchableOpacity onPress={() => setMenuOpen(v => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={[styles.kebabIcon, { color: theme.textMuted }]}>⋯</Text>
      </TouchableOpacity>
      {menuOpen && (
        <>
          {/* 뒤 딤 클릭 시 닫기 */}
          <TouchableOpacity style={styles.menuBackdrop} onPress={() => setMenuOpen(false)} />
          <View style={[styles.menuDropdown, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: theme.border }]}
              onPress={() => { setNameInput(asset.name); setEditingName(true); setMenuOpen(false); }}
            >
              <TossEmoji code={TE.pencil} size={16} />
              <Text style={[styles.menuItemText, { color: theme.text }]}>자산명 수정</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => { setConfirmDelete(true); setMenuOpen(false); }}
            >
              <TossEmoji code={TE.trash} size={16} />
              <Text style={[styles.menuItemText, { color: theme.danger }]}>자산 삭제</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <ScreenHeader
        title="자산 상세"
        onBack={() => navigation?.goBack?.()}
        right={role !== 'VIEWER' ? kebabMenu : undefined}
      />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 자산 요약 */}
        <View style={[styles.summaryCard, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
          <View style={styles.summaryTop}>
            <TossEmoji code={meta.iconCode} size={48} bg={meta.color + '22'} />
            <View style={styles.summaryTopText}>
              <Text style={[styles.catLabel, { color: theme.textMuted }]}>{meta.label}</Text>
              {editingName ? (
                <View style={styles.renameRow}>
                  <View style={{ flex: 1 }}>
                    <TextField
                      variant="line"
                      value={nameInput}
                      onChangeText={setNameInput}
                      autoFocus
                    />
                  </View>
                  <Button
                    size="medium"
                    type="primary"
                    display="inline"
                    loading={updateAsset.isPending}
                    onPress={handleRename}
                  >
                    확인
                  </Button>
                </View>
              ) : (
                <Text style={[styles.assetName, { color: theme.text }]}>{asset.name}</Text>
              )}
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

          {/* 삭제 확인 배너 */}
          {confirmDelete && (
            <View style={[styles.confirmBanner, { backgroundColor: '#FEE2E2', borderColor: theme.danger }]}>
              <Text style={[styles.confirmText, { color: theme.danger }]}>
                ⚠️ 이 자산과 모든 스냅샷 기록이 삭제돼요. 계속할까요?
              </Text>
              <View style={styles.confirmBtns}>
                <Button
                  display="full"
                  size="big"
                  type="primary"
                  style="weak"
                  onPress={() => setConfirmDelete(false)}
                >
                  취소
                </Button>
                <Button
                  display="full"
                  size="big"
                  type="danger"
                  loading={deleteAsset.isPending}
                  onPress={handleDelete}
                >
                  삭제하기
                </Button>
              </View>
            </View>
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
          {snapshotsQ.isLoading ? (
            <Loader.Centered size="small" />
          ) : snapshots.length === 0 ? (
            <View style={styles.emptyRow}>
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>스냅샷이 없어요</Text>
            </View>
          ) : (
            snapshots.map((s, idx) => (
              <React.Fragment key={s.date + idx}>
                <ListRow
                  contents={<Text style={[styles.snapDate, { color: theme.textMuted }]}>{s.date}</Text>}
                  right={isFx ? (
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[styles.snapValue, { color: theme.text }]}>${s.value.toLocaleString()}</Text>
                      <Text style={[styles.snapSub, { color: theme.textMuted }]}>≈ {krwShort(s.valueKRW)} · {s.fxRate.toLocaleString()}원</Text>
                    </View>
                  ) : (
                    <Text style={[styles.snapValue, { color: theme.text }]}>{krw(s.valueKRW || s.value)}</Text>
                  )}
                  verticalPadding="small"
                />
                {idx < snapshots.length - 1 && <Border type="full" />}
              </React.Fragment>
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
                <React.Fragment key={tx.id}>
                  <ListRow
                    left={
                      <View style={[styles.txIcon, { backgroundColor: theme.bg }]}>
                        <Text style={{ fontSize: 16 }}>{tx.category.slice(0, 1)}</Text>
                      </View>
                    }
                    contents={
                      <View>
                        <Text style={[styles.txTitle, { color: theme.text }]}>{tx.title}</Text>
                        <Text style={[styles.txMeta, { color: theme.textMuted }]}>{tx.date}</Text>
                      </View>
                    }
                    right={
                      <Text style={[styles.txAmount, { color: amtColor }]}>{sign}{krwShort(tx.amount)}</Text>
                    }
                    verticalPadding="small"
                  />
                  {idx < relatedTxs.length - 1 && <Border type="full" />}
                </React.Fragment>
              );
            })}
          </View>
        )}
      </ScrollView>

      <SnapshotSheet
        visible={snapshotOpen}
        focusAssetId={asset.id}
        onClose={() => setSnapshotOpen(false)}
      />
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
  renameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  renameInput: { flex: 1, borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 16 },
  renameConfirmBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  renameConfirmText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  fxBlock: { marginBottom: 8 },
  fxMain: { fontSize: 28, fontWeight: '800' },
  fxSub: { fontSize: 13, marginTop: 2 },
  valueText: { fontSize: 28, fontWeight: '800', marginBottom: 8 },
  deltaBadge: { flexDirection: 'row', marginBottom: 14 },
  deltaChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  deltaText: { fontSize: 13, fontWeight: '600' },
  snapshotBtn: { borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  snapshotBtnText: { fontSize: 14, fontWeight: '700' },
  confirmBanner: { marginTop: 12, borderRadius: 12, borderWidth: 1, padding: 14 },
  confirmText: { fontSize: 13, lineHeight: 18, marginBottom: 12 },
  confirmBtns: { flexDirection: 'row', gap: 10 },
  confirmCancelBtn: { flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.05)' },
  confirmCancelText: { fontSize: 14, fontWeight: '600' },
  confirmDeleteBtn: { flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  confirmDeleteText: { color: '#fff', fontSize: 14, fontWeight: '700' },
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
  kebabWrap: { position: 'relative' },
  kebabIcon: { fontSize: 22, fontWeight: '700', paddingHorizontal: 4 },
  menuBackdrop: { position: 'absolute', top: -200, left: -300, right: -20, bottom: -600, zIndex: 10 },
  menuDropdown: { position: 'absolute', top: 32, right: 0, width: 150, borderRadius: 12, borderWidth: 1, overflow: 'hidden', zIndex: 20, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 13, borderBottomWidth: 1 },
  menuItemText: { fontSize: 14, fontWeight: '600' },
});

export const Route = createRoute('/assets/detail', {
  component: AssetDetailScreen,
});
