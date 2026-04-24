export interface PriceUpdate {
  id: string;
  productName: string;
  siteName: string;
  price: number;
  discountPrice: number | null;
  recordedAt: string;
}

export interface StatsOverview {
  totalProducts: number;
  matchedProducts: number;
  unmatchedProducts: number;
  totalModels: number;
  totalBrands: number;
  recentPriceUpdates: PriceUpdate[];
}

export interface StatsResponse {
  success: boolean;
  message: string;
  data: StatsOverview;
  timestamp: string;
}
