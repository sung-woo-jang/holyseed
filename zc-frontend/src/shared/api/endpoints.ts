export const ZC_API = {
  // 통계
  STATS: {
    OVERVIEW: '/stats/overview',  // POST
  },

  // 사이트
  SITES: {
    LIST: '/sites',  // GET
  },

  // 통합 카테고리 (사용자 정의)
  CATEGORIES: {
    LIST: '/categories',           // GET: 전체
    TREE: '/categories/tree',      // GET: 트리 (사이트 카테고리 매핑 수 포함)
    CREATE: '/categories',         // POST
    UPDATE: (id: string) => `/categories/${id}/update`,    // POST
    DELETE: (id: string) => `/categories/${id}/delete`,    // POST
    MAPPINGS: (id: string) => `/categories/${id}/mappings`,              // GET/POST
    MAPPINGS_REMOVE: (id: string) => `/categories/${id}/mappings/remove`, // POST
  },

  // 사이트별 크롤링 카테고리
  SITE_CATEGORIES: {
    LIST: '/site-categories',       // GET: ?siteCode=
    TREE: '/site-categories/tree',  // GET: ?siteCode=
  },

  // 브랜드
  BRANDS: {
    LIST: '/brands',  // GET
  },

  // 제품 리스팅 (크롤링 + 수동)
  PRODUCT_LISTINGS: {
    LIST: '/product-listings',              // GET
    SEARCH: '/product-listings/search',     // POST
    UNMATCHED: '/product-listings/unmatched', // POST
    DETAIL: (id: string) => `/product-listings/${id}`,
    CREATE_MANUAL: '/product-listings/manual',                      // POST
    UPDATE_MANUAL: (id: string) => `/product-listings/manual/${id}/update`,  // POST
    DELETE_MANUAL: (id: string) => `/product-listings/manual/${id}/delete`,  // POST
  },

  // 가격 이력
  PRICE_HISTORY: {
    PRODUCT: (id: string) => `/price-history/products/${id}`,
    SEARCH: (id: string) => `/price-history/products/${id}/search`,  // POST
  },

  // 제품 모델 매칭
  PRODUCT_MODEL_LINKS: {
    LIST: '/product-model-links',               // GET
    SEARCH: '/product-model-links/search',      // POST: { page?, limit?, search?, matchType? }
    CREATE: '/product-model-links',             // POST
    DELETE: (id: string) => `/product-model-links/${id}/delete`,  // POST
  },

  // 제품 모델 (사용자 정의 단가표)
  PRODUCT_MODELS: {
    LIST: '/product-models',          // GET
    SEARCH: '/product-models/search', // POST
    DETAIL: (id: string) => `/product-models/${id}`,
    CREATE: '/product-models',        // POST
    LINK_PRODUCT: (id: string) => `/product-models/${id}/link`,                           // POST
    UNLINK_PRODUCT: (id: string, listingId: string) => `/product-models/${id}/unlink/${listingId}`, // POST
    LINKED_PRODUCTS: (id: string) => `/product-models/${id}/products`,                    // GET
    UPDATE_PRICE: (id: string) => `/product-models/${id}/price`,                          // POST
    CALCULATE_MATERIAL_COST: (id: string) => `/product-models/${id}/calculate-material-cost`, // POST
    COMPARE: (id: string) => `/product-models/${id}/compare`,                             // GET
  },

  // 견적서
  QUOTES: {
    LIST: '/quotes',           // GET
    SEARCH: '/quotes/search',  // POST
    DETAIL: (id: string) => `/quotes/${id}`,
    CREATE: '/quotes',         // POST
    UPDATE: (id: string) => `/quotes/${id}/update`,      // POST
    DELETE: (id: string) => `/quotes/${id}/delete`,      // POST
    SEND: (id: string) => `/quotes/${id}/send`,          // POST
    DUPLICATE: (id: string) => `/quotes/${id}/duplicate`, // POST
    ITEMS: {
      ADD: (quoteId: string) => `/quotes/${quoteId}/items`,
      UPDATE: (quoteId: string, itemId: string) => `/quotes/${quoteId}/items/${itemId}/update`,
      DELETE: (quoteId: string, itemId: string) => `/quotes/${quoteId}/items/${itemId}/delete`,
    },
  },
} as const;
