import { useFetchCategoryTree } from '@/features/categories/api/fetch-category-tree';
import { type CategoryTreeItem } from '@/features/categories/types';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface CategoryTreeProps {
  selectedCategoryId?: string;
  onCategorySelect: (categoryId: string) => void;
  siteCode?: string;
}

export function CategoryTree({
  selectedCategoryId,
  onCategorySelect,
  siteCode,
}: CategoryTreeProps) {
  const { data: categories, isLoading, isError } = useFetchCategoryTree({ siteCode });
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const renderTreeItem = (item: CategoryTreeItem, depth: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedIds.has(item.id);
    const isSelected = selectedCategoryId === item.id;

    return (
      <div key={item.id}>
        <div
          className={`
            flex items-center gap-2 py-2 px-3 rounded cursor-pointer
            hover:bg-gray-100 transition-colors
            ${isSelected ? 'bg-blue-50 text-blue-700 font-medium' : ''}
          `}
          style={{ paddingLeft: `${depth * 1.5 + 0.75}rem` }}
          onClick={() => {
            if (hasChildren) {
              toggleExpand(item.id);
            }
            onCategorySelect(item.id);
          }}
        >
          {hasChildren ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(item.id);
              }}
              className="p-0.5 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          ) : (
            <div className="w-5" />
          )}

          <span className="text-sm truncate flex-1">{item.name}</span>

          <span className="text-xs text-muted-foreground">Lv{item.level}</span>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {item.children?.map((child) => renderTreeItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground p-4">
        카테고리 로딩 중...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-sm text-destructive p-4">
        카테고리를 불러오는데 실패했습니다.
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="text-sm text-muted-foreground p-4">
        카테고리가 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {categories.map((category) => renderTreeItem(category))}
    </div>
  );
}
