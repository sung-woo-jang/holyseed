import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui';
import { useCreateProductModel } from '@/features/product-models/api/useCreateProductModel';
import { useFetchBrands } from '@/features/brands/api/fetch-brands';
import type { CreateProductModelDto } from '@/features/product-models/types';

export function ModelCreatePage() {
  const navigate = useNavigate();
  const createModel = useCreateProductModel();
  const { data: brands } = useFetchBrands();

  const [formData, setFormData] = useState<CreateProductModelDto>({
    modelName: '',
    displayName: '',
    brandId: undefined,
    description: undefined,
    costPrice: undefined,
    sellingPrice: undefined,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.modelName || !formData.displayName) {
      alert('모델명과 표시명은 필수 입력 항목입니다.');
      return;
    }

    try {
      const result = await createModel.mutateAsync(formData);
      navigate(`/models/${result.id}`);
    } catch (error: any) {
      console.error('모델 생성 실패:', error);
      alert(error.response?.data?.message || '모델 생성에 실패했습니다.');
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">새 모델 생성</h1>
          <p className="text-muted-foreground mt-2">
            제품 모델 정보를 입력하세요
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/models')}>
          목록으로
        </Button>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 모델명 */}
          <div className="space-y-2">
            <Label htmlFor="modelName" className="required">
              모델명 *
            </Label>
            <Input
              id="modelName"
              value={formData.modelName}
              onChange={(e) =>
                setFormData({ ...formData, modelName: e.target.value })
              }
              placeholder="예: CLBXB0200BR"
              required
            />
            <p className="text-sm text-muted-foreground">
              고유한 모델 식별자 (제조사 모델명)
            </p>
          </div>

          {/* 표시명 */}
          <div className="space-y-2">
            <Label htmlFor="displayName" className="required">
              표시명 *
            </Label>
            <Input
              id="displayName"
              value={formData.displayName}
              onChange={(e) =>
                setFormData({ ...formData, displayName: e.target.value })
              }
              placeholder="예: 클랑 욕실장"
              required
            />
            <p className="text-sm text-muted-foreground">
              사용자에게 표시되는 이름
            </p>
          </div>

          {/* 브랜드 */}
          <div className="space-y-2">
            <Label htmlFor="brandId">브랜드</Label>
            <Select
              value={formData.brandId || ''}
              onValueChange={(value) =>
                setFormData({ ...formData, brandId: value || undefined })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="브랜드 선택 (선택사항)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">선택 안 함</SelectItem>
                {brands?.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 설명 */}
          <div className="space-y-2">
            <Label htmlFor="description">설명</Label>
            <textarea
              id="description"
              className="w-full min-h-[100px] px-3 py-2 border rounded-md"
              value={formData.description || ''}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value || undefined })
              }
              placeholder="제품 설명을 입력하세요"
            />
          </div>

          {/* 가격 정보 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="costPrice">원가 (원)</Label>
              <Input
                id="costPrice"
                type="number"
                value={formData.costPrice ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    costPrice: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sellingPrice">판매가 (원)</Label>
              <Input
                id="sellingPrice"
                type="number"
                value={formData.sellingPrice ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    sellingPrice: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                placeholder="0"
              />
            </div>
          </div>

          {/* 마진율 계산 표시 */}
          {formData.costPrice && formData.sellingPrice && formData.costPrice > 0 && (
            <div className="p-4 bg-muted rounded-md">
              <p className="text-sm font-medium">예상 마진율</p>
              <p className="text-2xl font-bold text-green-600">
                {(
                  ((formData.sellingPrice - formData.costPrice) / formData.costPrice) *
                  100
                ).toFixed(2)}
                %
              </p>
            </div>
          )}

          {/* 버튼 */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/models')}
            >
              취소
            </Button>
            <Button type="submit" disabled={createModel.isPending}>
              {createModel.isPending ? '생성 중...' : '생성하기'}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-4 bg-muted/50">
        <p className="text-sm text-muted-foreground">
          💡 모델 생성 후 상세 페이지에서 제품을 연결하고 가격을 자동 계산할 수 있습니다.
        </p>
      </Card>
    </div>
  );
}
