import {
  useReactTable,
  getCoreRowModel,
  type ColumnDef,
  flexRender,
} from '@tanstack/react-table';
import { useNavigate } from 'react-router-dom';
import { type Quote } from '@/features/quotes/types';
import { Button } from '@/shared/ui';
import { QuoteStatusBadge } from '../quote-status-badge';
import { useDeleteQuote, useDuplicateQuote } from '@/features/quotes/api';

interface QuoteTableProps {
  data: Quote[];
}

export function QuoteTable({ data }: QuoteTableProps) {
  const navigate = useNavigate();
  const deleteQuote = useDeleteQuote();
  const duplicateQuote = useDuplicateQuote();

  const columns: ColumnDef<Quote>[] = [
    {
      accessorKey: 'title',
      header: '제목',
      cell: ({ row }) => (
        <div className="min-w-0">
          <div className="font-medium truncate">{row.original.title}</div>
          {row.original.customerName && (
            <div className="text-xs text-muted-foreground">
              고객: {row.original.customerName}
            </div>
          )}
        </div>
      ),
      size: 300,
    },
    {
      accessorKey: 'status',
      header: '상태',
      cell: ({ row }) => <QuoteStatusBadge status={row.original.status} />,
      size: 100,
    },
    {
      accessorKey: 'totalAmount',
      header: '총액',
      cell: ({ row }) => `${row.original.totalAmount.toLocaleString()}원`,
      size: 120,
    },
    {
      accessorKey: 'items',
      header: '항목 수',
      cell: ({ row }) => `${row.original.items.length}개`,
      size: 100,
    },
    {
      accessorKey: 'validUntil',
      header: '유효기한',
      cell: ({ row }) => row.original.validUntil || '-',
      size: 120,
    },
    {
      accessorKey: 'createdAt',
      header: '생성일',
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
      size: 120,
    },
    {
      id: 'actions',
      header: '작업',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/quotes/${row.original.id}`)}
          >
            상세
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => duplicateQuote.mutate(row.original.id)}
            disabled={duplicateQuote.isPending}
          >
            복제
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (confirm('정말 삭제하시겠습니까?')) {
                deleteQuote.mutate(row.original.id);
              }
            }}
            disabled={deleteQuote.isPending}
          >
            삭제
          </Button>
        </div>
      ),
      size: 200,
    },
  ];

  const table = useReactTable({
    data: data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded-md border">
      <table className="w-full">
        <thead className="bg-muted/50">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-4 py-3 text-left text-sm font-medium"
                  style={{ width: header.getSize() }}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                견적서가 없습니다.
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-t hover:bg-muted/50 cursor-pointer"
                onClick={() => navigate(`/quotes/${row.original.id}`)}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 text-sm" onClick={(e) => {
                    if (cell.column.id === 'actions') {
                      e.stopPropagation();
                    }
                  }}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
