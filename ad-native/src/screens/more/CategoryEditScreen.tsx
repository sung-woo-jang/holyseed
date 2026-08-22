import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Button from '../../components/ui/Button';
import Border from '../../components/ui/Border';
import TextField from '../../components/ui/TextField';
import AppToast from '../../components/common/AppToast';
import SheetModal from '../../components/sheets/SheetModal';
import CategoryIcon from '../../components/common/CategoryIcon';
import Segmented from '../../components/common/Segmented';
import { useTheme } from '../../lib/theme';
import { useHouseholdData } from '../../queries/useHouseholdData';
import { getCategoryDef } from '../../lib/category-meta';
import { CATEGORY_ICON_CHOICES } from '../../lib/toss-emoji';
import { useCreateCategory, useUpdateCategory, useDeleteCategory, useUploadCategoryIcon } from '../../queries/mutations';
import type { MoreStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<MoreStackParamList, 'CategoryEdit'>;

const COLORS = ['#3182F6', '#0AB39C', '#F59E0B', '#EF4444', '#A78BFA', '#EC4899', '#06B6D4', '#8B5CF6'];

interface SubDraft {
  id: number;
  name: string;
  icon: string | null;
  isNew: boolean;
}

/** 아이콘 선택 시트가 지금 무엇을 대상으로 하는지 — 대분류 자체 or 소분류 추가/수정 모달 안 */
type IconPickerTarget = 'main' | 'submodal';

export default function CategoryEditScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const data = useHouseholdData();
  const { mode } = route.params;
  const categoryId = mode === 'edit' ? route.params.categoryId : undefined;
  const existing = categoryId ? data.categories.find((c) => c.id === categoryId) : undefined;
  const type = mode === 'add' ? route.params.type : (existing?.type ?? 'EXPENSE');
  const isBuiltin = existing?.isBuiltin ?? false;

  const defFallback = existing ? getCategoryDef(existing.name) : null;
  const [name, setName] = useState(existing?.name ?? '');
  const [icon, setIcon] = useState(existing?.icon || defFallback?.iconCode || CATEGORY_ICON_CHOICES[0]!.code);
  const [color, setColor] = useState(existing?.color || defFallback?.color || COLORS[0]!);
  const [subs, setSubs] = useState<SubDraft[]>(() =>
    categoryId ? data.categories.filter((c) => c.parentId === categoryId).map((c) => ({ id: c.id, name: c.name, icon: c.icon || null, isNew: false })) : [],
  );
  const originalSubs = useMemo(() => subs.map((s) => ({ id: s.id, name: s.name, icon: s.icon })), []); // eslint-disable-line react-hooks/exhaustive-deps

  const [iconPickerFor, setIconPickerFor] = useState<IconPickerTarget | null>(null);
  const [iconTab, setIconTab] = useState<'emoji' | 'upload'>('emoji');
  const [subModal, setSubModal] = useState<{ index: number; value: string; icon: string | null } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState('');

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const uploadIcon = useUploadCategoryIcon();

  useEffect(() => {
    navigation.setOptions({ title: mode === 'add' ? '카테고리 추가' : '카테고리 편집' });
  }, [navigation, mode]);

  function openIconPicker(target: IconPickerTarget) {
    setIconTab('emoji');
    setIconPickerFor(target);
  }
  function applyIcon(value: string) {
    if (iconPickerFor === 'submodal') {
      setSubModal((prev) => (prev ? { ...prev, icon: value } : prev));
    } else {
      setIcon(value);
    }
    setIconPickerFor(null);
  }

  async function handlePickPhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setToast('사진 접근 권한이 필요해요');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    try {
      const { url } = await uploadIcon.mutateAsync({ uri: asset.uri, name: asset.fileName || 'icon.jpg', type: asset.mimeType || 'image/jpeg' });
      applyIcon(url);
    } catch {
      setToast('업로드에 실패했어요');
    }
  }

  function addSub() {
    setSubModal({ index: -1, value: '', icon: null });
  }
  function editSub(index: number) {
    setSubModal({ index, value: subs[index]!.name, icon: subs[index]!.icon });
  }
  function removeSub(index: number) {
    setSubs((prev) => prev.filter((_, i) => i !== index));
  }
  function confirmSubModal() {
    if (!subModal) return;
    const value = subModal.value.trim();
    if (!value) return;
    if (subModal.index === -1) {
      setSubs((prev) => [...prev, { id: -Date.now() - Math.random(), name: value, icon: subModal.icon, isNew: true }]);
    } else {
      setSubs((prev) => prev.map((s, i) => (i === subModal.index ? { ...s, name: value, icon: subModal.icon } : s)));
    }
    setSubModal(null);
  }

  async function handleSave() {
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      let parentId = categoryId;
      if (mode === 'add') {
        const created = await createCategory.mutateAsync({ type, name: name.trim(), icon, color });
        parentId = created.id;
      } else if (!isBuiltin) {
        await updateCategory.mutateAsync({ id: categoryId!, dto: { name: name.trim(), icon, color } });
      }

      for (const s of subs) {
        if (s.isNew) {
          await createCategory.mutateAsync({ type, name: s.name.trim(), icon: s.icon ?? undefined, color, parentId: parentId! });
        } else {
          const orig = originalSubs.find((o) => o.id === s.id);
          if (orig && (orig.name !== s.name.trim() || orig.icon !== s.icon)) {
            await updateCategory.mutateAsync({ id: s.id, dto: { name: s.name.trim(), icon: s.icon ?? undefined } });
          }
        }
      }
      for (const orig of originalSubs) {
        if (!subs.find((s) => s.id === orig.id)) {
          await deleteCategory.mutateAsync(orig.id);
        }
      }

      navigation.goBack();
    } catch {
      setToast('저장에 실패했어요');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteCategory() {
    if (!categoryId || deleting) return;
    setDeleting(true);
    try {
      await deleteCategory.mutateAsync(categoryId);
      navigation.goBack();
    } catch {
      setToast('삭제에 실패했어요');
      setDeleting(false);
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={styles.iconWrap}>
          <Pressable disabled={isBuiltin} onPress={() => openIconPicker('main')} style={[styles.iconBig, { backgroundColor: color + '22' }]}>
            <CategoryIcon icon={icon} size={44} />
          </Pressable>
          {!isBuiltin && (
            <Pressable onPress={() => openIconPicker('main')} style={[styles.changeBtn, { backgroundColor: theme.bg }]}>
              <Text style={{ color: theme.textMuted, fontSize: 11.5, fontWeight: '700' }}>아이콘 변경</Text>
            </Pressable>
          )}
        </View>

        <View style={[styles.fieldRow, { borderBottomColor: theme.border }]}>
          <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>카테고리명</Text>
          {isBuiltin ? (
            <Text style={{ color: theme.text, fontSize: 15, fontWeight: '700', flex: 1 }}>{name}</Text>
          ) : (
            <TextField variant="line" placeholder="입력하기" value={name} onChangeText={setName} style={{ flex: 1 }} />
          )}
        </View>

        {!isBuiltin && (
          <View style={styles.sectionPad}>
            <Text style={[styles.fieldLabel, { color: theme.textMuted, marginBottom: 8 }]}>색상</Text>
            <View style={styles.colorRow}>
              {COLORS.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setColor(c)}
                  style={[styles.colorDot, { backgroundColor: c }, color === c && { borderWidth: 3, borderColor: theme.text }]}
                />
              ))}
            </View>
          </View>
        )}

        <View style={styles.sectionPad}>
          <Text style={[styles.fieldLabel, { color: theme.textMuted, marginBottom: 10 }]}>세부 카테고리</Text>
          {subs.map((s, i) => (
            <Pressable key={s.id} onPress={() => editSub(i)} style={[styles.subRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={[styles.subIcon, { backgroundColor: color + '22' }]}>
                <CategoryIcon icon={s.icon ?? icon} size={22} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontSize: 13, fontWeight: '600' }}>{s.name}</Text>
                {!s.icon && <Text style={{ color: theme.textMuted, fontSize: 10 }}>대분류 아이콘 사용 중</Text>}
              </View>
              <Pressable hitSlop={8} onPress={() => removeSub(i)}>
                <Text style={{ color: theme.textMuted, fontSize: 16 }}>×</Text>
              </Pressable>
            </Pressable>
          ))}
          <Pressable onPress={addSub} style={[styles.addSubBtn, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={{ color: theme.textMuted, fontSize: 12.5, fontWeight: '700' }}>＋ 추가하기</Text>
          </Pressable>
        </View>

        {!isBuiltin && (
          <View style={styles.sectionPad}>
            <Border type="full" height={1} />
            <Pressable onPress={handleDeleteCategory} disabled={deleting} style={{ paddingVertical: 16, alignItems: 'center' }}>
              <Text style={{ color: theme.danger, fontSize: 13, fontWeight: '700' }}>{deleting ? '삭제 중...' : '카테고리 삭제'}</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      <View style={[styles.ctaWrap, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
        <Button display="full" size="big" type="primary" disabled={!name.trim()} loading={saving} onPress={handleSave}>
          저장하기
        </Button>
      </View>

      <SheetModal visible={!!iconPickerFor} onClose={() => setIconPickerFor(null)} header="카테고리 아이콘 선택">
        <View style={{ marginBottom: 14 }}>
          <Segmented options={['이모지', '업로드']} value={iconTab === 'emoji' ? '이모지' : '업로드'} onChange={(v) => setIconTab(v === '이모지' ? 'emoji' : 'upload')} />
        </View>
        {iconTab === 'emoji' ? (
          <View style={styles.iconGrid}>
            {CATEGORY_ICON_CHOICES.map((c) => (
              <Pressable
                key={c.id}
                style={[styles.iconCell, { backgroundColor: icon === c.code ? theme.brandSoft : theme.bg, borderColor: icon === c.code ? theme.brand : theme.border }]}
                onPress={() => applyIcon(c.code)}
              >
                <CategoryIcon icon={c.code} size={30} />
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={styles.uploadTab}>
            <Text style={{ color: theme.textMuted, fontSize: 12.5, textAlign: 'center', marginBottom: 14 }}>
              사진이나 로고를 올려보세요{'\n'}정사각형으로 잘라서 아이콘에 딱 맞게 넣어드려요
            </Text>
            <Pressable
              onPress={handlePickPhoto}
              disabled={uploadIcon.isPending}
              style={[styles.uploadBtn, { backgroundColor: theme.brandSoft, borderColor: theme.brand }]}
            >
              {uploadIcon.isPending ? <ActivityIndicator color={theme.brand} /> : <Text style={{ color: theme.brand, fontSize: 13.5, fontWeight: '700' }}>사진 선택</Text>}
            </Pressable>
          </View>
        )}
      </SheetModal>

      <Modal visible={!!subModal} transparent animationType="fade" onRequestClose={() => setSubModal(null)}>
        <Pressable style={styles.scrim} onPress={() => setSubModal(null)}>
          <Pressable style={[styles.subModal, { backgroundColor: theme.card }]} onPress={(e) => e.stopPropagation()}>
            <Text style={{ color: theme.text, fontSize: 15, fontWeight: '800', marginBottom: 14 }}>세부 카테고리 {subModal && subModal.index === -1 ? '추가' : '수정'}</Text>
            <View style={styles.subModalIconRow}>
              <Pressable onPress={() => openIconPicker('submodal')} style={[styles.subModalIconPreview, { backgroundColor: color + '22' }]}>
                <CategoryIcon icon={subModal?.icon ?? icon} size={26} />
              </Pressable>
              <Pressable onPress={() => openIconPicker('submodal')}>
                <Text style={{ color: theme.brand, fontSize: 12.5, fontWeight: '700' }}>{subModal?.icon ? '아이콘 변경' : '아이콘 지정 (안 하면 대분류 아이콘 사용)'}</Text>
              </Pressable>
            </View>
            <TextField
              variant="box"
              placeholder="입력하세요"
              maxLength={10}
              autoFocus
              value={subModal?.value ?? ''}
              onChangeText={(v) => setSubModal((prev) => (prev ? { ...prev, value: v } : prev))}
              onSubmitEditing={confirmSubModal}
            />
            <Text style={{ color: theme.textMuted, fontSize: 11, textAlign: 'right', marginTop: 4 }}>{(subModal?.value ?? '').length}/10</Text>
            <View style={{ marginTop: 14 }}>
              <Button display="full" size="medium" type="primary" onPress={confirmSubModal}>
                {subModal && subModal.index === -1 ? '추가' : '수정'}
              </Button>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <AppToast open={!!toast} text={toast} onClose={() => setToast('')} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  iconWrap: { alignItems: 'center', gap: 10, paddingTop: 24, paddingBottom: 8 },
  iconBig: { width: 96, height: 96, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  changeBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, gap: 12 },
  fieldLabel: { fontSize: 13, fontWeight: '700' },
  sectionPad: { paddingHorizontal: 20, paddingTop: 18 },
  colorRow: { flexDirection: 'row', gap: 10 },
  colorDot: { width: 30, height: 30, borderRadius: 15 },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 8 },
  subIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  addSubBtn: { alignSelf: 'flex-start', borderRadius: 999, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  ctaWrap: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20, borderTopWidth: 1 },
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.42)', justifyContent: 'center', alignItems: 'center' },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  iconCell: { width: 52, height: 52, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  uploadTab: { alignItems: 'center', paddingVertical: 12 },
  uploadBtn: { borderWidth: 1.4, borderRadius: 999, paddingHorizontal: 24, paddingVertical: 11, minWidth: 120, alignItems: 'center' },
  subModal: { width: '84%', borderRadius: 18, padding: 18 },
  subModalIconRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  subModalIconPreview: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
