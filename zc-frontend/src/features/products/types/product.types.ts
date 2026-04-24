// 제품 이미지
export interface ProductImage {
  id: string;
  originalUrl: string;
  type: string;
  sortOrder: number;
}

// 제품 응답
export interface Product {
  id: string;
  siteProductId: string;
  productName: string;
  extractedModelName?: string;
  currentPrice: number;
  currentDiscountPrice?: number;
  description?: string;
  specifications?: Record<string, string>;
  manufacturer?: string;
  origin?: string;
  productUrl: string;
  isAvailable: boolean;
  site?: {
    id: string;
    name: string;
    code: string;
  };
  siteCategory?: {
    id: string;
    name: string;
    siteCategoryCode: string;
  };
  category?: {
    id: string;
    name: string;
  };
  brand?: {
    id: string;
    name: string;
  };
  productImages?: ProductImage[];
  images?: ProductImage[];
  lastCrawledAt: string;
  createdAt: string;
  updatedAt: string;
}

// 제품 목록 응답
export interface ProductListResponse {
  items: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 제품 쿼리 파라미터
export interface ProductQueryParams {
  page?: number;
  limit?: number;
  categoryId?: string;
  brandId?: string;
  siteId?: string;  // 사이트 필터
  siteCode?: string; // 사이트 코드 필터
  hasModel?: boolean;  // 매칭 상태 필터
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  onSale?: boolean;
}
