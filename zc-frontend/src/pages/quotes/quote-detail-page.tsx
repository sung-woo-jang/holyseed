import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Button } from '@/shared/ui';
import {
  useFetchQuoteDetail,
  useUpdateQuote,
  useSendQuote,
  useAddQuoteItem,
  useDeleteQuoteItem,
} from '@/features/quotes/api';
import {
  QuoteForm,
  QuoteItemForm,
  QuoteItemList,
  QuoteStatusBadge,
} from '@/features/quotes/ui';
import { type UpdateQuoteDto, type CreateQuoteItemDto } from '@/features/quotes/types';

export function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showItemForm, setShowItemForm] = useState(false);

  const { data: quote, isLoading, isError } = useFetchQuoteDetail(id!);
  const updateQuote = useUpdateQuote(id!);
  const sendQuote = useSendQuote();
  const addItem = useAddQuoteItem(id!);
  const deleteItem = useDeleteQuoteItem(id!);

  const handleUpdateQuote = async (data: UpdateQuoteDto) => {
    try {
      await updateQuote.mutateAsync(data);
      alert('견적서가 수정되었습니다.');
    } catch (error) {
      console.error('견적서 수정 실패:', error);
      alert('견적서 수정에 실패했습니다.');
    }
  };

  const handleSendQuote = async () => {
    if (!confirm('견적서를 발송하시겠습니까?')) return;

    try {
      await sendQuote.mutateAsync(id!);
      alert('견적서가 발송되었습니다.');
    } catch (error) {
      console.error('견적서 발송 실패:', error);
      alert('견적서 발송에 실패했습니다.');
    }
  };

  const handleAddItem = async (data: CreateQuoteItemDto) => {
    try {
      await addItem.mutateAsync(data);
      setShowItemForm(false);
    } catch (error) {
      console.error('항목 추가 실패:', error);
      alert('항목 추가에 실패했습니다.');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      await deleteItem.mutateAsync(itemId);
    } catch (error) {
      console.error('항목 삭제 실패:', error);
      alert('항목 삭제에 실패했습니다.');
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        로딩 중...
      </div>
    );
  }

  if (isError || !quote) {
    return (
      <div className="text-center py-12 text-destructive">
        견적서를 불러오는데 실패했습니다.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{quote.title}</h1>
            <QuoteStatusBadge status={quote.status} />
          </div>
          <p className="text-muted-foreground mt-2">
            견적서 상세 및 편집
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/quotes')}>
            목록으로
          </Button>
          {quote.status === 'draft' && (
            <Button onClick={handleSendQuote} disabled={sendQuote.isPending}>
              {sendQuote.isPending ? '발송 중...' : '발송하기'}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 기본 정보 */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">기본 정보</h2>
          <QuoteForm
            initialData={quote}
            onSubmit={handleUpdateQuote}
            isLoading={updateQuote.isPending}
            submitLabel="수정하기"
          />
        </div>

        {/* 견적 항목 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">견적 항목</h2>
            {!showItemForm && (
              <Button size="sm" onClick={() => setShowItemForm(true)}>
                항목 추가
              </Button>
            )}
          </div>

          {showItemForm && (
            <QuoteItemForm
              onSubmit={handleAddItem}
              onCancel={() => setShowItemForm(false)}
              isLoading={addItem.isPending}
            />
          )}

          <QuoteItemList
            items={quote.items}
            quote={quote}
            onDelete={handleDeleteItem}
            isDeleting={deleteItem.isPending}
          />
        </div>
      </div>

      {/* 메타 정보 */}
      <Card className="p-4 bg-muted/50">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">생성일:</span>{' '}
            {new Date(quote.createdAt).toLocaleString()}
          </div>
          <div>
            <span className="text-muted-foreground">수정일:</span>{' '}
            {new Date(quote.updatedAt).toLocaleString()}
          </div>
        </div>
      </Card>
    </div>
  );
}
