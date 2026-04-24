export const ZC_API = {
  // 통계
  STATS: {
    OVERVIEW: '/stats/overview',  // POST: 전체 통계 조회
  },

  // 사이트
  SITES: {
    LIST: '/sites',  // GET: 사이트 목록 조회
  },

  // 제품 리스팅 (크롤링된 제품)
  PRODUCT_LISTINGS: {
    LIST: '/product-listings',  // GET: 전체 조회
    SEARCH: '/product-listings/search',  // POST: 필터링/검색
    UNMATCHED: '/product-listings/unmatched',  // POST: 미매칭 제품 조회
    DETAIL: (id: string) => `/product-listings/${id}`,
  },

  // 가격 이력
  PRICE_HISTORY: {
    PRODUCT: (id: string) => `/price-history/products/${id}`,
    SEARCH: (id: string) => `/price-history/products/${id}/search`,  // POST: 필터링
  },

  // 카테고리
  CATEGORIES: {
    TREE: '/categories/tree',  // GET: 전체 트리
    LIST: '/categories',  // GET: 전체 목록
  },

  // 브랜드
  BRANDS: {
    LIST: '/brands',  // GET: 전체 목록
  },

  // 제품 모델 매칭
  PRODUCT_MODEL_LINKS: {
    LIST: '/product-model-links',  // GET: 전체 조회
    SEARCH: '/product-model-links/search',  // POST: 필터링
    CREATE: '/product-model-links',
    DELETE: (id: string) => `/product-model-links/${id}/delete`,
  },

  // 제품 모델 (사용자 정의 마스터)
  PRODUCT_MODELS: {
    LIST: '/product-models',  // GET: 전체 조회
    SEARCH: '/product-models/search',  // POST: 필터링/검색
    DETAIL: (id: string) => `/product-models/${id}`,
    CREATE: '/product-models',  // POST: 모델 생성
    LINK_PRODUCT: (id: string) => `/product-models/${id}/link`,  // POST: 제품 연결
    UNLINK_PRODUCT: (id: string, listingId: string) => `/product-models/${id}/unlink/${listingId}`,  // POST: 연결 해제
    LINKED_PRODUCTS: (id: string) => `/product-models/${id}/products`,  // GET: 연결된 제품 조회
    UPDATE_PRICE: (id: string) => `/product-models/${id}/price`,  // POST: 가격 설정
    CALCULATE_COST: (id: string) => `/product-models/${id}/calculate-cost`,  // POST: 원가 자동 계산
  },

  // 견적서
  QUOTES: {
    LIST: '/quotes',  // GET: 전체 조회
    SEARCH: '/quotes/search',  // POST: 필터링/검색
    DETAIL: (id: string) => `/quotes/${id}`,
    CREATE: '/quotes',
    UPDATE: (id: string) => `/quotes/${id}/update`,
    DELETE: (id: string) => `/quotes/${id}/delete`,
    SEND: (id: string) => `/quotes/${id}/send`,
    DUPLICATE: (id: string) => `/quotes/${id}/duplicate`,
    ITEMS: {
      ADD: (quoteId: string) => `/quotes/${quoteId}/items`,
      UPDATE: (quoteId: string, itemId: string) => `/quotes/${quoteId}/items/${itemId}/update`,
      DELETE: (quoteId: string, itemId: string) => `/quotes/${quoteId}/items/${itemId}/delete`,
    },
  },
} as const;
