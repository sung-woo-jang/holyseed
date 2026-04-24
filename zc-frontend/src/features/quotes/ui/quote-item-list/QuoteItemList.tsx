import { Button, Card } from '@/shared/ui';
import { type QuoteItem } from '@/features/quotes/types';

interface QuoteItemListProps {
  items: QuoteItem[];
  onDelete?: (itemId: string) => void;
  isDeleting?: boolean;
}

export function QuoteItemList({ items, onDelete, isDeleting = false }: QuoteItemListProps) {
  const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);

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
                      <span className="font-medium text-sm text-muted-foreground">
                        #{index + 1}
                      </span>
                      <span className="font-semibold">{item.productName}</span>
                    </div>

                    <div className="mt-1 text-sm text-muted-foreground">
                      수량: {item.quantity}개 × {item.unitPrice.toLocaleString()}원
                    </div>

                    {item.note && (
                      <div className="mt-1 text-sm text-muted-foreground">
                        메모: {item.note}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-semibold">
                        {item.totalPrice.toLocaleString()}원
                      </div>
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

          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-lg">총 금액</span>
              <span className="text-xl font-bold text-primary">
                {totalAmount.toLocaleString()}원
              </span>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
