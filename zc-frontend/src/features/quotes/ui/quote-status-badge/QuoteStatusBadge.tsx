import { Badge } from '@/shared/ui';
import { type QuoteStatus } from '@/features/quotes/types';

interface QuoteStatusBadgeProps {
  status: QuoteStatus;
}

const statusConfig: Record<QuoteStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'error' }> = {
  draft: { label: '작성중', variant: 'warning' },
  sent: { label: '발송됨', variant: 'default' },
  accepted: { label: '수락', variant: 'success' },
  rejected: { label: '거절', variant: 'error' },
};

export function QuoteStatusBadge({ status }: QuoteStatusBadgeProps) {
  const config = statusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
