import { useLayoutEffect, useState } from 'react';
import { Dimensions, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Border from '../components/ui/Border';
import Button from '../components/ui/Button';
import ListRow from '../components/ui/ListRow';
import Loader from '../components/ui/Loader';
import TextField from '../components/ui/TextField';
import EmptyState from '../components/common/EmptyState';
import ConfirmDialog from '../components/common/ConfirmDialog';
import ActionSheet from '../components/common/ActionSheet';
import AppToast from '../components/common/AppToast';
import { useTheme } from '../lib/theme';
import { useHouseholdData } from '../queries/useHouseholdData';
import TossEmoji from '../components/common/TossEmoji';
import LineChart from '../components/charts/LineChart';
import SnapshotSheet from '../components/sheets/SnapshotSheet';
import EditSnapshotSheet, { type EditableSnapshot } from '../components/sheets/EditSnapshotSheet';
import { getAssetCategoryMeta } from '../lib/category-meta';
import { krw, krwShort, pct } from '../lib/format';
import { TE } from '../lib/toss-emoji';
import { Icon } from '../components/common/Icon';
import { snapshotsApi } from '../api';
import { qk } from '../queries/keys';
import { useUpdateAsset, useDeleteAsset } from '../queries/mutations';
import { useAuthStore } from '../stores/auth.store';
import type { AssetsStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AssetsStackParamList, 'AssetDetail'>;

const chartWidth = Dimensions.get('window').width - 40;

export default function AssetDetailScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const data = useHouseholdData();
  const isViewer = useAuthStore((s) => s.currentHousehold?.role) === 'VIEWER';
  const [menuOpen, setMenuOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [snapshotOpen, setSnapshotOpen] = useState(false);
  const [editSnap, setEditSnap] = useState<EditableSnapshot | null>(null);
  const [toast, setToast] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const updateAsset = useUpdateAsset();
  const deleteAsset = useDeleteAsset();

  const assetId = route.params.id;
  const asset = data.assets.find((a) => String(a.id) === assetId);

  const snapshotsQ = useQuery({
    queryKey: qk.assetSnapshots(Number(assetId)),
    queryFn: () => snapshotsApi.list(Number(assetId)),
    enabled: !!assetId && !isNaN(Number(assetId)),
    staleTime: 30_000,
  });

  async function onRefresh() {
    setRefreshing(true);
    try {
      await Promise.all([data.refetch(), snapshotsQ.refetch()]);
    } finally {
      setRefreshing(false);
    }
  }

  useLayoutEffect(() => {
    navigation.setOptions({
      title: '자산 상세',
      headerRight: !isViewer
        ? () => (
            <Pressable hitSlop={8} onPress={() => setMenuOpen(true)}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: theme.textMuted }}>⋯</Text>
            </Pressable>
          )
        : undefined,
    });
  }, [navigation, isViewer, theme.textMuted]);

  const rawSnapshots = Array.isArray(snapshotsQ.data) ? snapshotsQ.data : [];
  const parsed = rawSnapshots.map((s: any) => ({
    date: String(s.date),
    value: Number(s.value) || 0,
    valueKRW: Number(s.valueKRW ?? s.value) || 0,
  }));
  const snapshots = [...parsed].sort((a, b) => b.date.localeCompare(a.date));
  const chartAsc = [...parsed].sort((a, b) => a.date.localeCompare(b.date));

  if (!asset) {
    return (
      <View style={[styles.root, { backgroundColor: theme.bg }]}>
        <EmptyState iconCode={TE.search} title="자산을 찾을 수 없어요" desc="삭제되었거나 접근할 수 없는 자산이에요" />
      </View>
    );
  }

  const meta = getAssetCategoryMeta(asset.category);
  const chartData = chartAsc.map((s) => ({ date: s.date, value: s.valueKRW }));
  const relatedTxs = data.transactions.filter((t) => t.from === asset.id || t.to === asset.id).slice(0, 4);

  async function handleRename() {
    if (!asset || !nameInput.trim()) return;
    await updateAsset.mutateAsync({ id: Number(asset.id), dto: { name: nameInput.trim() } });
    setEditingName(false);
    setNameInput('');
  }

  async function handleDelete() {
    if (!asset) return;
    await deleteAsset.mutateAsync(Number(asset.id));
    navigation.goBack();
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.brand} colors={[theme.brand]} />}
      >
        <View style={[styles.summaryCard, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
          <View style={styles.summaryTop}>
            <TossEmoji code={meta.iconCode} size={48} bg={meta.color + '22'} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.catLabel, { color: theme.textMuted }]}>{meta.label}</Text>
              {editingName ? (
                <View style={styles.renameRow}>
                  <View style={{ flex: 1 }}>
                    <TextField variant="line" value={nameInput} onChangeText={setNameInput} autoFocus />
                  </View>
                  <Button size="medium" type="primary" display="inline" loading={updateAsset.isPending} onPress={handleRename}>
                    확인
                  </Button>
                </View>
              ) : (
                <Text style={[styles.assetName, { color: theme.text }]}>{asset.name}</Text>
              )}
            </View>
          </View>
          <Text style={[styles.valueText, { color: asset.isLiability ? theme.danger : theme.text }]}>{krw(asset.value)}</Text>
          {asset.delta != null && (
            <View style={[styles.deltaChip, { backgroundColor: asset.delta >= 0 ? theme.brandSoft : '#FEE2E2' }]}>
              {Icon.arrowUp(asset.delta >= 0 ? theme.brand : theme.danger, 12)}
              <Text style={{ color: asset.delta >= 0 ? theme.brand : theme.danger, fontSize: 12, fontWeight: '700', marginLeft: 4 }}>
                {krwShort(Math.abs(asset.delta))} ({pct(asset.deltaPct ?? 0)})
              </Text>
            </View>
          )}
          {!isViewer && (
            <View style={{ marginTop: 12 }}>
              <Button display="full" size="big" type="primary" style="weak" leftAccessory={<TossEmoji code={TE.camera} size={18} />} onPress={() => setSnapshotOpen(true)}>
                이 자산만 스냅샷 입력
              </Button>
            </View>
          )}
        </View>

        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>평가액 추이</Text>
          {chartData.length > 1 ? (
            <LineChart data={chartData} width={chartWidth} height={150} color={meta.color} dark={theme.dark} interactive />
          ) : (
            <View style={styles.emptyChart}>
              <Text style={{ color: theme.textMuted, fontSize: 13 }}>스냅샷이 2개 이상이면 그래프가 나타나요</Text>
            </View>
          )}
        </View>

        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>스냅샷 히스토리</Text>
          {snapshotsQ.isLoading ? (
            <View style={styles.emptyRow}>
              <Loader />
            </View>
          ) : snapshots.length === 0 ? (
            <View style={styles.emptyRow}>
              <Text style={{ color: theme.textMuted, fontSize: 13 }}>스냅샷이 없어요</Text>
            </View>
          ) : (
            snapshots.map((s, idx) => (
              <View key={s.date + idx}>
                <ListRow
                  contents={<Text style={{ color: theme.textMuted, fontSize: 13 }}>{s.date}</Text>}
                  right={<Text style={{ color: theme.text, fontSize: 14, fontWeight: '700' }}>{krw(s.valueKRW)}</Text>}
                  withArrow={!isViewer}
                  onPress={!isViewer ? () => setEditSnap({ date: s.date, value: s.value }) : undefined}
                  verticalPadding="small"
                />
                {idx < snapshots.length - 1 && <Border type="full" />}
              </View>
            ))
          )}
        </View>

        {relatedTxs.length > 0 && (
          <View style={[styles.section, { backgroundColor: theme.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>관련 거래</Text>
            {relatedTxs.map((tx, idx) => {
              const amtColor = tx.type === 'INCOME' ? theme.brand : tx.type === 'EXPENSE' ? theme.danger : theme.textMuted;
              const sign = tx.type === 'INCOME' ? '+' : tx.type === 'EXPENSE' ? '-' : '';
              return (
                <View key={tx.id}>
                  <ListRow
                    left={
                      <View style={[styles.txIcon, { backgroundColor: theme.bg }]}>
                        <Text style={{ fontSize: 16 }}>{tx.category.slice(0, 1)}</Text>
                      </View>
                    }
                    contents={
                      <View>
                        <Text style={{ color: theme.text, fontSize: 14, fontWeight: '600' }}>{tx.title}</Text>
                        <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 2 }}>{tx.date}</Text>
                      </View>
                    }
                    right={
                      <Text style={{ color: amtColor, fontSize: 14, fontWeight: '700' }}>
                        {sign}
                        {krwShort(tx.amount)}
                      </Text>
                    }
                    verticalPadding="small"
                  />
                  {idx < relatedTxs.length - 1 && <Border type="full" />}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <SnapshotSheet visible={snapshotOpen} focusAssetId={asset.id} onClose={() => setSnapshotOpen(false)} onSaved={() => setToast('스냅샷을 저장했어요')} />
      <EditSnapshotSheet visible={!!editSnap} assetId={Number(asset.id)} snapshot={editSnap} onClose={() => setEditSnap(null)} onDone={setToast} />

      <ActionSheet
        visible={menuOpen}
        items={[
          { iconCode: TE.pencil, label: '자산명 수정', value: 'rename' },
          { iconCode: TE.trash, label: '자산 삭제', value: 'delete', danger: true },
        ]}
        onSelect={(v) => {
          setMenuOpen(false);
          if (v === 'rename') {
            setNameInput(asset.name);
            setEditingName(true);
          } else if (v === 'delete') {
            setConfirmDelete(true);
          }
        }}
        onClose={() => setMenuOpen(false)}
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
      <AppToast open={!!toast} text={toast} onClose={() => setToast('')} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  summaryCard: { padding: 20, borderBottomWidth: 1, gap: 4 },
  summaryTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  catLabel: { fontSize: 12, fontWeight: '600', marginBottom: 2 },
  assetName: { fontSize: 18, fontWeight: '800' },
  renameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  valueText: { fontSize: 26, fontWeight: '800' },
  deltaChip: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginTop: 6 },
  section: { padding: 20, marginTop: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
  emptyChart: { alignItems: 'center', paddingVertical: 40 },
  emptyRow: { alignItems: 'center', paddingVertical: 20 },
  txIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
