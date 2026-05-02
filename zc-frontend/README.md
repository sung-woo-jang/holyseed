# ZC Frontend

**Zippt Crawler 관리자 웹 애플리케이션**

전자제품 크롤링 데이터 관리를 위한 관리자용 웹앱입니다.

## 기술 스택

- **프레임워크**: Vite + React 19 + TypeScript
- **라우팅**: React Router DOM v7
- **상태 관리**: TanStack Query
- **데이터 테이블**: TanStack React Table
- **차트**: Recharts
- **UI 컴포넌트**: Tailwind CSS + Shadcn UI
- **HTTP 클라이언트**: Axios
- **폼 관리**: React Hook Form + Zod

## 프로젝트 구조

```
zc-frontend/
├── src/
│   ├── app/                     # 앱 설정 (providers, routes, layout)
│   ├── pages/                   # 페이지 컴포넌트 (6개)
│   ├── features/                # 기능별 모듈 (api + ui + types)
│   │   ├── products/           # 제품 관리
│   │   ├── categories/         # 카테고리 관리
│   │   ├── brands/             # 브랜드 관리
│   │   └── product-matching/   # 제품 모델 매칭
│   ├── shared/                  # 공유 모듈 (api, ui, hooks, lib)
│   └── widgets/                 # 재사용 위젯 (header, sidebar, pagination)
├── .env.development             # 개발 환경 변수
└── package.json
```

## 시작하기

### 설치

```bash
npm install
```

### 환경 변수

`.env.development` 파일에 ZC 백엔드 API URL을 설정합니다:

```env
VITE_API_URL=http://localhost:8000
```

### 개발 서버 실행

```bash
npm run dev
```

개발 서버가 http://localhost:5173 에서 실행됩니다.

### 빌드

```bash
npm run build
```

빌드된 파일은 `dist/` 디렉토리에 생성됩니다.

## 주요 기능

### 1. 대시보드 (`/`)

- 통계 카드 (총 제품 수/매칭 완료/미매칭)
- 최근 가격 변동 제품 조회 (데이터 연동 대기)

### 2. 제품 관리 (`/products`, `/products/:id`)

**제품 목록**:
- 카테고리/브랜드 필터
- 검색 (debounce 500ms)
- 페이지네이션 (20개씩)
- 썸네일, 브랜드, 카테고리, 가격/할인가, 상태 표시

**제품 상세**:
- 제품 이미지 및 상세 정보
- 브랜드, 카테고리, 제조사, 원산지, 판매 상태
- 가격 이력 차트 (Recharts LineChart)
  - 정상가/할인가 2개 라인
  - 날짜 범위 필터 (7일/30일/90일/전체)
  - 반응형 차트
- 사이트 링크 (새 탭 열기)

### 3. 제품 모델 매칭 (`/matching`)

- ProductListing ↔ ProductModel 연결 관리
- 매칭 목록 테이블 (Listing 정보, Model 정보, 신뢰도)
- 매칭 삭제 기능
- 통계 (총 제품/매칭 완료/미매칭)

### 4. 카테고리 관리 (`/categories`)

- 카테고리 트리 구조 조회
- Expand/Collapse 기능 (▶/▼ 버튼)
- 계층 구조 들여쓰기
- 레벨 표시 (대분류/중분류/소분류)
- 카테고리 코드 표시

### 5. 브랜드 관리 (`/brands`)

- 브랜드 목록 테이블
- 로고 이미지 표시
- 브랜드명 (한글/영문)
- 제품 개수 표시
- 설명 표시

## API 연동

### Axios 설정

- Base URL: `${VITE_API_URL}/api/zc`
- 타임아웃: 10초
- 에러 처리: 인터셉터

### TanStack Query 설정

- staleTime: 10초
- retry: 3회
- refetchOnWindowFocus: false

### API 엔드포인트

⚠️ **중요**: 필터링/검색이 있는 조회는 POST + body 사용

```typescript
// 제품
POST /api/zc/products/search  // 필터링/검색 (body: { page, limit, categoryId, brandId, search })
GET  /api/zc/products/:id      // 단일 제품 조회

// 가격 이력
POST /api/zc/price-history/products/:id/search  // 필터링 (body: { startDate, endDate })

// 카테고리
GET /api/zc/categories       // 전체 목록
GET /api/zc/categories/tree  // 트리 구조

// 브랜드
GET /api/zc/brands  // 전체 목록

// 제품 모델 매칭
GET  /api/zc/product-model-links              // 전체 목록
POST /api/zc/product-model-links              // 생성
POST /api/zc/product-model-links/:id/delete   // 삭제

// 견적서
POST /api/zc/quotes/search          // 필터링/검색
GET  /api/zc/quotes/:id             // 단일 조회
POST /api/zc/quotes                 // 생성
POST /api/zc/quotes/:id/update      // 수정
POST /api/zc/quotes/:id/delete      // 삭제
POST /api/zc/quotes/:id/send        // 발송
POST /api/zc/quotes/:id/duplicate   // 복제
```

## 라우트 구조

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/` | Dashboard | 대시보드 (통계 카드) |
| `/products` | Products | 제품 목록/검색 |
| `/products/:id` | ProductDetail | 제품 상세 + 가격 차트 |
| `/matching` | ProductMatching | 제품 모델 매칭 |
| `/categories` | Categories | 카테고리 트리 |
| `/brands` | Brands | 브랜드 목록 |

## 개발 가이드

### 경로 별칭

`@/`로 `src/` 디렉토리를 참조할 수 있습니다:

```typescript
import { axiosInstance } from '@/shared/api/axios';
import { cn } from '@/shared/lib/utils';
import { useFetchProducts } from '@/features/products/api/fetch-products';
```

### 공통 유틸리티

- `@/shared/lib/utils.ts`: cn 함수 (clsx + tailwind-merge)
- `@/shared/api/axios.ts`: Axios 인스턴스
- `@/shared/api/endpoints.ts`: API 엔드포인트 상수
- `@/shared/hooks/useDebounce.ts`: Debounce 훅

### 공통 UI 컴포넌트

- `Button`, `Input`, `Card`, `Badge` (Shadcn UI 스타일)
- `Header`, `Sidebar`, `Pagination` (위젯)

## 구현 완료 사항

✅ **Phase 1**: 프로젝트 초기 설정
- Vite + React + TypeScript 프로젝트 생성
- 패키지 설치 (TanStack Query, React Router, Recharts 등)
- 디렉토리 구조 생성
- Tailwind CSS 설정
- 경로 별칭 설정

✅ **Phase 2**: 공통 모듈 및 레이아웃
- Header, Sidebar, Pagination 위젯
- Button, Input, Card, Badge UI 컴포넌트
- 6개 페이지 기본 레이아웃
- React Router 설정

✅ **Phase 3-1**: 제품 목록/검색
- 제품 API 연동 (필터, 검색, 페이지네이션)
- ProductTable (TanStack React Table)
- ProductFilters (카테고리/브랜드 Select)
- SearchInput (debounce 500ms)
- URL Query Params로 상태 관리

✅ **Phase 3-2**: 제품 상세 + 가격 차트
- 제품 상세 정보 표시
- Recharts LineChart (정상가/할인가)
- 날짜 범위 필터 (7일/30일/90일/전체)
- 반응형 차트

✅ **Phase 3-3**: 제품 모델 매칭
- 매칭 목록 조회/삭제
- 신뢰도 Badge
- TanStack Query mutation

✅ **Phase 3-4**: 카테고리 트리 관리
- 카테고리 트리 API 연동
- TanStack Table expand 기능
- 계층 구조 들여쓰기

✅ **Phase 3-5**: 브랜드 관리
- 브랜드 목록 테이블
- 로고, 제품 개수 표시

## 프로젝트 통계

- **페이지**: 6개 (Dashboard, Products, ProductDetail, ProductMatching, Categories, Brands)
- **API 훅**: 15개 이상
- **UI 컴포넌트**: 20개 이상
- **타입 정의**: 30개 이상
- **빌드 크기**: ~800KB (Recharts 포함)

## 다음 단계

- 백엔드 API 연동 테스트
- 미매칭 제품 목록 구현 (API 준비 후)
- 매칭 생성 다이얼로그 구현 (API 준비 후)
- 대시보드 통계 데이터 연동
- 코드 스플리팅 (번들 크기 최적화)
