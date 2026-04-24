import { useState } from 'react';
import { Button, Input, Card } from '@/shared/ui';
import { type CreateQuoteDto, type UpdateQuoteDto } from '@/features/quotes/types';

interface QuoteFormProps {
  initialData?: Partial<CreateQuoteDto | UpdateQuoteDto>;
  onSubmit: (data: CreateQuoteDto | UpdateQuoteDto) => void | Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
}

export function QuoteForm({
  initialData = {},
  onSubmit,
  isLoading = false,
  submitLabel = '저장'
}: QuoteFormProps) {
  const [formData, setFormData] = useState({
    title: initialData.title || '',
    customerName: initialData.customerName || '',
    customerPhone: initialData.customerPhone || '',
    memo: initialData.memo || '',
    validUntil: initialData.validUntil || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            제목 <span className="text-red-500">*</span>
          </label>
          <Input
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="견적서 제목"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">고객명</label>
            <Input
              value={formData.customerName}
              onChange={(e) => handleChange('customerName', e.target.value)}
              placeholder="고객명"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">연락처</label>
            <Input
              value={formData.customerPhone}
              onChange={(e) => handleChange('customerPhone', e.target.value)}
              placeholder="010-0000-0000"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">유효기한</label>
          <Input
            type="date"
            value={formData.validUntil}
            onChange={(e) => handleChange('validUntil', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">메모</label>
          <textarea
            className="w-full min-h-[100px] px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            value={formData.memo}
            onChange={(e) => handleChange('memo', e.target.value)}
            placeholder="메모 (선택)"
          />
        </div>

        <div className="flex gap-2 justify-end">
          <Button type="submit" disabled={isLoading || !formData.title}>
            {isLoading ? '저장중...' : submitLabel}
          </Button>
        </div>
      </form>
    </Card>
  );
}
