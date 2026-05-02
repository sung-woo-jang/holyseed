export interface ProductModel {
  id: string;
  brandId: string | null;
  modelName: string;
  displayName: string;
  description: string | null;
  specifications: Record<string, string> | null;
  thumbnailUrl: string | null;
  isActive: boolean;
  // 가격 필드
  materialCost: number | null;   // 자재 원가
  laborCost: number | null;      // 시공비
  marginRate: number | null;     // 자재 마진율 (%)
  priceNote: string | null;
  priceUpdatedAt: string | null;
  // derived (서버 계산)
  materialPrice: number | null;  // materialCost × (1 + marginRate/100)
  derivedUnitPrice: number | null; // materialPrice + laborCost
  // 통합 카테고리
  unifiedCategoryId: string | null;
  unifiedCategory?: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
  brand?: {
    id: string;
    name: string;
  } | null;
}

export interface ProductListing {
  id: string;
  siteId: string;
  siteCategoryId: string;
  brandId: string | null;
  siteProductId: string;
  productName: string;
  extractedModelName: string | null;
  currentPrice: number;
  currentDiscountPrice: number | null;
  description: string | null;
  productUrl: string;
  isAvailable: boolean;
  isManual: boolean;
  manualPriceNote: string | null;
  lastCrawledAt: string | null;
  createdAt: string;
  updatedAt: string;
  site?: {
    id: string;
    code: string;
    name: string;
    baseUrl: string;
  };
  siteCategory?: {
    id: string;
    name: string;
    siteCategoryCode: string;
  };
  brand?: {
    id: string;
    name: string;
  } | null;
  images?: Array<{
    id: string;
    originalUrl: string;
    type: string;
    sortOrder: number;
  }>;
}

export interface ProductModelQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  brandId?: string;
  isActive?: boolean;
  minSellingPrice?: number;
  maxSellingPrice?: number;
}

export interface ProductListingQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  brandId?: string;
  siteCode?: string;
}

export interface ProductModelListResponse {
  data: ProductModel[];
  total: number;
}

export interface ProductListingListResponse {
  items: ProductListing[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateProductModelDto {
  brandId?: string;
  modelName: string;
  displayName: string;
  description?: string;
  specifications?: Record<string, string>;
  unifiedCategoryId?: string;
  materialCost?: number;
  laborCost?: number;
  marginRate?: number;
  priceNote?: string;
}

export interface LinkProductDto {
  productListingId: string;
  note?: string;
}

export interface UpdatePriceDto {
  materialCost?: number;
  laborCost?: number;
  marginRate?: number;
  priceNote?: string;
}

export interface CreateManualListingDto {
  siteId: string;
  productName: string;
  currentPrice: number;
  currentDiscountPrice?: number;
  brandId?: string;
  siteCategoryId?: string;
  productUrl?: string;
  manualPriceNote?: string;
}

// 비교 페이지 타입
export interface ModelCompareResponse {
  model: ProductModel;
  listings: Array<{
    id: string;
    siteName: string;
    siteCode: string;
    isManual: boolean;
    currentPrice: number;
    currentDiscountPrice: number | null;
    productUrl: string | null;
    lastCrawledAtOrCreated: string;
    isLowest: boolean;
    manualPriceNote: string | null;
  }>;
  priceHistory: Array<{
    listingId: string;
    siteName: string;
    points: Array<{ recordedAt: string; price: number; discountPrice: number | null }>;
  }>;
  lowestPrice: number | null;
  highestPrice: number | null;
}
