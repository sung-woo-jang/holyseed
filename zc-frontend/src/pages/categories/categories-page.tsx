import { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  type ColumnDef,
  flexRender,
} from '@tanstack/react-table';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui';
import { useFetchCategoryTree } from '@/features/categories/api/fetch-category-tree';
import { type CategoryTreeItem } from '@/features/categories/types';

// 트리 플래튼 함수
function flattenTree(
  items: CategoryTreeItem[],
  depth: number = 0
): (CategoryTreeItem & { depth: number })[] {
  return items.flatMap((item) => [
    { ...item, depth },
    ...(item.children ? flattenTree(item.children, depth + 1) : []),
  ]);
}

const columns: ColumnDef<CategoryTreeItem & { depth: number }>[] = [
  {
    accessorKey: 'name',
    header: '카테고리명',
    cell: ({ row }) => (
      <div
        style={{ paddingLeft: `${row.original.depth * 24}px` }}
        className="flex items-center gap-2"
      >
        {row.original.children && row.original.children.length > 0 && (
          <button
            onClick={row.getToggleExpandedHandler()}
            className="text-gray-500 hover:text-gray-700"
          >
            {row.getIsExpanded() ? '▼' : '▶'}
          </button>
        )}
        <span className="font-medium">{row.original.name}</span>
      </div>
    ),
    size: 400,
  },
  {
    accessorKey: 'siteCategoryCode',
    header: '카테고리 코드',
    size: 150,
  },
  {
    accessorKey: 'level',
    header: '레벨',
    cell: ({ row }) => {
      const levelNames = { 1: '대분류', 2: '중분류', 3: '소분류' };
      return levelNames[row.original.level as 1 | 2 | 3] || row.original.level;
    },
    size: 100,
  },
];

export function CategoriesPage() {
  const { data: tree, isLoading, isError } = useFetchCategoryTree();

  // 트리를 플랫하게 변환
  const flatData = useMemo(() => {
    if (!tree) return [];
    return flattenTree(tree);
  }, [tree]);

  const table = useReactTable({
    data: flatData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getSubRows: (row) =>
      row.children
        ? row.children.map((child) => ({ ...child, depth: row.depth + 1 }))
        : undefined,
  });

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-3xl font-bold">카테고리 관리</h1>
        <p className="text-muted-foreground mt-2">카테고리 트리 구조 조회</p>
      </div>

      {/* 카테고리 트리 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>카테고리 트리</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="text-center py-12 text-muted-foreground">
              로딩 중...
            </div>
          )}

          {isError && (
            <div className="text-center py-12 text-destructive">
              데이터를 불러오는데 실패했습니다.
            </div>
          )}

          {tree && (
            <div className="rounded-md border overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-4 py-3 text-left text-sm font-medium text-gray-700"
                          style={{ width: header.column.getSize() }}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="border-b hover:bg-gray-50">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-3 text-sm">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>

              {flatData.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  카테고리가 없습니다.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
