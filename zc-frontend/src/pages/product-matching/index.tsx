import { useState } from 'react';
import { useFetchUnmatchedProducts, useFetchProductModels } from '@/features/product-models/api';
import { Card } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';

export function ProductMatchingPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data: unmatchedData, isLoading: isLoadingUnmatched } = useFetchUnmatchedProducts({
    page,
    limit,
    search: search || undefined,
  });

  const formatPrice = (price: number | null) => {
    if (price === null) return '-';
    return new Intl.NumberFormat('ko-KR').format(price) + '원';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">제품 매칭</h1>
        <p className="text-muted-foreground mt-2">
          크롤링된 제품을 제품 모델에 연결하세요
        </p>
      </div>

      {/* 검색 */}
      <div className="flex gap-4">
        <Input
          placeholder="제품명 또는 모델명으로 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* 미매칭 제품 목록 */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          미매칭 제품 ({unmatchedData?.total || 0}개)
        </h2>

        {isLoadingUnmatched && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">제품을 불러오는 중...</p>
          </div>
        )}

        {!isLoadingUnmatched && unmatchedData && (
          <div className="space-y-4">
            {unmatchedData.items.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">미매칭 제품이 없습니다.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  모든 제품이 모델에 연결되었습니다!
                </p>
              </Card>
            ) : (
              <>
                {unmatchedData.items.map((product) => (
                  <Card key={product.id} className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-2">{product.productName}</h3>
                        <div className="flex gap-3 mb-3">
                          {product.site && (
                            <Badge variant="outline">{product.site.name}</Badge>
                          )}
                          {product.extractedModelName && (
                            <Badge>{product.extractedModelName}</Badge>
                          )}
                          {product.brand && (
                            <Badge variant="secondary">{product.brand.name}</Badge>
                          )}
                        </div>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <span>현재가: {formatPrice(product.currentPrice)}</span>
                          {product.currentDiscountPrice && (
                            <span className="text-red-600">
                              할인가: {formatPrice(product.currentDiscountPrice)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          자세히 보기
                        </Button>
                        <Button size="sm">
                          모델에 연결
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}

                {/* 페이지네이션 */}
                {unmatchedData.total > limit && (
                  <div className="flex justify-center gap-2 mt-6">
                    <Button
                      variant="outline"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      이전
                    </Button>
                    <span className="flex items-center px-4">
                      {page} / {unmatchedData.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= unmatchedData.totalPages}
                    >
                      다음
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
