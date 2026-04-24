import {
  useReactTable,
  getCoreRowModel,
  type ColumnDef,
  flexRender,
} from '@tanstack/react-table';
import { useNavigate } from 'react-router-dom';
import { type Product } from '@/features/products/types';
import { Badge } from '@/shared/ui';

interface ProductTableProps {
  data: Product[];
}

const columns: ColumnDef<Product>[] = [
  {
    accessorKey: 'productName',
    header: '제품명',
    cell: ({ row }) => (
      <div className="flex items-start gap-3">
        {row.original.images?.[0] && (
          <img
            src={row.original.images[0].originalUrl}
            alt={row.original.productName}
            className="w-12 h-12 object-cover rounded"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{row.original.productName}</div>
        </div>
      </div>
    ),
    size: 280,
  },
  {
    accessorKey: 'extractedModelName',
    header: '모델명',
    cell: ({ row }) => (
      <span className="text-sm">
        {row.original.extractedModelName || '-'}
      </span>
    ),
    size: 120,
  },
  {
    accessorKey: 'brand',
    header: '브랜드',
    cell: ({ row }) => row.original.brand?.name || '-',
    size: 120,
  },
  {
    accessorKey: 'category',
    header: '카테고리',
    cell: ({ row }) => row.original.category?.name || '-',
    size: 150,
  },
  {
    accessorKey: 'currentPrice',
    header: '가격',
    cell: ({ row }) => {
      const price = row.original.currentPrice;
      const discountPrice = row.original.currentDiscountPrice;

      return (
        <div className="text-right">
          {discountPrice ? (
            <>
              <div className="text-sm line-through text-muted-foreground">
                {price.toLocaleString()}원
              </div>
              <div className="font-semibold text-red-600">
                {discountPrice.toLocaleString()}원
              </div>
            </>
          ) : (
            <div className="font-semibold">{price.toLocaleString()}원</div>
          )}
        </div>
      );
    },
    size: 120,
  },
  {
    accessorKey: 'isAvailable',
    header: '상태',
    cell: ({ row }) => (
      <Badge variant={row.original.isAvailable ? 'success' : 'error'}>
        {row.original.isAvailable ? '판매중' : '품절'}
      </Badge>
    ),
    size: 80,
  },
];

export function ProductTable({ data }: ProductTableProps) {
  const navigate = useNavigate();

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded-md border bg-white overflow-hidden">
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
            <tr
              key={row.id}
              onClick={() => navigate(`/products/${row.original.id}`)}
              className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-3 text-sm">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {data.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          검색 결과가 없습니다.
        </div>
      )}
    </div>
  );
}
