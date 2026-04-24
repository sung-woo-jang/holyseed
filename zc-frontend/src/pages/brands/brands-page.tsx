import {
  useReactTable,
  getCoreRowModel,
  type ColumnDef,
  flexRender,
} from '@tanstack/react-table';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui';
import { useFetchBrands } from '@/features/brands/api/fetch-brands';
import { type Brand } from '@/features/brands/types';

const columns: ColumnDef<Brand>[] = [
  {
    accessorKey: 'name',
    header: '브랜드명',
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        {row.original.logoUrl && (
          <img
            src={row.original.logoUrl}
            alt={row.original.name}
            className="w-8 h-8 object-contain rounded"
          />
        )}
        <div>
          <div className="font-medium">{row.original.name}</div>
          {row.original.nameEn && (
            <div className="text-xs text-muted-foreground">
              {row.original.nameEn}
            </div>
          )}
        </div>
      </div>
    ),
    size: 250,
  },
  {
    accessorKey: 'productCount',
    header: '제품 개수',
    cell: ({ row }) => (
      <div className="text-right">
        {row.original.productCount !== undefined
          ? row.original.productCount.toLocaleString()
          : '-'}
      </div>
    ),
    size: 120,
  },
  {
    accessorKey: 'description',
    header: '설명',
    cell: ({ row }) => (
      <div className="truncate max-w-md">
        {row.original.description || '-'}
      </div>
    ),
    size: 300,
  },
  {
    accessorKey: 'createdAt',
    header: '생성일',
    cell: ({ row }) =>
      new Date(row.original.createdAt).toLocaleDateString('ko-KR'),
    size: 120,
  },
];

export function BrandsPage() {
  const { data: brands, isLoading, isError } = useFetchBrands();

  const table = useReactTable({
    data: brands || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-3xl font-bold">브랜드 관리</h1>
        <p className="text-muted-foreground mt-2">브랜드 목록 조회</p>
      </div>

      {/* 브랜드 테이블 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>브랜드 목록</CardTitle>
            {brands && (
              <span className="text-sm text-muted-foreground">
                총 {brands.length}개
              </span>
            )}
          </div>
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

          {brands && (
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

              {brands.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  브랜드가 없습니다.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
