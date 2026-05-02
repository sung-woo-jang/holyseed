import { useState } from 'react';
import { ChevronRight, ChevronDown, Plus, Pencil, Trash2, Unlink } from 'lucide-react';
import { Button, Card, Input, Badge } from '@/shared/ui';
import { useFetchUnifiedTree } from '@/features/categories/api/unified/useFetchUnifiedTree';
import {
  useCreateUnifiedCategory,
  useUpdateUnifiedCategory,
  useDeleteUnifiedCategory,
  useFetchCategoryMappings,
  useAssignMappings,
  useRemoveMappings,
} from '@/features/categories/api/unified/useUnifiedCategoryMutations';
import { useFetchCategoryTree } from '@/features/categories/api/fetch-category-tree';
import { useFetchSites } from '@/features/sites/api/fetch-sites/useFetchSites';
import type { UnifiedCategory } from '@/features/categories/types';

// ────────────────────────────────────────────────────────
// 통합 카테고리 트리 노드
// ────────────────────────────────────────────────────────
function CategoryNode({
  node,
  depth,
  selectedId,
  onSelect,
  onEdit,
  onDelete,
  onAddChild,
}: {
  node: UnifiedCategory;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onEdit: (node: UnifiedCategory) => void;
  onDelete: (node: UnifiedCategory) => void;
  onAddChild: (parentId: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = (node.children?.length ?? 0) > 0;

  return (
    <div>
      <div
        className={`flex items-center gap-1 px-2 py-1.5 rounded cursor-pointer group hover:bg-muted/60 ${
          selectedId === node.id ? 'bg-primary/10 text-primary' : ''
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => onSelect(node.id)}
      >
        <button
          className="w-4 h-4 flex items-center justify-center text-muted-foreground"
          onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
        >
          {hasChildren ? (expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />) : null}
        </button>
        <span className="flex-1 text-sm font-medium truncate">{node.name}</span>
        {(node.mappedSiteCategoryCount ?? 0) > 0 && (
          <Badge variant="secondary" className="text-xs py-0">{node.mappedSiteCategoryCount}</Badge>
        )}
        <div className="hidden group-hover:flex items-center gap-0.5">
          <button
            className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
            title="하위 카테고리 추가"
            onClick={(e) => { e.stopPropagation(); onAddChild(node.id); }}
          >
            <Plus className="w-3 h-3" />
          </button>
          <button
            className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
            title="수정"
            onClick={(e) => { e.stopPropagation(); onEdit(node); }}
          >
            <Pencil className="w-3 h-3" />
          </button>
          <button
            className="p-0.5 rounded hover:bg-muted text-red-400 hover:text-red-600"
            title="삭제"
            onClick={(e) => { e.stopPropagation(); onDelete(node); }}
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {expanded && hasChildren && (
        <div>
          {node.children!.map((child) => (
            <CategoryNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────
// 메인 페이지
// ────────────────────────────────────────────────────────
export function CategoriesPage() {
  const { data: tree, isLoading } = useFetchUnifiedTree();
  const createCat = useCreateUnifiedCategory();
  const updateCat = useUpdateUnifiedCategory();
  const deleteCat = useDeleteUnifiedCategory();
  const assignMappings = useAssignMappings();
  const removeMappings = useRemoveMappings();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: mappings } = useFetchCategoryMappings(selectedId);

  const { data: sites } = useFetchSites();
  const [siteCode, setSiteCode] = useState('dasis');
  const { data: siteCategoryTree } = useFetchCategoryTree({ siteCode });

  // 사이트 카테고리 평탄화 (매핑 모달용)
  const flatSiteCategories = flattenSiteCategories(siteCategoryTree ?? []);
  const mappedIds = new Set((mappings ?? []).map((m: any) => m.id));

  // 폼 상태
  const [formMode, setFormMode] = useState<'none' | 'create' | 'edit'>('none');
  const [formName, setFormName] = useState('');
  const [formParentId, setFormParentId] = useState<string | null>(null);
  const [editingNode, setEditingNode] = useState<UnifiedCategory | null>(null);


  const handleSelect = (id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
  };

  const openCreate = (parentId?: string) => {
    setFormMode('create');
    setFormName('');
    setFormParentId(parentId ?? null);
    setEditingNode(null);
  };

  const openEdit = (node: UnifiedCategory) => {
    setFormMode('edit');
    setFormName(node.name);
    setFormParentId(node.parentId);
    setEditingNode(node);
  };

  const handleFormSubmit = async () => {
    if (!formName.trim()) return;
    try {
      if (formMode === 'create') {
        await createCat.mutateAsync({ name: formName.trim(), parentId: formParentId ?? undefined });
      } else if (formMode === 'edit' && editingNode) {
        await updateCat.mutateAsync({ id: editingNode.id, dto: { name: formName.trim() } });
      }
      setFormMode('none');
    } catch (e: any) {
      alert(e.response?.data?.message || '오류가 발생했습니다.');
    }
  };

  const handleDelete = async (node: UnifiedCategory) => {
    if (!confirm(`"${node.name}" 카테고리를 삭제하시겠습니까?`)) return;
    try {
      await deleteCat.mutateAsync(node.id);
      if (selectedId === node.id) setSelectedId(null);
    } catch (e: any) {
      alert(e.response?.data?.message || '삭제에 실패했습니다.');
    }
  };

  const handleToggleMapping = async (siteCatId: string, mapped: boolean) => {
    if (!selectedId) return;
    try {
      if (mapped) {
        await removeMappings.mutateAsync({ categoryId: selectedId, siteCategoryIds: [siteCatId] });
      } else {
        await assignMappings.mutateAsync({ categoryId: selectedId, siteCategoryIds: [siteCatId] });
      }
    } catch (e: any) {
      alert(e.response?.data?.message || '매핑 처리 실패');
    }
  };

  const selectedNode = selectedId ? findNode(tree ?? [], selectedId) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">카테고리 관리</h1>
          <p className="text-sm text-muted-foreground mt-0.5">통합 카테고리 정의 + 사이트 카테고리 매핑</p>
        </div>
        <Button size="sm" onClick={() => openCreate()}>
          <Plus className="w-4 h-4 mr-1" /> 대분류 추가
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* 좌: 통합 카테고리 트리 */}
        <Card className="p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold">통합 카테고리</span>
            <span className="text-xs text-muted-foreground">클릭하면 매핑 보기</span>
          </div>

          {isLoading && <div className="py-8 text-center text-sm text-muted-foreground">불러오는 중...</div>}

          {!isLoading && (tree ?? []).length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              카테고리 없음. 우측 상단 "대분류 추가"를 눌러 시작하세요.
            </div>
          )}

          <div className="space-y-0.5">
            {(tree ?? []).map((node) => (
              <CategoryNode
                key={node.id}
                node={node}
                depth={0}
                selectedId={selectedId}
                onSelect={handleSelect}
                onEdit={openEdit}
                onDelete={handleDelete}
                onAddChild={(parentId) => openCreate(parentId)}
              />
            ))}
          </div>

          {/* 인라인 추가/수정 폼 */}
          {formMode !== 'none' && (
            <div className="mt-3 pt-3 border-t space-y-2">
              <div className="text-xs font-medium text-muted-foreground">
                {formMode === 'create' ? (formParentId ? '하위 카테고리 추가' : '대분류 추가') : '카테고리 수정'}
              </div>
              <Input
                autoFocus
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="카테고리명"
                onKeyDown={(e) => { if (e.key === 'Enter') handleFormSubmit(); if (e.key === 'Escape') setFormMode('none'); }}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleFormSubmit} disabled={!formName.trim()}>저장</Button>
                <Button size="sm" variant="outline" onClick={() => setFormMode('none')}>취소</Button>
              </div>
            </div>
          )}
        </Card>

        {/* 우: 사이트 카테고리 매핑 */}
        <Card className="p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold">
              {selectedNode ? `"${selectedNode.name}" 매핑` : '사이트 카테고리 매핑'}
            </span>
            {selectedId && (
              <select
                className="text-xs border rounded px-1.5 py-0.5"
                value={siteCode}
                onChange={(e) => setSiteCode(e.target.value)}
              >
                {(sites ?? []).map((s: any) => (
                  <option key={s.id} value={s.code}>{s.name}</option>
                ))}
              </select>
            )}
          </div>

          {!selectedId && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              좌측에서 통합 카테고리를 선택하면 매핑할 사이트 카테고리를 고를 수 있습니다.
            </div>
          )}

          {selectedId && (
            <>
              {(mappings ?? []).length > 0 && (
                <div className="mb-3">
                  <div className="text-xs text-muted-foreground mb-1">현재 매핑됨 ({mappings!.length})</div>
                  <div className="flex flex-wrap gap-1">
                    {mappings!.map((m: any) => (
                      <span key={m.id} className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary rounded px-2 py-0.5">
                        {m.name}
                        <button onClick={() => handleToggleMapping(m.id, true)} title="매핑 해제">
                          <Unlink className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-xs text-muted-foreground mb-1">사이트 카테고리 ({siteCode})</div>
              <div className="space-y-0.5 max-h-80 overflow-y-auto">
                {flatSiteCategories.map((sc) => {
                  const isMapped = mappedIds.has(sc.id);
                  return (
                    <div
                      key={sc.id}
                      className={`flex items-center gap-2 px-2 py-1 rounded text-xs hover:bg-muted/50 cursor-pointer ${isMapped ? 'bg-primary/5' : ''}`}
                      style={{ paddingLeft: `${(sc.level - 1) * 12 + 8}px` }}
                      onClick={() => handleToggleMapping(sc.id, isMapped)}
                    >
                      <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 ${isMapped ? 'bg-primary border-primary' : 'border-muted-foreground'}`}>
                        {isMapped && <span className="text-white text-[10px]">✓</span>}
                      </div>
                      <span className={isMapped ? 'font-medium text-primary' : ''}>{sc.name}</span>
                      <span className="text-muted-foreground ml-auto">{sc.siteCategoryCode}</span>
                    </div>
                  );
                })}
                {flatSiteCategories.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">카테고리 없음</div>
                )}
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────
// 유틸
// ────────────────────────────────────────────────────────
function flattenSiteCategories(tree: any[]): any[] {
  return tree.flatMap((n) => [n, ...(n.children ? flattenSiteCategories(n.children) : [])]);
}

function findNode(tree: UnifiedCategory[], id: string): UnifiedCategory | null {
  for (const node of tree) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNode(node.children, id);
      if (found) return found;
    }
  }
  return null;
}
