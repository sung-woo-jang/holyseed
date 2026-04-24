# ZC (Zippt Crawler) - 전자제품 가격 비교 서비스

전자제품 가격 정보를 수집하고 추적하는 시스템입니다. Dasis.co.kr 사이트에서 위생/인테리어 제품 정보를 크롤링하여 가격 변동을 추적합니다.

## 📁 프로젝트 구조

```
src/projects/zc/
├── modules/                        # NestJS 모듈
│   ├── sites/                     # 사이트 관리 (Dasis, Naver 등)
│   │   ├── dto/
│   │   ├── entities/
│   │   ├── sites.controller.ts
│   │   ├── sites.service.ts
│   │   └── sites.module.ts
│   ├── site-categories/           # 사이트별 카테고리
│   │   ├── dto/
│   │   ├── entities/
│   │   ├── site-categories.controller.ts
│   │   ├── site-categories.service.ts
│   │   └── site-categories.module.ts
│   ├── brands/                    # 브랜드 관리
│   │   ├── dto/
│   │   ├── entities/
│   │   ├── brands.controller.ts
│   │   ├── brands.service.ts
│   │   └── brands.module.ts
│   ├── product-listings/          # 사이트별 제품 목록 (크롤링 데이터)
│   │   ├── dto/
│   │   ├── entities/
│   │   ├── product-listings.controller.ts
│   │   ├── product-listings.service.ts
│   │   └── product-listings.module.ts
│   ├── product-models/            # 통합 제품 모델 (사용자 정의)
│   │   ├── dto/
│   │   ├── entities/
│   │   ├── product-models.controller.ts
│   │   ├── product-models.service.ts
│   │   └── product-models.module.ts
│   ├── product-model-links/       # 제품 모델 연결 (Listing ↔ Model)
│   │   ├── dto/
│   │   ├── entities/
│   │   ├── product-model-links.controller.ts
│   │   ├── product-model-links.service.ts
│   │   └── product-model-links.module.ts
│   ├── product-images/            # 제품 이미지
│   │   ├── dto/
│   │   ├── entities/
│   │   ├── product-images.service.ts
│   │   └── product-images.module.ts
│   └── price-history/             # 가격 변동 이력
│       ├── dto/
│       ├── entities/
│       ├── price-history.controller.ts
│       ├── price-history.service.ts
│       └── price-history.module.ts
├── scripts/                       # 크롤러 스크립트
│   └── crawler/
│       ├── crawlers/              # 크롤링 로직
│       │   ├── browser.ts
│       │   ├── category-crawler.ts
│       │   ├── product-list-crawler.ts
│       │   └── product-detail-crawler.ts
│       ├── types/                 # TypeScript 타입
│       ├── utils/                 # 유틸리티
│       │   ├── logger.ts
│       │   ├── delay.ts
│       │   └── image-downloader.ts
│       ├── config/                # 설정
│       └── index.ts               # 메인 크롤러
├── zc.module.ts                   # ZC 프로젝트 메인 모듈
└── README.md                      # 이 문서
```

## 🔑 핵심 개념

### Product Listing vs Product Model

- **Product Listing**: 각 쇼핑몰 사이트에서 크롤링한 **원본 제품 정보**
  - 예: "다시스의 코헬러 샤워헤드 K-123", "네이버쇼핑의 KOHLER K-123"
  - 사이트마다 다른 이름, 가격, 설명을 가짐

- **Product Model**: 사용자가 정의하는 **통합 제품 모델** (같은 제품의 여러 Listing을 묶음)
  - 예: "코헬러 K-123 샤워헤드" (실제 모델명)
  - 여러 사이트의 Listing을 연결하여 가격 비교

### 데이터 흐름

```
크롤러 → Product Listings (사이트별 데이터)
            ↓
    Product Model Links (연결)
            ↓
    Product Models (통합 데이터)
            ↓
    Price History (가격 추적)
```

## 🌐 API 엔드포인트

**Base URL**: `/api/zc/*`

### 사이트 관리 API

- `GET /api/zc/sites` - 사이트 목록 조회 (Dasis, Naver 등)

### 카테고리 API

- `GET /api/zc/categories` - Dasis 카테고리 전체 목록 조회
- `GET /api/zc/categories/tree` - Dasis 카테고리 트리 구조 조회
- `GET /api/zc/categories/:id` - 카테고리 상세 조회
- `GET /api/zc/categories/:id/children` - 하위 카테고리 조회

### 브랜드 API

- `GET /api/zc/brands` - 브랜드 목록 조회 (제품 개수 포함)
- `GET /api/zc/brands/:id` - 브랜드 상세 조회

### 제품 목록 API (Product Listings)

- `GET /api/zc/products` - Dasis 제품 목록 조회 (페이지네이션, 필터링)
  - Query: `page`, `limit`, `brandId`, `categoryId`, `search`
- `GET /api/zc/products/:id` - 제품 상세 조회

### 제품 모델 API (Product Models)

- `GET /api/zc/product-models` - 통합 제품 모델 목록 조회
- `GET /api/zc/product-models/:id` - 제품 모델 상세 조회
- `GET /api/zc/product-models/brand/:brandId` - 브랜드별 제품 모델 조회
- `POST /api/zc/product-models/:id/price` - 제품 모델 가격 설정 (원가, 판매가, 마진율)

### 제품 모델 연결 API

- `GET /api/zc/product-model-links` - 모든 연결 조회
- `GET /api/zc/product-model-links/listing/:listingId` - Listing의 연결 정보
- `GET /api/zc/product-model-links/model/:modelId` - Model의 모든 Listing 조회
- `POST /api/zc/product-model-links/:id/delete` - 연결 해제

### 제품 자동 매칭 API

- `GET /api/zc/product-matching/unmatched` - 미매칭 제품 목록 조회
- `POST /api/zc/product-matching/:listingId/auto-match` - 특정 제품 자동 매칭 실행
- `POST /api/zc/product-matching/auto-match-all` - 모든 미매칭 제품 일괄 자동 매칭
- `GET /api/zc/product-matching/:listingId/suggestions` - 매칭 후보 추천 (유사도 순)

### 견적서 API

- `GET /api/zc/quotes` - 견적서 목록 조회
- `GET /api/zc/quotes/:id` - 견적서 상세 조회
- `POST /api/zc/quotes` - 견적서 생성
- `POST /api/zc/quotes/:id/update` - 견적서 수정
- `POST /api/zc/quotes/:id/delete` - 견적서 삭제
- `POST /api/zc/quotes/:id/items` - 견적 항목 추가
- `POST /api/zc/quotes/:id/items/:itemId/update` - 견적 항목 수정
- `POST /api/zc/quotes/:id/items/:itemId/delete` - 견적 항목 삭제
- `POST /api/zc/quotes/:id/send` - 견적서 발송 (상태: sent)
- `POST /api/zc/quotes/:id/duplicate` - 견적서 복제

### 가격 이력 API

- `GET /api/zc/price-history/products/:productId` - 제품의 가격 이력 조회
  - Query: `startDate`, `endDate` (ISO 8601 형식)
- `GET /api/zc/price-history/recent-changes` - 최근 가격 변동 제품 조회
  - Query: `days` (기본: 7), `limit` (기본: 20)

## 🗄️ 데이터베이스 스키마

**스키마**: `zc` (PostgreSQL)

### sites 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | Primary Key |
| code | VARCHAR(50) | 사이트 코드 (예: dasis, naver) [Unique] |
| name | VARCHAR(100) | 사이트명 (예: 다시스, 네이버쇼핑) |
| baseUrl | TEXT | 사이트 기본 URL |
| isActive | BOOLEAN | 크롤링 활성화 여부 |
| crawlerConfig | JSONB | 사이트별 크롤러 설정 |
| createdAt | TIMESTAMP | 생성일시 |
| updatedAt | TIMESTAMP | 수정일시 |

### site_categories 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | Primary Key |
| siteId | UUID | FK to sites |
| siteCategoryCode | VARCHAR(50) | 사이트 내부 카테고리 코드 (예: 001) |
| name | VARCHAR(100) | 카테고리명 |
| parentId | UUID | 상위 카테고리 (같은 사이트 내에서만) |
| level | INT | 1: 대분류, 2: 중분류, 3: 소분류 |
| url | TEXT | 카테고리 URL |
| createdAt | TIMESTAMP | 생성일시 |
| updatedAt | TIMESTAMP | 수정일시 |

**Unique Index**: (siteId, siteCategoryCode)

### brands 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | Primary Key |
| name | VARCHAR(100) | 브랜드명 (예: 코헬러, 한스그로에) [Unique] |
| nameEn | VARCHAR(100) | 영문 브랜드명 |
| logoUrl | TEXT | 로고 이미지 URL |
| description | TEXT | 브랜드 설명 |
| createdAt | TIMESTAMP | 생성일시 |
| updatedAt | TIMESTAMP | 수정일시 |

### product_listings 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | Primary Key |
| siteId | UUID | FK to sites |
| siteCategoryId | UUID | FK to site_categories |
| brandId | UUID | FK to brands |
| siteProductId | VARCHAR(100) | 사이트 내부 상품 ID (예: Dasis goodsNo) |
| productName | VARCHAR(255) | 사이트에 표시되는 제품명 |
| extractedModelName | VARCHAR(100) | 크롤링 시 추출한 모델명 |
| currentPrice | INT | 현재 가격 |
| currentDiscountPrice | INT | 현재 할인가 |
| description | TEXT | 제품 설명 |
| specifications | JSONB | 제품 스펙 정보 |
| productUrl | TEXT | 제품 상세 페이지 URL |
| isAvailable | BOOLEAN | 판매 가능 여부 |
| stock | INT | 재고 수량 |
| deliveryFee | INT | 배송비 |
| manufacturer | VARCHAR(100) | 제조사 |
| origin | VARCHAR(100) | 원산지 |
| lastCrawledAt | TIMESTAMP | 마지막 크롤링 시각 |
| createdAt | TIMESTAMP | 생성일시 |
| updatedAt | TIMESTAMP | 수정일시 |

**Unique Index**: (siteId, siteProductId)

### product_models 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | Primary Key |
| brandId | UUID | FK to brands (사용자가 지정) |
| modelName | VARCHAR(100) | 사용자가 정의하는 "진짜" 모델명 |
| displayName | VARCHAR(255) | 표시용 제품명 |
| description | TEXT | 사용자가 작성한 설명 |
| specifications | JSONB | 사용자가 정의한 스펙 |
| thumbnailUrl | TEXT | 대표 이미지 |
| isActive | BOOLEAN | 추적 활성화 여부 |
| costPrice | INT | 원가 (매입가) |
| sellingPrice | INT | 판매가 (견적용) |
| marginRate | FLOAT | 마진율 (%) |
| priceNote | TEXT | 가격 메모 |
| priceUpdatedAt | TIMESTAMP | 가격 마지막 수정일 |
| createdAt | TIMESTAMP | 생성일시 |
| updatedAt | TIMESTAMP | 수정일시 |

### product_model_links 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | Primary Key |
| listingId | UUID | FK to product_listings [Unique] |
| modelId | UUID | FK to product_models |
| matchType | VARCHAR(20) | 매칭 방식 (auto_matched / manual_matched) |
| matchConfidence | FLOAT | 자동 매칭 신뢰도 (0.0 ~ 1.0) |
| linkedAt | TIMESTAMP | 매칭한 시각 |
| linkedBy | VARCHAR(100) | 매칭한 사용자 |
| createdAt | TIMESTAMP | 생성일시 |

**Unique Constraint**: listingId (1:1 관계)

### product_images 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | Primary Key |
| listingId | UUID | FK to product_listings |
| originalUrl | TEXT | 원본 이미지 URL |
| localPath | VARCHAR(500) | 로컬 저장 경로 |
| type | VARCHAR(20) | 이미지 타입 (thumbnail/detail/spec) |
| sortOrder | INT | 정렬 순서 |
| createdAt | TIMESTAMP | 생성일시 |

### price_history 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | Primary Key |
| listingId | UUID | FK to product_listings |
| price | INT | 해당 시점의 가격 |
| discountPrice | INT | 해당 시점의 할인가 |
| recordedAt | TIMESTAMP | 가격 기록 시각 |
| isAvailable | BOOLEAN | 해당 시점 판매 가능 여부 |
| createdAt | TIMESTAMP | 생성일시 |

**Index**: (listingId, recordedAt)

### quotes 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | Primary Key |
| title | VARCHAR(100) | 견적서 제목 |
| customerName | VARCHAR(100) | 고객명 |
| customerPhone | VARCHAR(20) | 고객 연락처 |
| memo | TEXT | 메모 |
| totalAmount | INT | 총 금액 |
| status | VARCHAR(20) | 견적서 상태 (draft/sent/accepted/rejected) |
| validUntil | DATE | 유효 기간 |
| createdAt | TIMESTAMP | 생성일시 |
| updatedAt | TIMESTAMP | 수정일시 |

### quote_items 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | Primary Key |
| quoteId | UUID | FK to quotes |
| productModelId | UUID | FK to product_models (선택사항) |
| productName | VARCHAR(255) | 제품명 |
| quantity | INT | 수량 |
| unitPrice | INT | 단가 |
| totalPrice | INT | 총 가격 (수량 × 단가) |
| note | TEXT | 항목 메모 |
| sortOrder | INT | 정렬 순서 |

## 🤖 크롤러 사용법

### 환경 변수 설정

`.env` 파일에 다음 환경 변수를 설정하세요:

```env
# ZC (Zippt Crawler) - Dasis 크롤러
DASIS_COOKIE_GD5SESSID=2be21a86890307e70c6dc835248222d0
DASIS_BASE_URL=https://www.dasis.co.kr
CRAWL_DELAY_MS=1000
MAX_CONCURRENT_PAGES=3
DOWNLOAD_IMAGES=true
IMAGES_DIR=./uploads/zc/images
HEADLESS=false
```

### 크롤러 실행

#### 기본 사용법

```bash
# 전체 카테고리 크롤링
npm run crawler

# 또는 직접 실행
ts-node -r tsconfig-paths/register src/projects/zc/scripts/crawler/index.ts
```

#### 카테고리 필터링 옵션

특정 카테고리만 크롤링하거나 제외할 수 있습니다.

```bash
# 특정 카테고리만 크롤링 (카테고리 코드로 지정)
ts-node -r tsconfig-paths/register src/projects/zc/scripts/crawler/index.ts --include=001,002

# 특정 카테고리 제외
ts-node -r tsconfig-paths/register src/projects/zc/scripts/crawler/index.ts --exclude=003,004

# 포함 + 제외 조합
ts-node -r tsconfig-paths/register src/projects/zc/scripts/crawler/index.ts --include=001,002 --exclude=001003

# 특정 레벨만 크롤링 (1: 대분류, 2: 중분류, 3: 소분류)
ts-node -r tsconfig-paths/register src/projects/zc/scripts/crawler/index.ts --level=1
```

**옵션 설명:**
- `--include=<카테고리코드1,카테고리코드2>`: 포함할 카테고리 (쉼표로 구분)
- `--exclude=<카테고리코드1,카테고리코드2>`: 제외할 카테고리 (쉼표로 구분)
- `--level=<1|2|3>`: 크롤링할 카테고리 레벨 (기본: 1)

### 크롤링 프로세스

크롤러는 다음 단계로 진행됩니다:

1. **카테고리 수집**: Dasis 사이트의 모든 카테고리 수집
   - 1단계: 메인 페이지에서 대분류 카테고리 수집
   - 2단계: 각 대분류 페이지에서 중분류/소분류 하위 카테고리 수집

2. **제품 목록 수집**: 각 카테고리별 제품 목록 크롤링 (페이지네이션 포함)

3. **제품 상세 정보 수집**: 각 제품의 상세 페이지 크롤링

4. **이미지 다운로드**: 제품 이미지를 로컬에 다운로드

5. **브랜드 자동 추출**: 제품명에서 브랜드를 자동으로 추출하여 brands 테이블에 저장

6. **가격 이력 기록**: 크롤링 시점의 가격을 price_history에 기록

**세션 만료 감지**: 크롤링 중 세션이 만료되면 자동으로 감지하고 쿠키 갱신 안내를 표시합니다.

### 크롤링 결과

크롤링 결과는 다음 위치에 저장됩니다:

- **JSON 파일**: `downloads/data/`
  - `crawl-result.json` - 전체 크롤링 결과
  - `categories.json` - 카테고리 데이터
  - `products.json` - 제품 데이터
  - `images.json` - 이미지 매핑 정보

- **이미지 파일**: `uploads/zc/images/`
  - `{goodsNo}_thumb.{ext}` - 썸네일 이미지
  - `{goodsNo}_detail_{N}.{ext}` - 상세 이미지

- **데이터베이스**: PostgreSQL `zc` 스키마
  - 8개 테이블에 크롤링 데이터 저장

## 📚 Swagger 문서

API 문서는 서버 실행 후 다음 주소에서 확인할 수 있습니다:

- **ZC Swagger**: http://localhost:8000/zc/docs
- **Swagger JSON**: http://localhost:8000/zc/docs/json

ZC API는 다음 태그로 그룹화되어 있습니다:
- `ZC 카테고리`
- `ZC 제품`
- `ZC 브랜드`
- `ZC 가격 이력`

## 🛠️ 개발 참고사항

### 쿠키 갱신

Dasis 사이트의 로그인 쿠키(`GD5SESSID`)는 일정 기간 후 만료될 수 있습니다. 가격 정보를 보려면 유효한 쿠키가 필요합니다.

쿠키 갱신 방법:
1. 브라우저에서 https://www.dasis.co.kr 접속
2. 로그인
3. 개발자 도구 > Application > Cookies
4. `GD5SESSID` 값 복사
5. `.env` 파일의 `DASIS_COOKIE_GD5SESSID` 값 업데이트
6. 크롤러 재실행

### 크롤링 속도 조절

서버 부하를 방지하기 위해 `CRAWL_DELAY_MS` 환경 변수로 크롤링 간격을 조절할 수 있습니다. 기본값은 1000ms (1초)입니다.

### 이미지 저장 경로

이미지는 `IMAGES_DIR` 환경 변수에 지정된 경로에 저장됩니다. 기본값은 `./uploads/zc/images`입니다.

### Product Model 연결

Product Listing과 Product Model을 연결하는 방법:

1. 크롤링으로 Product Listings 수집
2. 관리자가 Product Model 생성 (실제 제품 정의)
3. Product Model Links로 연결 (수동 또는 자동 매칭)
4. 이후 가격 비교 시 같은 Model에 연결된 모든 Listing의 가격 비교

## ❗ 문제 해결

### 브라우저 실행 실패

Puppeteer가 브라우저를 실행하지 못하는 경우:

```bash
# Chrome 브라우저 설치 확인
# macOS의 경우 Homebrew로 설치
brew install --cask google-chrome
```

### 가격 정보 접근 불가 / 세션 만료

가격 정보가 표시되지 않거나 세션 만료 에러가 발생하는 경우:

1. 브라우저에서 https://www.dasis.co.kr 접속
2. 로그인
3. 개발자 도구 > Application > Cookies
4. `GD5SESSID` 값 복사
5. `.env` 파일의 `DASIS_COOKIE_GD5SESSID` 값 업데이트
6. 크롤러 재실행

**참고**: 크롤러는 세션 만료를 자동으로 감지하며, 에러 발생 시 지금까지 수집한 데이터를 저장합니다.

### 크롤링 속도 느림

크롤링 속도가 너무 느린 경우:
1. `CRAWL_DELAY_MS` 값을 줄임 (단, 서버 부하 주의)
2. `HEADLESS=true`로 설정하여 브라우저 UI 비활성화
3. `MAX_CONCURRENT_PAGES`를 늘려 동시 크롤링 페이지 수 증가

### API 404 에러

ZC API 호출 시 404 에러가 발생하는 경우:
- 올바른 경로 확인: `/api/zc/*` (반드시 `zc` prefix 포함)
- 예: `GET /api/zc/categories` ✅
- 예: `GET /api/categories` ❌

## 📝 라이선스

이 프로젝트는 Living Craft 백엔드의 일부입니다.
