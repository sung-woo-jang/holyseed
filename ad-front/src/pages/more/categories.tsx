import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Border from '../../components/ui/Border';
import Button from '../../components/ui/Button';
import ListHeader from '../../components/ui/ListHeader';
import ListRow from '../../components/ui/ListRow';
import TextField from '../../components/ui/TextField';
import SheetModal from '../../components/sheets/SheetModal';
import ScreenHeader from '../../components/common/ScreenHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import AppToast from '../../components/common/AppToast';
import TossEmoji from '../../components/common/TossEmoji';
import Segmented from '../../components/common/Segmented';
import SegmentedControl from '../../components/ui/SegmentedControl';
import { Icon } from '../../components/common/Icon';
import { useTheme } from '../../lib/theme';
import { useDataSource, useMockRole } from '../../lib/data-source';
import { getCategoryDef } from '../../lib/category-meta';
import { CATEGORY_ICON_CHOICES } from '../../lib/toss-emoji';
import { useCreateCategory, useDeleteCategory, useUpdateCategory } from '../../queries/mutations';
import type { Category, CategoryType, CostType } from '../../types/api';
import styles from './categories.module.css';

const TYPE_LABELS: Record<CategoryType, string> = {
  INCOME: '수입',
  EXPENSE: '지출',
};

const COLORS = ['#3182F6', '#0AB39C', '#F59E0B', '#EF4444', '#A78BFA', '#EC4899', '#06B6D4', '#8B5CF6'];

interface SubDraft {
  id: number;
  name: string;
  isNew: boolean;
}

function catVisual(c: Category) {
  const def = getCategoryDef(c.name);
  return { icon: c.icon || def.iconCode, color: c.color || def.color };
}

function CategoryEditSheet({
  visible,
  onClose,
  onSaved,
  existing,
  defaultType,
  subs: allSubs,
}: {
  visible: boolean;
  onClose: () => void;
  onSaved: (msg: string) => void;
  existing: Category | null;
  defaultType: CategoryType;
  subs: Category[];
}) {
  const theme = useTheme();
  const isEdit = !!existing;
  const isBuiltin = existing?.isBuiltin ?? false;

  const [name, setName] = useState('');
  const [type, setType] = useState<CategoryType>(defaultType);
  const [iconCode, setIconCode] = useState('1F381');
  const [color, setColor] = useState(COLORS[0]!);
  const [costType, setCostType] = useState<CostType | null>(null);
  const [subs, setSubs] = useState<SubDraft[]>([]);
  const [originalSubs, setOriginalSubs] = useState<SubDraft[]>([]);
  const [newSubName, setNewSubName] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [prevVisible, setPrevVisible] = useState(false);
  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (visible) {
      const visual = existing ? catVisual(existing) : null;
      setName(existing?.name ?? '');
      setType(existing?.type ?? defaultType);
      setIconCode(visual?.icon ?? CATEGORY_ICON_CHOICES[0]?.code ?? '1F381');
      setColor(visual?.color ?? COLORS[0]!);
      setCostType(existing?.defaultCostType ?? null);
      const drafts = allSubs.map((s) => ({ id: s.id, name: s.name, isNew: false }));
      setSubs(drafts);
      setOriginalSubs(drafts);
      setNewSubName('');
      setError('');
    }
  }

  function addSub() {
    const v = newSubName.trim();
    if (!v) return;
    setSubs((prev) => [...prev, { id: -Date.now() - Math.random(), name: v, isNew: true }]);
    setNewSubName('');
  }
  function removeSub(id: number) {
    setSubs((prev) => prev.filter((s) => s.id !== id));
  }

  async function handleSave() {
    if (!name.trim() || saving) return;
    setSaving(true);
    setError('');
    try {
      const costTypeDto = type === 'EXPENSE' ? { defaultCostType: costType } : {};
      let parentId: number | undefined = existing?.id;

      if (!isEdit) {
        const created = await createCategory.mutateAsync({ type, name: name.trim(), icon: iconCode, color, ...costTypeDto });
        parentId = created.id;
      } else if (!isBuiltin) {
        await updateCategory.mutateAsync({ id: existing.id, dto: { name: name.trim(), icon: iconCode, color, ...costTypeDto } });
      } else if (existing.defaultCostType !== costType) {
        // builtin 카테고리는 이름/아이콘/색상은 잠겨있지만 기본 분류만은 예외로 수정 가능
        await updateCategory.mutateAsync({ id: existing.id, dto: costTypeDto });
      }

      for (const s of subs) {
        if (s.isNew) {
          await createCategory.mutateAsync({ type, name: s.name.trim(), icon: iconCode, color, parentId: parentId! });
        } else {
          const orig = originalSubs.find((o) => o.id === s.id);
          if (orig && orig.name !== s.name.trim()) {
            await updateCategory.mutateAsync({ id: s.id, dto: { name: s.name.trim() } });
          }
        }
      }
      for (const orig of originalSubs) {
        if (!subs.find((s) => s.id === orig.id)) {
          await deleteCategory.mutateAsync(orig.id);
        }
      }

      onSaved(isEdit ? '카테고리를 수정했어요' : '카테고리를 추가했어요');
      onClose();
    } catch {
      setError('저장에 실패했어요');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!existing || deleting) return;
    setDeleting(true);
    try {
      await deleteCategory.mutateAsync(existing.id);
      onSaved('카테고리를 삭제했어요');
      onClose();
    } catch {
      setError('삭제에 실패했어요');
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <SheetModal
      visible={visible}
      onClose={onClose}
      header={isEdit ? '카테고리 수정' : '카테고리 추가'}
      cta={
        <div className={styles.sheetCta}>
          {error && <span style={{ color: theme.danger, fontSize: 12.5, textAlign: 'center', marginBottom: 8 }}>{error}</span>}
          <Button display="full" size="big" type="primary" disabled={!name.trim()} loading={saving} onPress={handleSave}>
            {isEdit ? '수정하기' : '추가하기'}
          </Button>
        </div>
      }
    >
      <div className={styles.sheetBody}>
        {!isBuiltin && (
          <>
            <span className={styles.fieldLabel} style={{ color: theme.textMuted, marginTop: 4 }}>이름</span>
            <TextField variant="line" placeholder="카테고리 이름" value={name} onChangeText={setName} />
          </>
        )}
        {isBuiltin && <p style={{ marginTop: 4, fontWeight: 700, color: theme.text }}>{name}</p>}

        {!isEdit && (
          <>
            <span className={styles.fieldLabel} style={{ color: theme.textMuted }}>유형</span>
            <Segmented
              options={['수입', '지출']}
              value={TYPE_LABELS[type]}
              onChange={(v) => {
                const t = Object.entries(TYPE_LABELS).find(([, label]) => label === v)?.[0] as CategoryType;
                if (t) setType(t);
              }}
            />
          </>
        )}

        {!isBuiltin && (
          <>
            <span className={styles.fieldLabel} style={{ color: theme.textMuted }}>아이콘</span>
            <div className={styles.iconGrid}>
              {CATEGORY_ICON_CHOICES.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  className={styles.iconCell}
                  style={{
                    backgroundColor: iconCode === c.code ? theme.brandSoft : theme.bg,
                    borderColor: iconCode === c.code ? theme.brand : theme.border,
                  }}
                  onClick={() => setIconCode(c.code)}
                >
                  <TossEmoji code={c.code} size={32} />
                </button>
              ))}
            </div>

            <span className={styles.fieldLabel} style={{ color: theme.textMuted }}>색상</span>
            <div className={styles.colorRow}>
              {COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  className={styles.colorCircle}
                  style={{ backgroundColor: c, border: color === c ? `3px solid ${theme.text}` : 'none' }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </>
        )}

        {type === 'EXPENSE' && (
          <>
            <span className={styles.fieldLabel} style={{ color: theme.textMuted }}>기본 분류</span>
            <div className={styles.costSeg}>
              <SegmentedControl.Root
                value={costType ?? 'NONE'}
                onChange={(v) => setCostType(v === 'NONE' ? null : (v as CostType))}
                name="defaultCostType"
                size="small"
                alignment="fixed"
              >
                <SegmentedControl.Item value="FIXED">고정비</SegmentedControl.Item>
                <SegmentedControl.Item value="VARIABLE">변동비</SegmentedControl.Item>
                <SegmentedControl.Item value="NONE">미지정</SegmentedControl.Item>
              </SegmentedControl.Root>
            </div>
          </>
        )}

        <span className={styles.fieldLabel} style={{ color: theme.textMuted }}>세부 카테고리</span>
        <div className={styles.subChipRow}>
          {subs.map((s) => (
            <div key={s.id} className={styles.subChip} style={{ borderColor: theme.border, backgroundColor: theme.card, color: theme.text }}>
              {s.name}
              <span className={styles.subChipX} style={{ backgroundColor: theme.bg, color: theme.textMuted }} onClick={() => removeSub(s.id)}>✕</span>
            </div>
          ))}
          {subs.length === 0 && <span style={{ fontSize: 12.5, color: theme.textMuted }}>세부 카테고리가 없어요</span>}
        </div>
        <div className={styles.subAddRow}>
          <input
            className={styles.subInput}
            style={{ borderColor: theme.border, color: theme.text, backgroundColor: theme.bg }}
            placeholder="세부 카테고리 이름"
            value={newSubName}
            onChange={(e) => setNewSubName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSub(); } }}
          />
          <button type="button" className={styles.subAddBtn} style={{ borderColor: theme.brand, color: theme.brand }} onClick={addSub}>
            추가
          </button>
        </div>

        {isEdit && !isBuiltin && (
          <div className={styles.deleteBtnWrap} style={{ borderTopColor: theme.border }}>
            <button type="button" disabled={deleting} onClick={() => setConfirmDelete(true)}>
              <span style={{ color: theme.danger, fontSize: 13, fontWeight: 700 }}>{deleting ? '삭제 중...' : '카테고리 삭제'}</span>
            </button>
          </div>
        )}
      </div>

      <ConfirmDialog
        visible={confirmDelete}
        title="카테고리를 삭제할까요?"
        description={existing ? `"${existing.name}" 및 하위 세부 카테고리가 함께 삭제돼요.` : undefined}
        confirmText="삭제하기"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setConfirmDelete(false)}
      />
    </SheetModal>
  );
}

export default function CategoriesPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const role = useMockRole();
  const data = useDataSource();
  const canEdit = role !== 'VIEWER';
  const [editSheet, setEditSheet] = useState<{ existing: Category | null; defaultType: CategoryType } | null>(null);
  const [toast, setToast] = useState('');

  const typeOrder: CategoryType[] = ['INCOME', 'EXPENSE'];

  function openAdd(type: CategoryType) {
    setEditSheet({ existing: null, defaultType: type });
  }
  function openEdit(c: Category) {
    setEditSheet({ existing: c, defaultType: c.type });
  }

  return (
    <div className={styles.root} style={{ backgroundColor: theme.bg }}>
      <ScreenHeader title="카테고리 관리" onBack={() => navigate(-1)} />
      <div className={styles.scroll}>
        <span className={styles.subtitle} style={{ color: theme.textMuted }}>
          기본 카테고리에 더해, 우리집만의 카테고리와 세부 카테고리를 만들 수 있어요.
        </span>

        {typeOrder.map((t) => {
          const topLevel = data.categories.filter((c) => c.type === t && !c.parentId);

          return (
            <React.Fragment key={t}>
              <ListHeader
                title={<ListHeader.TitleParagraph typography="t5">{TYPE_LABELS[t]} ({topLevel.length})</ListHeader.TitleParagraph>}
              />
              {topLevel.map((c, idx) => {
                const visual = catVisual(c);
                const subCount = data.categories.filter((x) => x.parentId === c.id).length;
                return (
                  <React.Fragment key={c.id}>
                    <ListRow
                      left={
                        <div className={styles.catIconBox} style={{ backgroundColor: visual.color + '22' }}>
                          <TossEmoji code={visual.icon} size={28} />
                        </div>
                      }
                      contents={
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span className={styles.catName} style={{ color: theme.text }}>{c.name}</span>
                          <span className={styles.catSub} style={{ color: theme.textMuted }}>
                            {c.isBuiltin ? '기본' : '커스텀'}{subCount > 0 ? ` · 세부 ${subCount}개` : ''}
                          </span>
                        </div>
                      }
                      right={
                        <div className={styles.catRight}>
                          <span className={styles.colorDot} style={{ backgroundColor: visual.color }} />
                          {canEdit && Icon.chevronRight(theme.textMuted, 16)}
                        </div>
                      }
                      onPress={canEdit ? () => openEdit(c) : undefined}
                      verticalPadding="small"
                    />
                    {idx < topLevel.length - 1 && <Border type="full" />}
                  </React.Fragment>
                );
              })}
              <Border type="full" height={16} />
            </React.Fragment>
          );
        })}

        {canEdit && (
          <div className={styles.addCatBtnWrap}>
            <Button display="full" size="big" type="primary" style="weak" onPress={() => openAdd('EXPENSE')}>
              + 카테고리 추가
            </Button>
          </div>
        )}

        <div style={{ height: 32 }} />
      </div>

      <CategoryEditSheet
        visible={!!editSheet}
        onClose={() => setEditSheet(null)}
        onSaved={(msg) => setToast(msg)}
        existing={editSheet?.existing ?? null}
        defaultType={editSheet?.defaultType ?? 'EXPENSE'}
        subs={editSheet?.existing ? data.categories.filter((c) => c.parentId === editSheet.existing!.id) : []}
      />
      <AppToast open={!!toast} text={toast} onClose={() => setToast('')} />
    </div>
  );
}
