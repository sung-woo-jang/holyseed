// 사이트별 크롤링 카테고리
export interface Category {
  id: string;
  name: string;
  siteCategoryCode: string;
  level: number;
  parentId?: string;
  url: string;
  siteId?: string;
  unifiedCategoryId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryTreeItem extends Category {
  children?: CategoryTreeItem[];
  productCount?: number;
}

// 사용자 정의 통합 카테고리
export interface UnifiedCategory {
  id: string;
  name: string;
  parentId: string | null;
  level: number;
  sortOrder: number;
  description: string | null;
  mappedSiteCategoryCount?: number;
  children?: UnifiedCategory[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateUnifiedCategoryDto {
  name: string;
  parentId?: string;
  sortOrder?: number;
  description?: string;
}

export interface UpdateUnifiedCategoryDto {
  name?: string;
  parentId?: string;
  sortOrder?: number;
  description?: string;
}
