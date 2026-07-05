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
import { useTheme } from '../../lib/theme';
import { useDataSource, useMockRole } from '../../lib/data-source';
import { getCategoryDef } from '../../lib/category-meta';
import { CATEGORY_ICON_CHOICES } from '../../lib/toss-emoji';
import { useCreateCategory, useDeleteCategory } from '../../queries/mutations';
import type { CategoryType } from '../../types/api';
import styles from './categories.module.css';

const TYPE_LABELS: Record<CategoryType, string> = {
  INCOME: '수입',
  EXPENSE: '지출',
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
        <div className={styles.sheetCta}>
          <Button display="full" size="big" type="primary" disabled={!name.trim()} loading={saving} onPress={handleAdd}>
            추가하기
          </Button>
        </div>
      }
    >
      <div className={styles.sheetBody}>
        <span className={styles.fieldLabel} style={{ color: theme.textMuted }}>이름</span>
        <TextField variant="line" placeholder="카테고리 이름" value={name} onChangeText={setName} />

        <span className={styles.fieldLabel} style={{ color: theme.textMuted }}>유형</span>
        <Segmented
          options={['수입', '지출']}
          value={TYPE_LABELS[type]}
          onChange={(v) => {
            const t = Object.entries(TYPE_LABELS).find(([, label]) => label === v)?.[0] as CategoryType;
            if (t) setType(t);
          }}
        />

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
      </div>
    </SheetModal>
  );
}

export default function CategoriesPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const role = useMockRole();
  const data = useDataSource();
  const canEdit = role !== 'VIEWER';
  const [addVisible, setAddVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [toast, setToast] = useState('');
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();

  const typeOrder: CategoryType[] = ['INCOME', 'EXPENSE'];

  async function handleAdd(dto: { type: CategoryType; name: string; icon: string }) {
    await createCategory.mutateAsync(dto);
    setToast('카테고리를 추가했어요');
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

  const hasApiCategories = data.categories.length > 0;
  const builtinByType: Record<CategoryType, string[]> = {
    INCOME: ['급여', '투자수익', '사업소득', '기타수입'],
    EXPENSE: ['주거', '식비', '교통', '의료', '쇼핑', '여가', '교육', '보험료', '구독', '기타'],
  };

  return (
    <div className={styles.root} style={{ backgroundColor: theme.bg }}>
      <ScreenHeader title="카테고리 관리" onBack={() => navigate(-1)} />
      <div className={styles.scroll}>
        <span className={styles.subtitle} style={{ color: theme.textMuted }}>
          기본 카테고리에 더해, 우리집만의 카테고리를 만들 수 있어요.
        </span>

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
                      <div className={styles.catIconBox} style={{ backgroundColor: item.color + '22' }}>
                        <TossEmoji code={item.iconCode} size={28} />
                      </div>
                    }
                    contents={
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className={styles.catName} style={{ color: theme.text }}>{item.name}</span>
                        <span className={styles.catSub} style={{ color: theme.textMuted }}>{item.isBuiltin ? '기본' : '커스텀'}</span>
                      </div>
                    }
                    right={
                      <div className={styles.catRight}>
                        <span className={styles.colorDot} style={{ backgroundColor: item.color }} />
                        {!item.isBuiltin && canEdit && item.id > 0 && (
                          <button type="button" onClick={() => setDeleteTarget({ id: item.id, name: item.name })}>
                            <span className={styles.deleteText} style={{ color: theme.danger }}>삭제</span>
                          </button>
                        )}
                      </div>
                    }
                    verticalPadding="small"
                  />
                  {idx < items.length - 1 && <Border type="full" />}
                </React.Fragment>
              ))}
              <Border type="full" height={16} />
            </React.Fragment>
          );
        })}

        {canEdit && (
          <div className={styles.addCatBtnWrap}>
            <Button display="full" size="big" type="primary" style="weak" onPress={() => setAddVisible(true)}>
              + 카테고리 추가
            </Button>
          </div>
        )}

        <div style={{ height: 32 }} />
      </div>

      <AddCategorySheet visible={addVisible} onClose={() => setAddVisible(false)} onAdd={handleAdd} />

      <ConfirmDialog
        visible={!!deleteTarget}
        title="카테고리를 삭제할까요?"
        description={deleteTarget ? `"${deleteTarget.name}" 카테고리가 삭제돼요.` : undefined}
        confirmText="삭제하기"
        danger
        loading={deleteCategory.isPending}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
      <AppToast open={!!toast} text={toast} onClose={() => setToast('')} />
    </div>
  );
}
