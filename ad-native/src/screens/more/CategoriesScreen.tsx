import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import AppToast from '../../components/common/AppToast';
import TossEmoji from '../../components/common/TossEmoji';
import Segmented from '../../components/common/Segmented';
import { useTheme } from '../../lib/theme';
import { useHouseholdData, type HouseholdData } from '../../queries/useHouseholdData';
import { useAuthStore } from '../../stores/auth.store';
import { getCategoryDef } from '../../lib/category-meta';
import { useDeleteCategory } from '../../queries/mutations';
import type { CategoryType } from '../../types/api';
import type { MoreStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<MoreStackParamList, 'Categories'>;
type CategoryItem = HouseholdData['categories'][number];

const TYPE_LABELS: Record<CategoryType, string> = { INCOME: '수입', EXPENSE: '지출' };

function iconAndColor(c: CategoryItem) {
  const def = getCategoryDef(c.name);
  return { icon: c.icon || def.iconCode, color: c.color || def.color };
}

export default function CategoriesScreen({ navigation }: Props) {
  const theme = useTheme();
  const data = useHouseholdData();
  const role = useAuthStore((s) => s.currentHousehold?.role);
  const canEdit = role !== 'VIEWER';
  const [tab, setTab] = useState<CategoryType>('EXPENSE');
  const [deleteMode, setDeleteMode] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [toast, setToast] = useState('');
  const deleteCategory = useDeleteCategory();

  const topLevel = data.categories.filter((c) => c.type === tab && !c.parentId);
  const childCount = (id: number) => data.categories.filter((c) => c.parentId === id).length;

  function handleCellPress(c: CategoryItem) {
    if (deleteMode) {
      if (c.isBuiltin) return;
      setDeleteTarget({ id: c.id, name: c.name });
      return;
    }
    navigation.navigate('CategoryEdit', { mode: 'edit', categoryId: c.id });
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteCategory.mutateAsync(deleteTarget.id);
      setToast('카테고리를 삭제했어요');
    } catch {
      setToast('삭제에 실패했어요');
    } finally {
      setDeleteTarget(null);
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }}>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>기본 카테고리에 더해, 우리집만의 카테고리와 소분류를 만들 수 있어요.</Text>

        <View style={styles.sectionPad}>
          <Segmented
            options={['수입', '지출']}
            value={TYPE_LABELS[tab]}
            onChange={(v) => {
              setTab(v === '수입' ? 'INCOME' : 'EXPENSE');
              setDeleteMode(false);
            }}
          />
        </View>

        <View style={styles.grid}>
          {topLevel.map((c) => {
            const { icon, color } = iconAndColor(c);
            return (
              <Pressable key={c.id} style={styles.cell} onPress={() => handleCellPress(c)}>
                {deleteMode && !c.isBuiltin && (
                  <View style={[styles.xBadge, { backgroundColor: theme.danger }]}>
                    <Text style={styles.xBadgeText}>×</Text>
                  </View>
                )}
                <View style={[styles.iconBox, { backgroundColor: color + '22' }]}>
                  <TossEmoji code={icon} size={26} />
                </View>
                <Text style={[styles.cellName, { color: theme.text }]} numberOfLines={1}>
                  {c.name}
                </Text>
                <Text style={[styles.cellSub, { color: theme.textMuted }]}>소분류 {childCount(c.id)}개</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {canEdit && (
        <View style={[styles.footer, { backgroundColor: theme.bg, borderTopColor: theme.border }]}>
          <View style={{ flex: 1 }}>
            <Button display="full" size="big" type="primary" style="weak" onPress={() => navigation.navigate('CategoryEdit', { mode: 'add', type: tab })}>
              추가
            </Button>
          </View>
          <View style={{ flex: 1 }}>
            <Button display="full" size="big" type={deleteMode ? 'danger' : 'primary'} onPress={() => setDeleteMode((v) => !v)}>
              {deleteMode ? '완료' : '편집'}
            </Button>
          </View>
        </View>
      )}

      <ConfirmDialog
        visible={!!deleteTarget}
        title="카테고리를 삭제할까요?"
        description={deleteTarget ? `"${deleteTarget.name}" 및 하위 소분류가 함께 삭제돼요.` : undefined}
        confirmText="삭제하기"
        danger
        loading={deleteCategory.isPending}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
      <AppToast open={!!toast} text={toast} onClose={() => setToast('')} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  subtitle: { fontSize: 12.5, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  sectionPad: { paddingHorizontal: 20, paddingTop: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, paddingTop: 20 },
  cell: { width: '25%', alignItems: 'center', paddingVertical: 10, position: 'relative' },
  iconBox: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  cellName: { fontSize: 12, fontWeight: '700', marginTop: 6, maxWidth: 68, textAlign: 'center' },
  cellSub: { fontSize: 9.5, marginTop: 2 },
  xBadge: { position: 'absolute', top: 2, right: 10, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  xBadgeText: { color: '#fff', fontSize: 12, fontWeight: '800', lineHeight: 14 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', gap: 8, padding: 16, borderTopWidth: 1 },
});
