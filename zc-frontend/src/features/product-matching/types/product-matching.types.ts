// 제품 모델
export interface ProductModel {
  id: string;
  brandId: string;
  modelName: string;
  displayName: string;
  description?: string;
  specifications?: Record<string, unknown>;
  thumbnailUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  brand?: {
    id: string;
    name: string;
  };
}

// 제품 모델 링크
export interface ProductModelLink {
  id: string;
  listingId: string;
  modelId: string;
  matchType: 'auto_matched' | 'manual_matched';
  matchConfidence: number | null;
  linkedAt: string;
  linkedBy: string | null;
  createdAt?: string;
  updatedAt?: string;
  listing?: {
    id: string;
    productName: string;
    currentPrice: number;
    currentDiscountPrice?: number;
    site?: { id: string; name: string; code: string };
    brand?: { id: string; name: string };
  };
  model?: ProductModel;
}

export interface ModelLinkSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  matchType?: 'auto_matched' | 'manual_matched' | '';
}

export interface ModelLinkSearchResponse {
  data: ProductModelLink[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 미매칭 제품 (ProductListing without link)
export interface UnmatchedProduct {
  id: string;
  productName: string;
  extractedModelName?: string;
  currentPrice: number;
  currentDiscountPrice?: number;
  brand?: {
    id: string;
    name: string;
  };
  category?: {
    id: string;
    name: string;
  };
}

// 매칭 생성 DTO
export interface CreateModelLinkDto {
  listingId: string;
  modelId: string;
  confidence: number;
}
