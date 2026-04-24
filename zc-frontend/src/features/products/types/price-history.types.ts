export interface PriceHistoryItem {
  id: string;
  price: number;
  discountPrice?: number;
  crawledAt: string;
  createdAt: string;
}

export interface PriceHistoryQueryParams {
  startDate?: string; // ISO 8601
  endDate?: string;   // ISO 8601
}

export type DateRangeFilter = '7days' | '30days' | '90days' | 'all';
