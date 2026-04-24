import { useNavigate } from 'react-router-dom';
import { Card, Button } from '@/shared/ui';
import { QuoteForm } from '@/features/quotes/ui';
import { useCreateQuote } from '@/features/quotes/api';
import { type CreateQuoteDto, type UpdateQuoteDto } from '@/features/quotes/types';

export function QuoteCreatePage() {
  const navigate = useNavigate();
  const createQuote = useCreateQuote();

  const handleSubmit = async (data: CreateQuoteDto | UpdateQuoteDto) => {
    try {
      const result = await createQuote.mutateAsync(data as CreateQuoteDto);
      // 생성 후 상세 페이지로 이동
      navigate(`/quotes/${result.id}`);
    } catch (error) {
      console.error('견적서 생성 실패:', error);
      alert('견적서 생성에 실패했습니다.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">새 견적서 생성</h1>
          <p className="text-muted-foreground mt-2">
            견적서 기본 정보를 입력하세요
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/quotes')}>
          목록으로
        </Button>
      </div>

      {/* 견적서 폼 */}
      <QuoteForm
        onSubmit={handleSubmit}
        isLoading={createQuote.isPending}
        submitLabel="생성하기"
      />

      <Card className="p-4 bg-muted/50">
        <p className="text-sm text-muted-foreground">
          💡 견적서를 생성한 후 상세 페이지에서 항목을 추가할 수 있습니다.
        </p>
      </Card>
    </div>
  );
}
