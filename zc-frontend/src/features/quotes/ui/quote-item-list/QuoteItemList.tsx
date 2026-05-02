import { Button, Card } from '@/shared/ui';
import { type Quote, type QuoteItem } from '@/features/quotes/types';

interface QuoteItemListProps {
  items: QuoteItem[];
  quote?: Quote;
  onDelete?: (itemId: string) => void;
  isDeleting?: boolean;
}

export function QuoteItemList({ items, quote, onDelete, isDeleting = false }: QuoteItemListProps) {
  const materialSubtotal = quote?.materialSubtotal
    ?? items.reduce((s, i) => s + (i.materialPrice ?? 0) * i.quantity, 0);
  const laborSubtotal = quote?.laborSubtotal
    ?? items.reduce((s, i) => s + (i.laborPrice ?? 0) * i.quantity, 0);
  const totalAmount = materialSubtotal + laborSubtotal;

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4">견적 항목</h3>

      {items.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          견적 항목이 없습니다. 항목을 추가해주세요.
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="border rounded-md p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-muted-foreground">#{index + 1}</span>
                      <span className="font-semibold">{item.productName}</span>
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground space-y-0.5">
                      <div>수량: {item.quantity}개</div>
                      <div className="flex gap-3">
                        <span>자재단가: {(item.materialPrice ?? 0).toLocaleString()}원</span>
                        <span>시공비: {(item.laborPrice ?? 0).toLocaleString()}원</span>
                        <span>→ 견적단가: {item.unitPrice.toLocaleString()}원</span>
                      </div>
                    </div>
                    {item.note && (
                      <div className="mt-1 text-xs text-muted-foreground">메모: {item.note}</div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-semibold">{item.totalPrice.toLocaleString()}원</div>
                    </div>
                    {onDelete && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onDelete(item.id)}
                        disabled={isDeleting}
                      >
                        삭제
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>자재 소계</span>
              <span>{materialSubtotal.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>시공 소계</span>
              <span>{laborSubtotal.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="font-semibold text-lg">합계</span>
              <span className="text-xl font-bold text-primary">{totalAmount.toLocaleString()}원</span>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
