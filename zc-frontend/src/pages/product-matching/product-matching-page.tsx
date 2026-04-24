import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Input, Label } from '@/shared/ui';
import { useFetchStats } from '@/features/stats/api/useFetchStats';
import { useFetchUnmatchedProducts } from '@/features/product-models/api/useFetchUnmatchedProducts';
import { useFetchProductModels } from '@/features/product-models/api/useFetchProductModels';
import { useCreateProductModel } from '@/features/product-models/api/useCreateProductModel';
import { useLinkProduct } from '@/features/product-models/api/useLinkProduct';
import { useFetchSites } from '@/features/sites/api/fetch-sites';

type MatchMode = 'select' | 'create';

export function ProductMatchingPage() {
  const { data: stats } = useFetchStats();
  const { data: unmatchedData, isLoading: isLoadingUnmatched } = useFetchUnmatchedProducts({ page: 1, limit: 100 });
  const { data: sites } = useFetchSites();

  // 선택된 제품 ID 배열
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());

  // 모델 선택 모드
  const [matchMode, setMatchMode] = useState<MatchMode>('select');

  // 모델 검색
  const [modelSearch, setModelSearch] = useState('');
  const { data: modelsData } = useFetchProductModels({ search: modelSearch || undefined, limit: 20 });

  // 선택된 모델
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);

  // 새 모델 생성 폼
  const [newModelForm, setNewModelForm] = useState({
    modelName: '',
    displayName: '',
    description: '',
  });

  const createModel = useCreateProductModel();
  const linkProduct = useLinkProduct(selectedModelId || '');

  // 사이트 필터
  const [siteFilter, setSiteFilter] = useState<string>('all');

  // 체크박스 토글
  const toggleProduct = (id: string) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // 전체 선택/해제
  const toggleAll = () => {
    if (!unmatchedData) return;
    const filtered = getFilteredProducts();

    if (selectedProductIds.size === filtered.length) {
      setSelectedProductIds(new Set());
    } else {
      setSelectedProductIds(new Set(filtered.map((p) => p.id)));
    }
  };

  // 필터링된 제품 목록
  const getFilteredProducts = () => {
    if (!unmatchedData) return [];

    return unmatchedData.items.filter((product) => {
      if (siteFilter === 'all') return true;
      return product.site?.code === siteFilter;
    });
  };

  // 새 모델 생성 후 연결
  const handleCreateAndLink = async () => {
    if (!newModelForm.modelName || !newModelForm.displayName) {
      alert('모델명과 표시명을 입력하세요.');
      return;
    }

    if (selectedProductIds.size === 0) {
      alert('연결할 제품을 선택하세요.');
      return;
    }

    try {
      // 1. 모델 생성
      await createModel.mutateAsync({
        modelName: newModelForm.modelName,
        displayName: newModelForm.displayName,
        description: newModelForm.description || undefined,
      });

      // 2. 선택된 제품들 순차 연결
      for (const productId of Array.from(selectedProductIds)) {
        await linkProduct.mutateAsync({ productListingId: productId });
      }

      alert(`${selectedProductIds.size}개 제품이 새 모델에 연결되었습니다.`);
      setSelectedProductIds(new Set());
      setNewModelForm({ modelName: '', displayName: '', description: '' });
    } catch (error) {
      console.error('연결 실패:', error);
      alert('연결에 실패했습니다.');
    }
  };

  // 기존 모델에 연결
  const handleLinkToModel = async () => {
    if (!selectedModelId) {
      alert('모델을 선택하세요.');
      return;
    }

    if (selectedProductIds.size === 0) {
      alert('연결할 제품을 선택하세요.');
      return;
    }

    try {
      // 선택된 제품들 순차 연결
      for (const productId of Array.from(selectedProductIds)) {
        await linkProduct.mutateAsync({ productListingId: productId });
      }

      alert(`${selectedProductIds.size}개 제품이 모델에 연결되었습니다.`);
      setSelectedProductIds(new Set());
      setSelectedModelId(null);
    } catch (error) {
      console.error('연결 실패:', error);
      alert('연결에 실패했습니다.');
    }
  };

  const filteredProducts = getFilteredProducts();

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-3xl font-bold">제품 매칭</h1>
        <p className="text-muted-foreground mt-2">
          미매칭 제품을 선택하고 모델에 연결하세요
        </p>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">총 제품</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.totalProducts ?? 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">매칭 완료</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {stats?.matchedProducts ?? 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">미매칭</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-600">
              {stats?.unmatchedProducts ?? 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 2-Panel 레이아웃 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 좌측: 미매칭 제품 목록 */}
        <Card>
          <CardHeader>
            <CardTitle>미매칭 제품 ({selectedProductIds.size}개 선택)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 사이트 필터 */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={siteFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setSiteFilter('all')}
              >
                전체
              </Button>
              {sites?.filter(s => s.isActive).map((site) => (
                <Button
                  key={site.id}
                  size="sm"
                  variant={siteFilter === site.code ? 'default' : 'outline'}
                  onClick={() => setSiteFilter(site.code)}
                >
                  {site.name}
                </Button>
              ))}
            </div>

            {/* 전체 선택 */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filteredProducts.length > 0 && selectedProductIds.size === filteredProducts.length}
                  onChange={toggleAll}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">전체 선택</span>
              </label>
            </div>

            {/* 제품 목록 */}
            <div className="max-h-[500px] overflow-y-auto space-y-2">
              {isLoadingUnmatched && (
                <div className="text-center py-12 text-muted-foreground">로딩 중...</div>
              )}

              {filteredProducts.map((product) => (
                <label
                  key={product.id}
                  className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedProductIds.has(product.id)}
                    onChange={() => toggleProduct(product.id)}
                    className="w-4 h-4 mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{product.productName}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {product.brand?.name} | {product.site?.name}
                    </div>
                    {product.extractedModelName && (
                      <Badge variant="outline" className="mt-1">{product.extractedModelName}</Badge>
                    )}
                    <div className="text-sm font-medium text-green-600 mt-1">
                      {product.currentDiscountPrice?.toLocaleString() || product.currentPrice.toLocaleString()}원
                    </div>
                  </div>
                </label>
              ))}

              {filteredProducts.length === 0 && !isLoadingUnmatched && (
                <div className="text-center py-12 text-muted-foreground">
                  미매칭 제품이 없습니다
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 우측: 모델 선택/생성 */}
        <Card>
          <CardHeader>
            <CardTitle>모델 선택/생성</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 모드 선택 */}
            <div className="flex gap-2">
              <Button
                variant={matchMode === 'select' ? 'default' : 'outline'}
                onClick={() => setMatchMode('select')}
              >
                기존 모델 선택
              </Button>
              <Button
                variant={matchMode === 'create' ? 'default' : 'outline'}
                onClick={() => setMatchMode('create')}
              >
                새 모델 생성
              </Button>
            </div>

            {/* 기존 모델 선택 */}
            {matchMode === 'select' && (
              <div className="space-y-4">
                {/* 검색 */}
                <Input
                  placeholder="모델 검색..."
                  value={modelSearch}
                  onChange={(e) => setModelSearch(e.target.value)}
                />

                {/* 모델 목록 */}
                <div className="max-h-[400px] overflow-y-auto space-y-2">
                  {modelsData?.data.map((model) => (
                    <label
                      key={model.id}
                      className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedModelId === model.id ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="model"
                        checked={selectedModelId === model.id}
                        onChange={() => setSelectedModelId(model.id)}
                        className="w-4 h-4 mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{model.displayName}</div>
                        <div className="text-xs text-muted-foreground">{model.modelName}</div>
                        {model.brand && (
                          <Badge variant="outline" className="mt-1">{model.brand.name}</Badge>
                        )}
                      </div>
                    </label>
                  ))}

                  {modelsData?.data.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      모델이 없습니다
                    </div>
                  )}
                </div>

                {/* 연결 버튼 */}
                <Button
                  onClick={handleLinkToModel}
                  disabled={!selectedModelId || selectedProductIds.size === 0 || linkProduct.isPending}
                  className="w-full"
                >
                  {linkProduct.isPending
                    ? '연결 중...'
                    : `선택한 ${selectedProductIds.size}개 제품 연결`}
                </Button>
              </div>
            )}

            {/* 새 모델 생성 */}
            {matchMode === 'create' && (
              <div className="space-y-4">
                <div>
                  <Label>모델명 *</Label>
                  <Input
                    value={newModelForm.modelName}
                    onChange={(e) => setNewModelForm({ ...newModelForm, modelName: e.target.value })}
                    placeholder="예: WL900-NS"
                  />
                </div>

                <div>
                  <Label>표시명 *</Label>
                  <Input
                    value={newModelForm.displayName}
                    onChange={(e) => setNewModelForm({ ...newModelForm, displayName: e.target.value })}
                    placeholder="예: 세면대 WL900"
                  />
                </div>

                <div>
                  <Label>설명</Label>
                  <Input
                    value={newModelForm.description}
                    onChange={(e) => setNewModelForm({ ...newModelForm, description: e.target.value })}
                    placeholder="모델 설명 (선택)"
                  />
                </div>

                {/* 생성 및 연결 버튼 */}
                <Button
                  onClick={handleCreateAndLink}
                  disabled={
                    !newModelForm.modelName ||
                    !newModelForm.displayName ||
                    selectedProductIds.size === 0 ||
                    createModel.isPending ||
                    linkProduct.isPending
                  }
                  className="w-full"
                >
                  {createModel.isPending || linkProduct.isPending
                    ? '처리 중...'
                    : `새 모델 생성 후 ${selectedProductIds.size}개 제품 연결`}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
