import React, { useState } from 'react';
import { createRoute } from '@granite-js/react-native';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import ScreenHeader from '../../components/common/ScreenHeader';
import TossEmoji from '../../components/common/TossEmoji';
import Segmented from '../../components/common/Segmented';
import { useTheme } from '../../lib/theme';
import { useMockRole } from '../../lib/data-source';
import { getCategoryDef } from '../../lib/category-meta';
import { CATEGORY_ICON_CHOICES } from '../../lib/toss-emoji';
import { Icon } from '../../components/common/Icon';
import type { CategoryType } from '../../types/api';

const TYPE_LABELS: Record<CategoryType, string> = {
  INCOME: '수입',
  EXPENSE: '지출',
  TRANSFER: '이체',
};

const COLORS = ['#3182F6', '#0AB39C', '#F59E0B', '#EF4444', '#A78BFA', '#EC4899', '#06B6D4', '#8B5CF6'];

interface CustomCategory {
  id: string;
  type: CategoryType;
  name: string;
  iconCode: string;
  color: string;
}

function AddCategorySheet({
  visible,
  onClose,
  onAdd,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (cat: CustomCategory) => void;
}) {
  const theme = useTheme();
  const [name, setName] = useState('');
  const [type, setType] = useState<CategoryType>('EXPENSE');
  const [iconCode, setIconCode] = useState(CATEGORY_ICON_CHOICES[0]?.code ?? '1F381');
  const [color, setColor] = useState(COLORS[0] ?? '#3182F6');

  function handleAdd() {
    if (!name.trim()) return;
    onAdd({ id: Date.now().toString(), type, name: name.trim(), iconCode, color });
    setName('');
    setType('EXPENSE');
    setIconCode(CATEGORY_ICON_CHOICES[0]?.code ?? '1F381');
    setColor(COLORS[0] ?? '#3182F6');
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: theme.card }]} onPress={() => {}}>
          <View style={[styles.sheetHandle, { backgroundColor: theme.border }]} />
          <View style={[styles.sheetHeader, { borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              {Icon.close(theme.textMuted, 20)}
            </TouchableOpacity>
            <Text style={[styles.sheetTitle, { color: theme.text }]}>카테고리 추가</Text>
            <View style={{ width: 20 }} />
          </View>
          <ScrollView contentContainerStyle={styles.sheetBody}>
            {/* 이름 */}
            <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>이름</Text>
            <TextInput
              style={[styles.nameInput, { borderColor: theme.border, color: theme.text, backgroundColor: theme.bg }]}
              placeholder="카테고리 이름"
              placeholderTextColor={theme.textMuted}
              value={name}
              onChangeText={setName}
            />

            {/* 타입 */}
            <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>유형</Text>
            <Segmented
              options={['수입', '지출', '이체']}
              value={TYPE_LABELS[type]}
              onChange={(v) => {
                const t = Object.entries(TYPE_LABELS).find(([, label]) => label === v)?.[0] as CategoryType;
                if (t) setType(t);
              }}
            />

            {/* 아이콘 그리드 4x3 */}
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

            {/* 컬러 피커 8개 */}
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

            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: name.trim() ? theme.brand : theme.border }]}
              onPress={handleAdd}
              disabled={!name.trim()}
            >
              <Text style={[styles.addBtnText, { color: name.trim() ? '#fff' : theme.textMuted }]}>추가하기</Text>
            </TouchableOpacity>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function CategoriesPage({ navigation }: { navigation: any }) {
  const theme = useTheme();
  const role = useMockRole();
  const canEdit = role !== 'VIEWER';
  const [addVisible, setAddVisible] = useState(false);
  const [customs, setCustoms] = useState<CustomCategory[]>([]);

  const builtinByType: Record<CategoryType, string[]> = {
    INCOME: ['급여', '투자수익', '사업소득', '기타수입'],
    EXPENSE: ['주거', '식비', '교통', '의료', '쇼핑', '여가', '교육', '보험료', '구독', '기타'],
    TRANSFER: ['이체'],
  };

  const typeOrder: CategoryType[] = ['INCOME', 'EXPENSE', 'TRANSFER'];

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <ScreenHeader title="카테고리 관리" onBack={() => navigation?.goBack?.()} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 }}>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            기본 카테고리에 더해, 우리집만의 카테고리를 만들 수 있어요.
          </Text>
        </View>

        {typeOrder.map((t) => {
          const builtins = builtinByType[t];
          const customItems = customs.filter((c) => c.type === t);
          const allItems = [...builtins.map((name) => ({ name, isBuiltin: true, iconCode: getCategoryDef(name).iconCode, color: getCategoryDef(name).color })), ...customItems.map((c) => ({ name: c.name, isBuiltin: false, iconCode: c.iconCode, color: c.color, id: c.id }))];

          return (
            <View key={t} style={[styles.typeCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={[styles.typeCardHeader, { borderBottomColor: theme.border }]}>
                <Text style={[styles.typeCardTitle, { color: theme.text }]}>
                  {TYPE_LABELS[t]} ({allItems.length})
                </Text>
              </View>
              {allItems.map((item, idx) => (
                <View
                  key={item.name}
                  style={[styles.catRow, { borderBottomColor: theme.border, borderBottomWidth: idx < allItems.length - 1 ? 1 : 0 }]}
                >
                  <View style={[styles.catIconBox, { backgroundColor: item.color + '22' }]}>
                    <TossEmoji code={item.iconCode} size={28} />
                  </View>
                  <View style={styles.catInfo}>
                    <Text style={[styles.catName, { color: theme.text }]}>{item.name}</Text>
                    <Text style={[styles.catSub, { color: theme.textMuted }]}>
                      {item.isBuiltin ? '기본' : '커스텀'}
                    </Text>
                  </View>
                  <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                  {!item.isBuiltin && canEdit && (
                    <TouchableOpacity
                      onPress={() => setCustoms((prev) => prev.filter((c) => c.id !== (item as any).id))}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={{ marginLeft: 8 }}
                    >
                      <Text style={[styles.deleteText, { color: theme.danger }]}>삭제</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          );
        })}

        {canEdit && (
          <TouchableOpacity
            style={[styles.addCatBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => setAddVisible(true)}
          >
            <Text style={[styles.addCatBtnText, { color: theme.brand }]}>+ 카테고리 추가</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      <AddCategorySheet
        visible={addVisible}
        onClose={() => setAddVisible(false)}
        onAdd={(cat) => setCustoms((prev) => [...prev, cat])}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  subtitle: { fontSize: 13, lineHeight: 18, marginBottom: 14 },
  typeCard: { marginHorizontal: 20, marginBottom: 10, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  typeCardHeader: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  typeCardTitle: { fontSize: 14, fontWeight: '700' },
  catRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  catIconBox: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  catInfo: { flex: 1 },
  catName: { fontSize: 14, fontWeight: '600' },
  catSub: { fontSize: 11, marginTop: 2 },
  colorDot: { width: 12, height: 12, borderRadius: 6 },
  deleteText: { fontSize: 13, fontWeight: '500' },
  addCatBtn: { marginHorizontal: 20, borderRadius: 14, borderWidth: 1, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  addCatBtnText: { fontSize: 15, fontWeight: '700' },
  // AddCategorySheet styles
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { maxHeight: '85%', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  sheetTitle: { fontSize: 16, fontWeight: '700' },
  sheetBody: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },
  fieldLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  nameInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  iconCell: { width: 56, height: 56, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  colorRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  colorCircle: { width: 32, height: 32, borderRadius: 16 },
  addBtn: { marginTop: 24, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  addBtnText: { fontSize: 16, fontWeight: '700' },
});

export const Route = createRoute('/more/categories', {
  component: CategoriesPage,
});
