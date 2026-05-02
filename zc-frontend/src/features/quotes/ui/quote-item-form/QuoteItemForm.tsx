import { useState } from 'react';
import { Button, Input, Card } from '@/shared/ui';
import { type CreateQuoteItemDto } from '@/features/quotes/types';
import { ProductModelSelect } from '../product-model-select';

interface QuoteItemFormProps {
  initialData?: Partial<CreateQuoteItemDto>;
  onSubmit: (data: CreateQuoteItemDto) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function QuoteItemForm({
  initialData = {},
  onSubmit,
  onCancel,
  isLoading = false,
}: QuoteItemFormProps) {
  const [formData, setFormData] = useState({
    productModelId: initialData.productModelId || '',
    productName: initialData.productName || '',
    quantity: initialData.quantity || 1,
    materialPrice: initialData.materialPrice ?? 0,
    laborPrice: initialData.laborPrice ?? 0,
    note: initialData.note || '',
  });

  const unitPrice = formData.materialPrice + formData.laborPrice;
  const totalPrice = formData.quantity * unitPrice;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      unitPrice,
    });
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleProductModelSelect = (model: {
    id: string;
    modelName: string;
    displayName: string;
    materialPrice: number;
    laborCost: number;
    derivedUnitPrice: number;
  }) => {
    setFormData((prev) => ({
      ...prev,
      productModelId: model.id,
      productName: model.displayName || model.modelName,
      materialPrice: model.materialPrice,
      laborPrice: model.laborCost,
    }));
  };

  return (
    <Card className="p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">제품 모델 검색</label>
          <ProductModelSelect onSelect={handleProductModelSelect} />
          <p className="text-xs text-muted-foreground mt-1">
            선택 시 자재단가/시공비 자동 채움
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            제품명 <span className="text-red-500">*</span>
          </label>
          <Input
            value={formData.productName}
            onChange={(e) => handleChange('productName', e.target.value)}
            placeholder="제품명"
            required
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">수량</label>
            <Input
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 1)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">자재단가 (원)</label>
            <Input
              type="number"
              min="0"
              value={formData.materialPrice}
              onChange={(e) => handleChange('materialPrice', parseInt(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">시공비 (원)</label>
            <Input
              type="number"
              min="0"
              value={formData.laborPrice}
              onChange={(e) => handleChange('laborPrice', parseInt(e.target.value) || 0)}
            />
          </div>
        </div>

        <div className="rounded-md bg-muted/50 p-3 text-sm space-y-1">
          <div className="flex justify-between text-muted-foreground">
            <span>견적 단가</span>
            <span>{unitPrice.toLocaleString()}원</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>소계 ({formData.quantity}개)</span>
            <span>{totalPrice.toLocaleString()}원</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">메모</label>
          <Input
            value={formData.note}
            onChange={(e) => handleChange('note', e.target.value)}
            placeholder="항목 메모 (선택)"
          />
        </div>

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            취소
          </Button>
          <Button
            type="submit"
            disabled={isLoading || !formData.productName || formData.quantity < 1}
          >
            {isLoading ? '저장중...' : '추가'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
