import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  Input,
  Label,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui';
import { useFetchModelDetail } from '@/features/product-models/api/useFetchModelDetail';
import { useFetchLinkedProducts } from '@/features/product-models/api/useFetchLinkedProducts';
import { useUpdatePrice } from '@/features/product-models/api/useUpdatePrice';
import { useCalculateCost } from '@/features/product-models/api/useCalculateCost';
import { useUnlinkProduct } from '@/features/product-models/api/useUnlinkProduct';
import { useLinkProduct } from '@/features/product-models/api/useLinkProduct';
import { useFetchUnmatchedProducts } from '@/features/product-models/api/useFetchUnmatchedProducts';
import type { UpdatePriceDto } from '@/features/product-models/types';

export function ModelDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: model, isLoading: modelLoading } = useFetchModelDetail(id!);
  const { data: linkedProducts, isLoading: productsLoading } = useFetchLinkedProducts(id!);
  const updatePrice = useUpdatePrice();
  const calculateCost = useCalculateCost();
  const unlinkProduct = useUnlinkProduct();
  const linkProduct = useLinkProduct(id!);

  const [editingPrice, setEditingPrice] = useState(false);
  const [priceData, setPriceData] = useState<UpdatePriceDto>({});
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null);

  // 제품 추가 모달 상태
  const [addProductModalOpen, setAddProductModalOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const { data: unmatchedData } = useFetchUnmatchedProducts({ search: productSearch || undefined, limit: 50 });

  // 가격 수정 모드 진입
  const handleStartEditPrice = () => {
    setPriceData({
      costPrice: model?.costPrice ?? undefined,
      sellingPrice: model?.sellingPrice ?? undefined,
      marginRate: model?.marginRate ?? undefined,
      priceNote: model?.priceNote ?? undefined,
    });
    setEditingPrice(true);
  };

  // 가격 수정 저장
  const handleSavePrice = async () => {
    if (!id) return;

    try {
      await updatePrice.mutateAsync({ id, data: priceData });
      setEditingPrice(false);
    } catch (error: any) {
      alert(error.response?.data?.message || '가격 수정에 실패했습니다.');
    }
  };

  // 원가 자동 계산
  const handleCalculateCost = async () => {
    if (!id) return;
    if (!confirm('연결된 제품들의 최저가로 원가를 자동 계산하시겠습니까?')) return;

    try {
      await calculateCost.mutateAsync(id);
      alert('원가가 자동 계산되었습니다.');
    } catch (error: any) {
      alert(error.response?.data?.message || '원가 계산에 실패했습니다.');
    }
  };

  // 제품 연결 해제
  const handleUnlink = async (listingId: string) => {
    if (!id) return;
    if (!confirm('이 제품과의 연결을 해제하시겠습니까?')) return;

    setUnlinkingId(listingId);
    try {
      await unlinkProduct.mutateAsync({ modelId: id, listingId });
    } finally {
      setUnlinkingId(null);
    }
  };

  // 제품 추가 (연결)
  const handleAddProduct = async (productId: string) => {
    if (!id) return;

    try {
      await linkProduct.mutateAsync({ productListingId: productId });
      alert('제품이 연결되었습니다.');
      setAddProductModalOpen(false);
    } catch (error: any) {
      alert(error.response?.data?.message || '제품 연결에 실패했습니다.');
    }
  };

  if (modelLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">모델 정보를 불러오는 중...</p>
      </div>
    );
  }

  if (!model) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">모델을 찾을 수 없습니다.</p>
        <Button onClick={() => navigate('/models')} className="mt-4">
          목록으로
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/models')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{model.displayName}</h1>
          <p className="text-muted-foreground mt-1">모델명: {model.modelName}</p>
        </div>
        <Badge variant={model.isActive ? 'default' : 'secondary'}>
          {model.isActive ? '활성' : '비활성'}
        </Badge>
      </div>

      {/* 모델 기본 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">브랜드</p>
              <p className="font-medium">{model.brand?.name || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">생성일</p>
              <p className="font-medium">
                {new Date(model.createdAt).toLocaleDateString('ko-KR')}
              </p>
            </div>
          </div>
          {model.description && (
            <div>
              <p className="text-sm text-muted-foreground">설명</p>
              <p className="font-medium">{model.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 가격 정보 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>가격 정보</CardTitle>
            <div className="flex gap-2">
              {linkedProducts && linkedProducts.length > 0 && !editingPrice && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCalculateCost}
                  disabled={calculateCost.isPending}
                >
                  {calculateCost.isPending ? '계산 중...' : '원가 자동 계산'}
                </Button>
              )}
              {!editingPrice && (
                <Button size="sm" onClick={handleStartEditPrice}>
                  수정
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {editingPrice ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="costPrice">원가 (원)</Label>
                  <Input
                    id="costPrice"
                    type="number"
                    value={priceData.costPrice ?? ''}
                    onChange={(e) =>
                      setPriceData({
                        ...priceData,
                        costPrice: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sellingPrice">판매가 (원)</Label>
                  <Input
                    id="sellingPrice"
                    type="number"
                    value={priceData.sellingPrice ?? ''}
                    onChange={(e) =>
                      setPriceData({
                        ...priceData,
                        sellingPrice: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priceNote">가격 메모</Label>
                <Input
                  id="priceNote"
                  value={priceData.priceNote ?? ''}
                  onChange={(e) =>
                    setPriceData({
                      ...priceData,
                      priceNote: e.target.value || undefined,
                    })
                  }
                  placeholder="가격 관련 메모"
                />
              </div>

              {priceData.costPrice && priceData.sellingPrice && priceData.costPrice > 0 && (
                <div className="p-4 bg-muted rounded-md">
                  <p className="text-sm font-medium">마진율</p>
                  <p className="text-2xl font-bold text-green-600">
                    {(
                      ((priceData.sellingPrice - priceData.costPrice) / priceData.costPrice) *
                      100
                    ).toFixed(2)}
                    %
                  </p>
                </div>
              )}

              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setEditingPrice(false)}
                  disabled={updatePrice.isPending}
                >
                  취소
                </Button>
                <Button onClick={handleSavePrice} disabled={updatePrice.isPending}>
                  {updatePrice.isPending ? '저장 중...' : '저장'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">원가</p>
                <p className="text-2xl font-bold">
                  {model.costPrice ? `${model.costPrice.toLocaleString()}원` : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">판매가</p>
                <p className="text-2xl font-bold">
                  {model.sellingPrice ? `${model.sellingPrice.toLocaleString()}원` : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">마진율</p>
                <p className="text-2xl font-bold text-green-600">
                  {model.marginRate !== null ? `${model.marginRate.toFixed(2)}%` : '-'}
                </p>
              </div>
              {model.priceNote && (
                <div className="col-span-3">
                  <p className="text-sm text-muted-foreground">가격 메모</p>
                  <p className="text-sm">{model.priceNote}</p>
                </div>
              )}
              {model.priceUpdatedAt && (
                <div className="col-span-3">
                  <p className="text-xs text-muted-foreground">
                    가격 최종 수정: {new Date(model.priceUpdatedAt).toLocaleString('ko-KR')}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 연결된 제품 목록 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>연결된 제품</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {linkedProducts?.length || 0}개
              </span>
              <Dialog open={addProductModalOpen} onOpenChange={setAddProductModalOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    제품 추가
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[600px] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>제품 추가</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {/* 검색 */}
                    <Input
                      placeholder="제품 검색..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                    />

                    {/* 미매칭 제품 목록 */}
                    <div className="space-y-2">
                      {unmatchedData?.items.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-sm">{product.productName}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {product.brand?.name} | {product.site?.name}
                            </div>
                            {product.extractedModelName && (
                              <Badge variant="outline" className="mt-1">
                                {product.extractedModelName}
                              </Badge>
                            )}
                            <div className="text-sm font-medium text-green-600 mt-1">
                              {product.currentDiscountPrice?.toLocaleString() ||
                                product.currentPrice.toLocaleString()}
                              원
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleAddProduct(product.id)}
                            disabled={linkProduct.isPending}
                          >
                            {linkProduct.isPending ? '추가 중...' : '추가'}
                          </Button>
                        </div>
                      ))}

                      {unmatchedData?.items.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                          미매칭 제품이 없습니다
                        </div>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {productsLoading && (
            <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
          )}

          {linkedProducts && linkedProducts.length > 0 ? (
            <div className="space-y-3">
              {linkedProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-4 border rounded-md hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <p className="font-medium">{product.productName}</p>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span>{product.site?.name}</span>
                      <span>{product.brand?.name}</span>
                      <span className="font-medium text-foreground">
                        {product.currentDiscountPrice
                          ? `${product.currentDiscountPrice.toLocaleString()}원`
                          : `${product.currentPrice.toLocaleString()}원`}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleUnlink(product.id)}
                    disabled={unlinkingId === product.id}
                  >
                    {unlinkingId === product.id ? '해제 중...' : '연결 해제'}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              연결된 제품이 없습니다.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
