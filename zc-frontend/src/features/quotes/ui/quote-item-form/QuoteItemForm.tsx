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
  isLoading = false
}: QuoteItemFormProps) {
  const [formData, setFormData] = useState({
    productModelId: initialData.productModelId || '',
    productName: initialData.productName || '',
    quantity: initialData.quantity || 1,
    unitPrice: initialData.unitPrice || 0,
    note: initialData.note || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleProductModelSelect = (model: { id: string; modelName: string; price: number }) => {
    setFormData(prev => ({
      ...prev,
      productModelId: model.id,
      productName: model.modelName,
      unitPrice: model.price,
    }));
  };

  const totalPrice = formData.quantity * formData.unitPrice;

  return (
    <Card className="p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">제품 모델 검색</label>
          <ProductModelSelect onSelect={handleProductModelSelect} />
          <p className="text-xs text-muted-foreground mt-1">
            제품 모델을 선택하거나 직접 입력하세요
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              수량 <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 1)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              단가 <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              min="0"
              value={formData.unitPrice}
              onChange={(e) => handleChange('unitPrice', parseInt(e.target.value) || 0)}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">합계</label>
          <div className="text-lg font-semibold">
            {totalPrice.toLocaleString()}원
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
            disabled={isLoading || !formData.productName || formData.quantity < 1 || formData.unitPrice < 0}
          >
            {isLoading ? '저장중...' : '추가'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
