import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useFetchProductModels } from '@/features/product-models/api';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Badge } from '@/shared/ui/badge';
import { Card } from '@/shared/ui/card';

export function ModelsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading } = useFetchProductModels({
    page,
    limit,
    search: search || undefined,
  });

  const formatPrice = (price: number | null) => {
    if (price === null) return '-';
    return new Intl.NumberFormat('ko-KR').format(price) + '원';
  };

  const formatMargin = (margin: number | null) => {
    if (margin === null) return '-';
    return `${margin.toFixed(2)}%`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">제품 모델 관리</h1>
          <p className="text-muted-foreground mt-2">
            여러 사이트의 제품을 하나의 모델로 관리하고 판매가를 설정하세요
          </p>
        </div>
        <Button onClick={() => navigate('/models/new')}>
          <Plus className="mr-2 h-4 w-4" />
          새 모델 추가
        </Button>
      </div>

      {/* 검색 */}
      <div className="flex gap-4">
        <Input
          placeholder="모델명 또는 표시명으로 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* 로딩 상태 */}
      {isLoading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">모델 목록을 불러오는 중...</p>
        </div>
      )}

      {/* 모델 목록 */}
      {!isLoading && data && (
        <div className="space-y-4">
          {data.data.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">등록된 모델이 없습니다.</p>
              <Button className="mt-4" onClick={() => navigate('/models/new')}>
                첫 모델 추가하기
              </Button>
            </Card>
          ) : (
            <>
              {data.data.map((model) => (
                <Card
                  key={model.id}
                  className="p-6 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/models/${model.id}`)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{model.displayName}</h3>
                        <Badge variant={model.isActive ? 'default' : 'secondary'}>
                          {model.isActive ? '활성' : '비활성'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        모델명: {model.modelName}
                      </p>
                      {model.description && (
                        <p className="text-sm text-muted-foreground">{model.description}</p>
                      )}
                    </div>

                    <div className="text-right space-y-1">
                      <div className="text-sm">
                        <span className="text-muted-foreground">원가:</span>{' '}
                        <span className="font-medium">{formatPrice(model.costPrice)}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">판매가:</span>{' '}
                        <span className="font-medium">{formatPrice(model.sellingPrice)}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">마진율:</span>{' '}
                        <span className="font-medium text-green-600">
                          {formatMargin(model.marginRate)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}

              {/* 페이지네이션 */}
              {data.total > limit && (
                <div className="flex justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    이전
                  </Button>
                  <span className="flex items-center px-4">
                    {page} / {Math.ceil(data.total / limit)}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= Math.ceil(data.total / limit)}
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
  );
}
