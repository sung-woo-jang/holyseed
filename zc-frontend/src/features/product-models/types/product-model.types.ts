export interface ProductModel {
  id: string;
  brandId: string | null;
  modelName: string;
  displayName: string;
  description: string | null;
  specifications: Record<string, string> | null;
  thumbnailUrl: string | null;
  isActive: boolean;
  costPrice: number | null;
  sellingPrice: number | null;
  marginRate: number | null;
  priceNote: string | null;
  priceUpdatedAt: string | null;
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
  lastCrawledAt: string;
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
  costPrice?: number;
  sellingPrice?: number;
}

export interface LinkProductDto {
  productListingId: string;
  note?: string;
}

export interface UpdatePriceDto {
  costPrice?: number;
  sellingPrice?: number;
  marginRate?: number;
  priceNote?: string;
}
