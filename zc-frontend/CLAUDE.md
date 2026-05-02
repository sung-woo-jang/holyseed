# ZC Frontend - CLAUDE.md

이 파일은 ZC Frontend 프로젝트에서 Claude Code가 작업할 때 가이드를 제공합니다.

## 프로젝트 개요

**ZC Frontend**는 Dasis 위생 도기 제품 크롤링 데이터를 관리하는 관리자 대시보드입니다.

### 기술 스택
- **프레임워크**: Vite + React 19 + TypeScript
- **라우팅**: react-router-dom v7
- **상태 관리**: TanStack Query (React Query)
- **UI**: Shadcn UI + Tailwind CSS
- **테이블**: TanStack Table
- **차트**: Recharts

### 주요 기능
- 제품 목록 조회 및 필터링
- 카테고리/브랜드 관리
- 제품-모델 매칭
- 견적서 생성 및 관리
- 가격 이력 차트

---

## 개발 명령어

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (http://localhost:5173)
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 결과 미리보기
npm run preview

# 타입 체크
npm run type-check

# 린트
npm run lint
```

---

## 프로젝트 구조

```
src/
├── app/                    # 앱 진입점 및 라우팅
│   ├── routes.tsx         # TanStack Router 라우트 정의
│   ├── layout.tsx         # 공통 레이아웃
│   └── providers/         # React Query Provider 등
├── pages/                 # 페이지 컴포넌트
│   ├── products/
│   ├── quotes/
│   └── matching/
├── features/              # 기능별 모듈
│   ├── products/
│   │   ├── api/          # API 훅
│   │   ├── ui/           # UI 컴포넌트
│   │   └── types/        # 타입 정의
│   ├── quotes/
│   ├── categories/
│   ├── brands/
│   └── product-matching/
└── shared/                # 공유 리소스
    ├── api/              # Axios 인스턴스, 엔드포인트
    ├── ui/               # 공통 UI 컴포넌트
    └── lib/              # 유틸리티
```

---

## API 호출 규칙

### HTTP 메서드 제약사항

⚠️ **중요**: 이 프로젝트에서는 **GET과 POST만 사용**하며, **조회에도 POST를 우선 사용**합니다.

**메서드 사용 원칙:**
- ✅ **GET**: 전체 데이터 조회만 (필터 없음)
  - 예: `GET /api/zc/categories` - 모든 카테고리 조회
  - 예: `GET /api/zc/brands` - 모든 브랜드 조회
- ✅ **POST**: 모든 데이터 요청 (필터/검색/페이지네이션 포함)
  - 조회: 필터, 검색어, 페이지네이션 등이 필요하면 POST + body
  - 생성, 수정, 삭제도 POST
- ❌ **PUT, PATCH, DELETE**: 사용 금지

**이유**:
- REST 원칙보다 실용성 우선
- 쿼리 파라미터보다 body가 더 편리하고 명확
- 복잡한 필터링 조건은 body에 담는 것이 적합

### 올바른 예시

```typescript
// ✅ 제품 목록 조회 (필터링 있음 - POST 사용)
export function useFetchProducts(params: ProductQueryParams) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: async () => {
      const response = await axiosInstance.post<ProductListResponse>(
        ZC_API.PRODUCTS.SEARCH,  // POST 엔드포인트
        params  // body로 전달
      );
      return response.data;
    },
  });
}

// ✅ 전체 카테고리 조회 (필터 없음 - GET 사용 가능)
export function useFetchCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await axiosInstance.get<Category[]>(
        ZC_API.CATEGORIES.LIST
      );
      return response.data;
    },
  });
}

// ✅ 견적서 생성
export function useCreateQuote() {
  return useMutation({
    mutationFn: async (data: CreateQuoteDto) => {
      const response = await axiosInstance.post<Quote>(
        ZC_API.QUOTES.CREATE,
        data
      );
      return response.data;
    },
  });
}

// ✅ 견적서 수정
export function useUpdateQuote() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateQuoteDto }) => {
      const response = await axiosInstance.post<Quote>(
        ZC_API.QUOTES.UPDATE(id),
        data
      );
      return response.data;
    },
  });
}

// ✅ 견적서 삭제
export function useDeleteQuote() {
  return useMutation({
    mutationFn: async (id: string) => {
      await axiosInstance.post(ZC_API.QUOTES.DELETE(id));
    },
  });
}
```

### 잘못된 예시

```typescript
// ❌ GET + 쿼리 파라미터로 필터링 (금지)
const response = await axiosInstance.get<ProductListResponse>(
  ZC_API.PRODUCTS.LIST,
  { params }  // 쿼리 파라미터 사용 금지
);

// ❌ PUT/PATCH/DELETE 사용 (금지)
await axiosInstance.put(`/quotes/${id}`, data);
await axiosInstance.patch(`/quotes/${id}`, data);
await axiosInstance.delete(`/quotes/${id}`);
```

---

## TanStack Query 패턴

### Query (조회)

```typescript
import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '@/shared/api/axios';

export function useFetchProducts(params: ProductQueryParams) {
  return useQuery({
    queryKey: ['products', params],  // params를 queryKey에 포함
    queryFn: async () => {
      const response = await axiosInstance.post<ProductListResponse>(
        ZC_API.PRODUCTS.SEARCH,
        params
      );
      return response.data;
    },
    // 옵션
    staleTime: 1000 * 60 * 5,  // 5분
    gcTime: 1000 * 60 * 10,    // 10분
  });
}
```

### Mutation (생성/수정/삭제)

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useCreateQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateQuoteDto) => {
      const response = await axiosInstance.post<Quote>(
        ZC_API.QUOTES.CREATE,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
  });
}
```

---

## 코딩 컨벤션

### 파일 및 폴더 구조

```typescript
// 폴더명: kebab-case
product-filters/
quote-table/

// 컴포넌트 파일: kebab-case
product-table.tsx
quote-form.tsx

// 훅 파일: camelCase
useFetchProducts.ts
useCreateQuote.ts
```

### 컴포넌트 작성

```typescript
// Props 타입은 컴포넌트명 + Props
interface ProductTableProps {
  data: Product[];
  onSelect: (id: string) => void;
}

export function ProductTable({ data, onSelect }: ProductTableProps) {
  // ...
}
```

### 타입 정의

```typescript
// API 요청/응답 타입
export interface ProductQueryParams {
  page?: number;
  limit?: number;
  categoryId?: string;
  brandId?: string;
  search?: string;
}

export interface ProductListResponse {
  data: Product[];
  total: number;
  page: number;
  limit: number;
}

// 엔티티 타입
export interface Product {
  id: string;
  productName: string;
  extractedModelName?: string;
  currentPrice: number;
  currentDiscountPrice?: number;
  // ...
}
```

---

## 환경 변수

```env
# .env.development
VITE_API_BASE_URL=http://localhost:8000/api/zc
```

```typescript
// 사용법
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
```

---

## Shadcn UI 사용

```bash
# 컴포넌트 추가
npx shadcn@latest add button
npx shadcn@latest add table
npx shadcn@latest add dialog
```

```typescript
// 사용 예시
import { Button } from '@/shared/ui/button';
import { Table } from '@/shared/ui/table';

export function MyComponent() {
  return (
    <div>
      <Button variant="default">클릭</Button>
      <Table>...</Table>
    </div>
  );
}
```

---

## 개발 시 주의사항

1. **API 호출**: 필터링/검색이 있으면 무조건 POST 사용
2. **queryKey**: params를 포함하여 자동 캐시 관리
3. **Mutation 후**: `invalidateQueries`로 관련 쿼리 갱신
4. **에러 처리**: React Query의 `error` 객체 활용
5. **타입 안정성**: API 응답에 제네릭 타입 지정

---

## 문제 해결

### API 응답 형식

Backend는 `SuccessResponse<T>` 구조를 사용하지 않고 바로 데이터를 반환합니다.

```typescript
// Backend 응답
{
  "data": [...],
  "total": 100,
  "page": 1,
  "limit": 20
}

// 따라서 response.data로 바로 접근
const response = await axiosInstance.post<ProductListResponse>(...);
return response.data;  // { data, total, page, limit }
```

### CORS 문제

개발 중 CORS 에러 발생 시 Backend에서 CORS 설정 확인.

### 빌드 에러

```bash
# node_modules 재설치
rm -rf node_modules package-lock.json
npm install

# 타입 체크
npm run type-check
```
