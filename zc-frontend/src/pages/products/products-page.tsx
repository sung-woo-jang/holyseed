import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui'
import { useFetchProducts } from '@/features/products/api/fetch-products'
import { ProductTable } from '@/features/products/ui/product-table'
import { ProductFilters } from '@/features/products/ui/product-filters'
import { SearchInput } from '@/features/products/ui/search-input'
import { CategoryTree } from '@/features/categories/ui'
import { Pagination } from '@/widgets/pagination'
import { useDebounce } from '@/shared/hooks/useDebounce'

export function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL Query Params
  const page = parseInt(searchParams.get('page') || '1', 10);
  const categoryId = searchParams.get('categoryId') || undefined;
  const brandId = searchParams.get('brandId') || undefined;
  const siteCode = searchParams.get('siteCode') || undefined;
  const matchStatus = searchParams.get('matchStatus') || 'all';

  // 검색어 상태 (debounce)
  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '');
  const debouncedSearch = useDebounce(searchValue, 500);

  // 매칭 상태를 hasModel 파라미터로 변환
  const hasModel = matchStatus === 'matched' ? true : matchStatus === 'unmatched' ? false : undefined;

  // 제품 목록 조회
  const { data, isLoading, isError } = useFetchProducts({
    page,
    limit: 20,
    categoryId,
    brandId,
    siteCode,
    hasModel,
    search: debouncedSearch || undefined,
  });

  // 필터 변경 핸들러
  const handleCategoryChange = (value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) {
        next.set('categoryId', value);
      } else {
        next.delete('categoryId');
      }
      next.set('page', '1'); // 필터 변경 시 1페이지로
      return next;
    });
  };

  const handleBrandChange = (value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) {
        next.set('brandId', value);
      } else {
        next.delete('brandId');
      }
      next.set('page', '1');
      return next;
    });
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) {
        next.set('search', value);
      } else {
        next.delete('search');
      }
      next.set('page', '1');
      return next;
    });
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', newPage.toString());
      return next;
    });
  };

  const handleSiteChange = (value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) {
        next.set('siteCode', value);
      } else {
        next.delete('siteCode');
      }
      next.set('page', '1');
      return next;
    });
  };

  const handleMatchStatusChange = (value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value && value !== 'all') {
        next.set('matchStatus', value);
      } else {
        next.delete('matchStatus');
      }
      next.set('page', '1');
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-3xl font-bold">제품 목록</h1>
        <p className="text-muted-foreground mt-2">
          크롤링된 제품 목록 조회 및 검색
        </p>
      </div>

      {/* 카테고리 트리 & 검색/필터 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 카테고리 트리 */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">카테고리</CardTitle>
          </CardHeader>
          <CardContent className="max-h-[600px] overflow-y-auto">
            <CategoryTree
              selectedCategoryId={categoryId}
              onCategorySelect={handleCategoryChange}
              siteCode={siteCode}
            />
          </CardContent>
        </Card>

        {/* 검색 & 브랜드 필터 */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">검색 및 필터</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 검색 */}
            <SearchInput value={searchValue} onSearch={handleSearchChange} />

            {/* 브랜드 필터 */}
            <ProductFilters
              brandId={brandId}
              siteCode={siteCode}
              matchStatus={matchStatus}
              onBrandChange={handleBrandChange}
              onSiteChange={handleSiteChange}
              onMatchStatusChange={handleMatchStatusChange}
            />
          </CardContent>
        </Card>
      </div>

      {/* 제품 테이블 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">제품 목록</CardTitle>
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

          {data && <ProductTable data={data.items} />}
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
