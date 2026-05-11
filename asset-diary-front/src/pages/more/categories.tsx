import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createRoute } from '@granite-js/react-native';
import React, { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { categoriesApi } from '../../api';
import ScreenHeader, { HeaderButton } from '../../components/common/ScreenHeader';
import EmptyState from '../../components/common/EmptyState';
import BottomSheet from '../../components/sheets/BottomSheet';
import { useCanEdit, useHousehold } from '../../hooks';
import { qk } from '../../queries/keys';
import type { CategoryType } from '../../types/api';

export const Route = createRoute('/more/categories', {
  component: CategoriesPage,
});

const TYPE_LABELS: Record<CategoryType, string> = {
  INCOME: '수입',
  EXPENSE: '지출',
  TRANSFER: '이체',
};

function CategoriesPage() {
  const navigation = Route.useNavigation();
  const { household } = useHousehold();
  const canEdit = useCanEdit();
  const qc = useQueryClient();
  const [addVisible, setAddVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('');
  const [newType, setNewType] = useState<CategoryType>('EXPENSE');

  const { data: categories = [], isLoading } = useQuery({
    queryKey: qk.categories(household?.id ?? 0),
    queryFn: () => categoriesApi.list(household!.id),
    enabled: !!household,
  });

  const { mutate: createCategory, isPending } = useMutation({
    mutationFn: () =>
      categoriesApi.create(household!.id, { type: newType, name: newName, icon: newIcon || '📁' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.categories(household!.id) });
      setNewName('');
      setNewIcon('');
      setAddVisible(false);
    },
  });

  const { mutate: deleteCategory } = useMutation({
    mutationFn: (id: number) => categoriesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.categories(household!.id) }),
  });

  const custom = categories.filter((c) => !c.isBuiltin);
  const builtin = categories.filter((c) => c.isBuiltin);

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="카테고리 관리"
        onBack={() => navigation.goBack()}
        right={
          canEdit ? (
            <HeaderButton label="+ 추가" onPress={() => setAddVisible(true)} />
          ) : undefined
        }
      />

      {isLoading ? null : categories.length === 0 ? (
        <EmptyState icon="🗂️" title="카테고리가 없어요" desc="카테고리를 추가해보세요." />
      ) : (
        <FlatList
          data={[...custom, ...builtin]}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.categoryRow}>
              <Text style={styles.categoryIcon}>{item.icon}</Text>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>{item.name}</Text>
                <Text style={styles.categoryType}>{TYPE_LABELS[item.type]}</Text>
              </View>
              {item.isBuiltin ? (
                <Text style={styles.builtinBadge}>기본</Text>
              ) : (
                canEdit && (
                  <TouchableOpacity onPress={() => deleteCategory(item.id)}>
                    <Text style={styles.deleteText}>삭제</Text>
                  </TouchableOpacity>
                )
              )}
            </View>
          )}
        />
      )}

      <BottomSheet visible={addVisible} onClose={() => setAddVisible(false)} title="카테고리 추가">
        <View style={styles.form}>
          <Text style={styles.label}>유형</Text>
          <View style={styles.typeRow}>
            {(['INCOME', 'EXPENSE', 'TRANSFER'] as CategoryType[]).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.typeBtn, newType === t && styles.typeBtnActive]}
                onPress={() => setNewType(t)}
              >
                <Text style={[styles.typeText, newType === t && styles.typeTextActive]}>
                  {TYPE_LABELS[t]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>이름</Text>
          <TextInput
            style={styles.input}
            value={newName}
            onChangeText={setNewName}
            placeholder="카테고리 이름"
          />

          <Text style={styles.label}>아이콘 (이모지)</Text>
          <TextInput
            style={styles.input}
            value={newIcon}
            onChangeText={setNewIcon}
            placeholder="📁"
          />

          <TouchableOpacity
            style={[styles.submitBtn, (!newName || isPending) && styles.submitBtnDisabled]}
            onPress={() => createCategory()}
            disabled={!newName || isPending}
          >
            <Text style={styles.submitText}>추가</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  list: { paddingHorizontal: 20, gap: 2 },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F6',
    gap: 12,
  },
  categoryIcon: { fontSize: 22 },
  categoryInfo: { flex: 1 },
  categoryName: { fontSize: 15, fontWeight: '500', color: '#191F28', marginBottom: 2 },
  categoryType: { fontSize: 12, color: '#8B95A1' },
  builtinBadge: { fontSize: 11, color: '#8B95A1', backgroundColor: '#F2F4F6', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  deleteText: { fontSize: 12, color: '#FF3B30' },
  form: { paddingHorizontal: 20 },
  label: { fontSize: 13, color: '#8B95A1', marginBottom: 6, marginTop: 12 },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#E5E8EB', alignItems: 'center' },
  typeBtnActive: { borderColor: '#3182F6', backgroundColor: '#EBF3FF' },
  typeText: { fontSize: 13, color: '#8B95A1', fontWeight: '600' },
  typeTextActive: { color: '#3182F6' },
  input: {
    borderWidth: 1,
    borderColor: '#E5E8EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  submitBtn: {
    backgroundColor: '#3182F6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  submitBtnDisabled: { backgroundColor: '#C9CEDD' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
