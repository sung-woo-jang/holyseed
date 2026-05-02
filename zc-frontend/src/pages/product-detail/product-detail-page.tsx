import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Dialog, DialogContent, DialogHeader, DialogTitle, Input, Label } from '@/shared/ui';
import { useFetchProductDetail } from '@/features/products/api/fetch-product-detail';
import { useFetchPriceHistory } from '@/features/products/api/fetch-price-history';
import { useFetchProductModels } from '@/features/product-models/api';
import { useLinkProduct } from '@/features/product-models/api/useLinkProduct';
import { PriceHistoryChart } from '@/features/products/ui/price-history-chart';
import { TrendingDown, TrendingUp, Calendar, Package, Eye, Link } from 'lucide-react';

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(0);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [modelSearch, setModelSearch] = useState('');

  const { data: product, isLoading, isError } = useFetchProductDetail(id!);
  const { data: priceHistory } = useFetchPriceHistory(id!);
  const { data: modelsData } = useFetchProductModels({ search: modelSearch || undefined, limit: 50 });
  const linkProduct = useLinkProduct(selectedModelId);

  // 가격 통계 계산
  const priceStats = useMemo(() => {
    if (!priceHistory || priceHistory.length === 0) return null;

    const prices = priceHistory.map((h) => h.discountPrice || h.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = Math.floor(prices.reduce((a, b) => a + b, 0) / prices.length);
    const currentPrice = product?.currentDiscountPrice || product?.currentPrice || 0;
    const priceChange = prices.length >= 2 ? currentPrice - prices[prices.length - 2] : 0;
    const priceChangePercent =
      prices.length >= 2
        ? ((priceChange / prices[prices.length - 2]) * 100).toFixed(1)
        : '0';

    return {
      minPrice,
      maxPrice,
      avgPrice,
      currentPrice,
      priceChange,
      priceChangePercent,
      isLowest: currentPrice === minPrice,
      isHighest: currentPrice === maxPrice,
    };
  }, [priceHistory, product]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <div className="text-destructive">제품을 불러오는데 실패했습니다.</div>
        <Button onClick={() => navigate('/products')}>목록으로 돌아가기</Button>
      </div>
    );
  }

  const images = product.productImages || [];
  const hasMultipleImages = images.length > 1;
  const hasSpecs = product.specifications && Object.keys(product.specifications).length > 0;

  // 모델 연결 처리
  const handleLinkModel = async () => {
    if (!selectedModelId || !id) {
      alert('모델을 선택해주세요.');
      return;
    }

    try {
      await linkProduct.mutateAsync({
        productListingId: id,
      });
      setLinkModalOpen(false);
      setSelectedModelId('');
      setModelSearch('');
      alert('모델에 연결되었습니다.');
      // 페이지 새로고침 또는 쿼리 무효화
      window.location.reload();
    } catch (error: any) {
      alert(error.response?.data?.message || '모델 연결에 실패했습니다.');
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/products')}>
          ← 목록으로
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold">{product.productName}</h1>
          {product.extractedModelName && (
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              <Package className="w-4 h-4" />
              모델명: {product.extractedModelName}
            </p>
          )}
        </div>
        <Badge variant={product.isAvailable ? 'default' : 'secondary'} className="h-fit">
          {product.isAvailable ? '판매중' : '품절'}
        </Badge>
      </div>

      {/* 가격 통계 카드 */}
      {priceStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">현재 가격</p>
                  <p className="text-2xl font-bold">
                    {priceStats.currentPrice.toLocaleString()}원
                  </p>
                  {priceStats.priceChange !== 0 && (
                    <p
                      className={`text-sm flex items-center gap-1 mt-1 ${
                        priceStats.priceChange > 0 ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {priceStats.priceChange > 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {priceStats.priceChangePercent}%
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">최저가</p>
              <p className="text-2xl font-bold text-green-600">
                {priceStats.minPrice.toLocaleString()}원
              </p>
              {priceStats.isLowest && (
                <Badge variant="outline" className="mt-2 text-green-600 border-green-600">
                  현재 최저가!
                </Badge>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">최고가</p>
              <p className="text-2xl font-bold text-red-600">
                {priceStats.maxPrice.toLocaleString()}원
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">평균가</p>
              <p className="text-2xl font-bold">{priceStats.avgPrice.toLocaleString()}원</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 메인 정보 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 이미지 갤러리 */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="p-6">
              {images.length > 0 ? (
                <div className="space-y-4">
                  {/* 메인 이미지 */}
                  <div className="rounded-lg overflow-hidden border bg-gray-50 aspect-square flex items-center justify-center">
                    <img
                      src={images[selectedImage].originalUrl}
                      alt={product.productName}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>

                  {/* 썸네일 */}
                  {hasMultipleImages && (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {images.map((img, idx) => (
                        <button
                          key={img.id}
                          onClick={() => setSelectedImage(idx)}
                          className={`rounded border-2 overflow-hidden aspect-square transition-all ${
                            selectedImage === idx
                              ? 'border-primary ring-2 ring-primary/20'
                              : 'border-gray-200 hover:border-gray-400'
                          }`}
                        >
                          <img
                            src={img.originalUrl}
                            alt={`${product.productName} ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-square rounded-lg bg-gray-100 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <Package className="w-16 h-16 mx-auto mb-2 opacity-30" />
                    <p>이미지 없음</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 제품 정보 */}
        <div className="space-y-6">
          {/* 가격 */}
          <Card>
            <CardHeader>
              <CardTitle>가격</CardTitle>
            </CardHeader>
            <CardContent>
              {product.currentDiscountPrice ? (
                <div>
                  <div className="text-lg line-through text-muted-foreground">
                    {product.currentPrice.toLocaleString()}원
                  </div>
                  <div className="text-3xl font-bold text-red-600">
                    {product.currentDiscountPrice.toLocaleString()}원
                  </div>
                  <Badge variant="destructive" className="mt-2">
                    할인중
                  </Badge>
                </div>
              ) : (
                <div className="text-3xl font-bold">
                  {product.currentPrice.toLocaleString()}원
                </div>
              )}
            </CardContent>
          </Card>

          {/* 기본 정보 */}
          <Card>
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">브랜드</span>
                <span className="font-medium">{product.brand?.name || '-'}</span>
              </div>

              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">카테고리</span>
                <span className="font-medium">{product.siteCategory?.name || '-'}</span>
              </div>

              {product.manufacturer && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">제조사</span>
                  <span className="font-medium">{product.manufacturer}</span>
                </div>
              )}

              {product.origin && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">원산지</span>
                  <span className="font-medium">{product.origin}</span>
                </div>
              )}

              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">상품 ID</span>
                <span className="font-mono text-sm">{product.siteProductId}</span>
              </div>

              <div className="flex justify-between py-2">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  마지막 업데이트
                </span>
                <span className="text-xs">
                  {new Date(product.lastCrawledAt).toLocaleString('ko-KR', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 모델 연결 */}
          <Card>
            <CardHeader>
              <CardTitle>모델 연결</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => setLinkModalOpen(true)}
              >
                <Link className="w-4 h-4 mr-2" />
                모델에 연결하기
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                이 제품을 ProductModel에 연결하여 가격 관리를 시작하세요
              </p>
            </CardContent>
          </Card>

          {/* 사이트 링크 */}
          <a href={product.productUrl} target="_blank" rel="noopener noreferrer">
            <Button className="w-full" size="lg">
              <Eye className="w-4 h-4 mr-2" />
              Dasis 사이트에서 보기
            </Button>
          </a>
        </div>
      </div>

      {/* 모델 연결 모달 */}
      <Dialog open={linkModalOpen} onOpenChange={setLinkModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>모델에 연결</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 flex-1 overflow-y-auto">
            {/* 검색 */}
            <div className="space-y-2">
              <Label htmlFor="modelSearch">모델 검색</Label>
              <Input
                id="modelSearch"
                placeholder="모델명 또는 표시명으로 검색..."
                value={modelSearch}
                onChange={(e) => setModelSearch(e.target.value)}
              />
            </div>

            {/* 모델 목록 */}
            <div className="space-y-2">
              <Label>모델 선택</Label>
              <div className="border rounded-md divide-y max-h-96 overflow-y-auto">
                {modelsData && modelsData.data.length > 0 ? (
                  modelsData.data.map((model) => (
                    <label
                      key={model.id}
                      className={`flex items-start gap-3 p-3 cursor-pointer hover:bg-muted transition ${
                        selectedModelId === model.id ? 'bg-primary/10' : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="model"
                        value={model.id}
                        checked={selectedModelId === model.id}
                        onChange={() => setSelectedModelId(model.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{model.displayName}</div>
                        <div className="text-sm text-muted-foreground">
                          {model.modelName}
                        </div>
                        {model.derivedUnitPrice != null && (
                          <div className="text-sm text-muted-foreground mt-1">
                            견적단가: {model.derivedUnitPrice.toLocaleString()}원
                          </div>
                        )}
                      </div>
                    </label>
                  ))
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    {modelSearch ? '검색 결과가 없습니다.' : '등록된 모델이 없습니다.'}
                  </div>
                )}
              </div>
            </div>

            {/* 새 모델 생성 안내 */}
            <div className="p-3 bg-muted rounded-md text-sm">
              <p className="text-muted-foreground">
                원하는 모델이 없나요?{' '}
                <button
                  onClick={() => {
                    navigate('/models/new');
                  }}
                  className="text-primary underline"
                >
                  새 모델 만들기
                </button>
              </p>
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex gap-2 justify-end pt-4 border-t mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setLinkModalOpen(false);
                setSelectedModelId('');
                setModelSearch('');
              }}
            >
              취소
            </Button>
            <Button
              onClick={handleLinkModel}
              disabled={!selectedModelId || linkProduct.isPending}
            >
              {linkProduct.isPending ? '연결 중...' : '연결하기'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 제품 설명 */}
      {product.description && (
        <Card>
          <CardHeader>
            <CardTitle>제품 설명</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">
              {product.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* 스펙 */}
      {hasSpecs && (
        <Card>
          <CardHeader>
            <CardTitle>제품 스펙</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(product.specifications!).map(([key, value]) => (
                <div key={key} className="flex justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">{key}</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 가격 이력 차트 */}
      <Card>
        <CardHeader>
          <CardTitle>가격 이력</CardTitle>
        </CardHeader>
        <CardContent>
          {priceHistory && priceHistory.length > 0 ? (
            <PriceHistoryChart data={priceHistory} />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              가격 이력 데이터가 없습니다.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
