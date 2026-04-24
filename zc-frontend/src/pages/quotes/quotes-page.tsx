import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '@/shared/ui'
import { useFetchQuotes } from '@/features/quotes/api'
import { QuoteTable } from '@/features/quotes/ui'
import { Pagination } from '@/widgets/pagination'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { type QuoteStatus } from '@/features/quotes/types'

const STATUS_OPTIONS: { value: QuoteStatus | 'all'; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'draft', label: '작성중' },
  { value: 'sent', label: '발송됨' },
  { value: 'accepted', label: '수락' },
  { value: 'rejected', label: '거절' },
];

export function QuotesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const page = parseInt(searchParams.get('page') || '1', 10);
  const statusParam = searchParams.get('status') || 'all';

  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '');
  const debouncedSearch = useDebounce(searchValue, 500);

  const { data, isLoading, isError } = useFetchQuotes({
    page,
    limit: 20,
    status: statusParam !== 'all' ? (statusParam as QuoteStatus) : undefined,
    search: debouncedSearch || undefined,
  });

  const handleStatusChange = (value: string) => {
    setSearchParams((prev) => {
      if (value !== 'all') {
        prev.set('status', value);
      } else {
        prev.delete('status');
      }
      prev.set('page', '1');
      return prev;
    });
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    setSearchParams((prev) => {
      if (value) {
        prev.set('search', value);
      } else {
        prev.delete('search');
      }
      prev.set('page', '1');
      return prev;
    });
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams((prev) => {
      prev.set('page', newPage.toString());
      return prev;
    });
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">견적서 관리</h1>
          <p className="text-muted-foreground mt-2">
            견적서 생성 및 관리
          </p>
        </div>
        <Button onClick={() => navigate('/quotes/new')}>
          새 견적서 생성
        </Button>
      </div>

      {/* 필터 및 검색 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">필터 및 검색</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 상태 필터 */}
          <div>
            <label className="block text-sm font-medium mb-2">상태</label>
            <div className="flex gap-2">
              {STATUS_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  variant={statusParam === option.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusChange(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* 검색 */}
          <div>
            <label className="block text-sm font-medium mb-2">검색</label>
            <Input
              value={searchValue}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="제목 또는 고객명으로 검색"
            />
          </div>
        </CardContent>
      </Card>

      {/* 견적서 테이블 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">견적서 목록</CardTitle>
            {data && (
              <span className="text-sm text-muted-foreground">
                총 {data.total}개
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

          {data?.items && <QuoteTable data={data.items} />}

          {data && !data.items?.length && !isLoading && (
            <div className="text-center py-12 text-muted-foreground">
              견적서가 없습니다.
            </div>
          )}
        </CardContent>
      </Card>

      {/* 페이지네이션 */}
      {data && data.totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={data.totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
