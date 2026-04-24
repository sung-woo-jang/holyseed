/**
 * 카테고리 정보
 */
export interface Category {
  id: string
  name: string
  url: string
  parentId?: string
  level: number // 1: 대분류, 2: 중분류, 3: 소분류
}

/**
 * 제품 기본 정보 (목록 페이지에서 수집)
 */
export interface ProductBasic {
  goodsNo: string // 제품 고유 번호
  name: string // 제품명
  brandName?: string // 브랜드명
  modelName?: string // 모델명
  price: number // 가격
  discountPrice?: number // 할인가
  thumbnailUrl: string // 대표 이미지 URL
  detailPageUrl: string // 상세 페이지 URL
  categoryId: string // 카테고리 ID
}

/**
 * 제품 상세 정보 (상세 페이지에서 수집)
 */
export interface ProductDetail extends ProductBasic {
  description?: string // 제품 설명
  detailedDescription?: string // 상세 설명 (HTML)
  specifications?: Record<string, string> // 스펙 정보
  additionalImages: string[] // 추가 이미지 URL 배열
  stock?: number // 재고
  deliveryFee?: number // 배송비
  manufacturer?: string // 제조사
  origin?: string // 원산지
}

/**
 * 이미지 다운로드 정보
 */
export interface ImageDownload {
  productGoodsNo: string
  url: string
  localPath: string
  type: 'thumbnail' | 'detail' // 썸네일 또는 상세 이미지
  downloadedAt: Date
}

/**
 * 크롤링 진행 상황
 */
export interface CrawlProgress {
  totalCategories: number
  processedCategories: number
  totalProducts: number
  processedProducts: number
  failedProducts: number
  startTime: Date
  endTime?: Date
}

/**
 * 크롤링 옵션
 */
export interface CrawlOptions {
  // 포함할 카테고리 (siteCategoryCode)
  includeCategories?: string[]
  // 제외할 카테고리
  excludeCategories?: string[]
  // 특정 레벨만 (1, 2, 3)
  categoryLevel?: number
  // 타겟 카테고리만 크롤링 (config/target-categories.ts에 정의된 카테고리만)
  targetOnly?: boolean
}
