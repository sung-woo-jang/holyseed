import React, { useState } from 'react';
import { createRoute } from '@granite-js/react-native';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Border, Button, ListHeader, ListRow, TextField } from '@toss/tds-react-native';
import SheetModal from '../../components/sheets/SheetModal';
import ScreenHeader from '../../components/common/ScreenHeader';
import TossEmoji from '../../components/common/TossEmoji';
import Segmented from '../../components/common/Segmented';
import { useTheme } from '../../lib/theme';
import { useDataSource, useMockRole } from '../../lib/data-source';
import { getCategoryDef } from '../../lib/category-meta';
import { CATEGORY_ICON_CHOICES } from '../../lib/toss-emoji';
import { useCreateCategory, useDeleteCategory } from '../../queries/mutations';
import type { CategoryType } from '../../types/api';

const TYPE_LABELS: Record<CategoryType, string> = {
  INCOME: '수입',
  EXPENSE: '지출',
  TRANSFER: '이체',
};

const COLORS = ['#3182F6', '#0AB39C', '#F59E0B', '#EF4444', '#A78BFA', '#EC4899', '#06B6D4', '#8B5CF6'];

function AddCategorySheet({
  visible, onClose, onAdd,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (dto: { type: CategoryType; name: string; icon: string }) => Promise<void>;
}) {
  const theme = useTheme();
  const [name, setName] = useState('');
  const [type, setType] = useState<CategoryType>('EXPENSE');
  const [iconCode, setIconCode] = useState(CATEGORY_ICON_CHOICES[0]?.code ?? '1F381');
  const [color, setColor] = useState(COLORS[0] ?? '#3182F6');
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onAdd({ type, name: name.trim(), icon: iconCode });
      setName(''); setType('EXPENSE');
      setIconCode(CATEGORY_ICON_CHOICES[0]?.code ?? '1F381');
      setColor(COLORS[0] ?? '#3182F6');
      onClose();
    } finally { setSaving(false); }
  }

  return (
    <SheetModal
      visible={visible}
      onClose={onClose}
      header="카테고리 추가"
      cta={
        <View style={styles.sheetCta}>
          <Button display="full" size="big" type="primary" disabled={!name.trim()} loading={saving} onPress={handleAdd}>
            추가하기
          </Button>
        </View>
      }
    >
      <View style={styles.sheetBody}>
        <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>이름</Text>
        <TextField variant="line" placeholder="카테고리 이름" value={name} onChangeText={setName} />

        <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>유형</Text>
        <Segmented
          options={['수입', '지출', '이체']}
          value={TYPE_LABELS[type]}
          onChange={(v) => {
            const t = Object.entries(TYPE_LABELS).find(([, label]) => label === v)?.[0] as CategoryType;
            if (t) setType(t);
          }}
        />

        <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>아이콘</Text>
        <View style={styles.iconGrid}>
          {CATEGORY_ICON_CHOICES.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[styles.iconCell, { backgroundColor: iconCode === c.code ? theme.brandSoft : theme.bg, borderColor: iconCode === c.code ? theme.brand : theme.border }]}
              onPress={() => setIconCode(c.code)}
            >
              <TossEmoji code={c.code} size={32} />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>색상</Text>
        <View style={styles.colorRow}>
          {COLORS.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.colorCircle, { backgroundColor: c, borderWidth: color === c ? 3 : 0, borderColor: theme.text }]}
              onPress={() => setColor(c)}
            />
          ))}
        </View>
      </View>
    </SheetModal>
  );
}

function CategoriesPage({ navigation }: { navigation: any }) {
  const theme = useTheme();
  const role = useMockRole();
  const data = useDataSource();
  const canEdit = role !== 'VIEWER';
  const [addVisible, setAddVisible] = useState(false);
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();

  const typeOrder: CategoryType[] = ['INCOME', 'EXPENSE', 'TRANSFER'];

  async function handleAdd(dto: { type: CategoryType; name: string; icon: string }) {
    await createCategory.mutateAsync(dto);
  }

  async function handleDelete(id: number, name: string) {
    Alert.alert('카테고리 삭제', `"${name}"을(를) 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: async () => {
        try { await deleteCategory.mutateAsync(id); }
        catch (e: any) { Alert.alert('오류', e?.message ?? '삭제에 실패했어요.'); }
      }},
    ]);
  }

  const hasApiCategories = data.categories.length > 0;
  const builtinByType: Record<CategoryType, string[]> = {
    INCOME: ['급여', '투자수익', '사업소득', '기타수입'],
    EXPENSE: ['주거', '식비', '교통', '의료', '쇼핑', '여가', '교육', '보험료', '구독', '기타'],
    TRANSFER: ['이체'],
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <ScreenHeader title="카테고리 관리" onBack={() => navigation?.goBack?.()} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          기본 카테고리에 더해, 우리집만의 카테고리를 만들 수 있어요.
        </Text>

        {typeOrder.map((t) => {
          const items = hasApiCategories
            ? data.categories.filter((c) => c.type === t).map((c) => {
                const def = getCategoryDef(c.name);
                return { id: c.id, name: c.name, isBuiltin: c.isBuiltin, iconCode: def.iconCode, color: def.color };
              })
            : builtinByType[t].map((name) => ({
                id: 0, name, isBuiltin: true,
                iconCode: getCategoryDef(name).iconCode, color: getCategoryDef(name).color,
              }));

          return (
            <React.Fragment key={t}>
              <ListHeader
                title={<ListHeader.TitleParagraph typography="t5">{TYPE_LABELS[t]} ({items.length})</ListHeader.TitleParagraph>}
              />
              {items.map((item, idx) => (
                <React.Fragment key={item.id || item.name}>
                  <ListRow
                    left={
                      <View style={[styles.catIconBox, { backgroundColor: item.color + '22' }]}>
                        <TossEmoji code={item.iconCode} size={28} />
                      </View>
                    }
                    contents={
                      <View>
                        <Text style={[styles.catName, { color: theme.text }]}>{item.name}</Text>
                        <Text style={[styles.catSub, { color: theme.textMuted }]}>{item.isBuiltin ? '기본' : '커스텀'}</Text>
                      </View>
                    }
                    right={
                      <View style={styles.catRight}>
                        <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                        {!item.isBuiltin && canEdit && item.id > 0 && (
                          <TouchableOpacity
                            onPress={() => handleDelete(item.id, item.name)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            disabled={deleteCategory.isPending}
                          >
                            <Text style={[styles.deleteText, { color: deleteCategory.isPending ? theme.textMuted : theme.danger }]}>삭제</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    }
                    verticalPadding="small"
                  />
                  {idx < items.length - 1 && <Border type="full" />}
                </React.Fragment>
              ))}
              <Border type="height16" />
            </React.Fragment>
          );
        })}

        {canEdit && (
          <View style={styles.addCatBtnWrap}>
            <Button display="full" size="big" type="primary" style="weak" onPress={() => setAddVisible(true)}>
              + 카테고리 추가
            </Button>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      <AddCategorySheet visible={addVisible} onClose={() => setAddVisible(false)} onAdd={handleAdd} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  subtitle: { fontSize: 13, lineHeight: 18, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  catIconBox: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  catName: { fontSize: 14, fontWeight: '600' },
  catSub: { fontSize: 11, marginTop: 2 },
  catRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  colorDot: { width: 12, height: 12, borderRadius: 6 },
  deleteText: { fontSize: 13, fontWeight: '500' },
  addCatBtnWrap: { marginHorizontal: 20, marginTop: 4 },
  sheetBody: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 12 },
  sheetCta: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 },
  fieldLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  iconCell: { width: 56, height: 56, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  colorRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  colorCircle: { width: 32, height: 32, borderRadius: 16 },
});

export const Route = createRoute('/more/categories', {
  component: CategoriesPage,
});
