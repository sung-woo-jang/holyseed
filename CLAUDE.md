# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

- 항상 한국말을 할 것
- 존댓말을 사용할 것
- AskUserQuestion 도구로 선택형 질문을 적극 활용할 것
- living-craft-front 부분 화면개발 작업을 할 때는 **Apps-in-Toss MCP 서버를 적극 활용할 것**
    - Apps-in-Toss SDK, API, 기능 관련 질문이나 작업 시 MCP를 통해 최신 문서와 예제를 참조
    - appLogin, 인앱 광고, 딥링크 등 Apps-in-Toss 기능 구현 시 MCP 활용
    - TDS 컴포넌트 사용 시 MCP를 통해 정확한 사용법 확인

---

## 프로젝트 개요

**Living Craft**는 인테리어 필름 시공, 유리 청소 등의 출장 서비스를 제공하는 **1인 운영 예약 플랫폼**입니다. 토스 앱 내에서 동작하는 Apps-in-Toss 기반의 Mini App으로, 고객용
앱과 관리자 백오피스로 구성되어 있습니다.

### 주요 기능

**고객용 기능:**

- 서비스 예약 (4단계: 서비스 선택 → 날짜/시간 → 고객정보 → 확인)
- 포트폴리오 조회
- 리뷰 작성 및 조회
- 내 예약/리뷰 관리

**관리자 기능 (백오피스):**

- 예약 관리 (상태 변경, 취소)
- 서비스 관리 (CRUD, 지역 설정)
- 포트폴리오 관리
- 리뷰 관리
- 고객 관리

---

## 모노레포 구조

```
living-craft/
├── living-craft-front/      # 고객용 앱
│   ├── CLAUDE.md           # Front 프로젝트 가이드
│   └── docs/api/           # API 명세서 (중요!)
│       ├── README.md       # API 개요
│       └── API_SPECIFICATION.md  # 전체 API 스펙
│
├── living-craft-backend/    # API 서버
│   └── CLAUDE.md           # Backend 프로젝트 가이드
│
└── living-craft-backoffice/ # 관리자 백오피스
    └── CLAUDE.md           # Backoffice 프로젝트 가이드
```

---

## 서브프로젝트 개요

### 1. living-craft-front (고객용 앱)

**기술 스택:**

- **프레임워크**: Granite.js + React Native 0.72.6
- **라우팅**: Granite Router (파일 기반)
- **UI**: Toss Design System (@toss/tds-react-native)
- **상태 관리**: Zustand + React Hook Form
- **플랫폼**: Apps-in-Toss (토스 앱 내 Mini App)

**현재 상태:**

- ✅ UI/UX 완성 (Mock 데이터 사용)
- ⏳ Backend API 연동 대기 중

**주요 특징:**

- Feature-Sliced Design 계층 구조 (pages/widgets/shared)
- 4단계 예약 플로우
- Apps-in-Toss SDK 통합 (카메라/앨범 권한, appLogin)
- TypeScript strict mode

**자세한 내용**: `living-craft-front/CLAUDE.md` 참조

### 2. living-craft-backend (API 서버)

**기술 스택:**

- **프레임워크**: NestJS
- **데이터베이스**: PostgreSQL + TypeORM
- **인증**: JWT (Apps-in-Toss appLogin 연동 예정)
- **API 문서**: Swagger

**현재 상태:**

- 🔧 NestJS 클린 템플릿 상태
- ⏳ 모듈 개발 필요

**개발 환경:**

- Docker Compose로 PostgreSQL 관리
- 개발: localhost:8000
- Swagger: localhost:8000/lc/docs (고객용 API), localhost:8000/lc/admin-docs (관리자용 API)
- 데이터베이스 스키마: lc (Living Craft 전용 스키마)

**멀티 프로젝트 아키텍처:**

Backend는 멀티 프로젝트 구조로 설계되어 있으며, Living Craft는 `lc` 프로젝트로 관리됩니다:

- **프로젝트 구조**: `src/projects/lc/` - Living Craft 전용 모듈
- **공유 모듈**: `src/shared/` - 프로젝트 간 공유 모듈 (files, health, address 등)
- **데이터베이스**: `lc` 스키마로 격리
- **API Prefix**: `/api/lc/*` (고객용), `/api/lc/admin/*` (관리자용)

**자세한 내용**: `living-craft-backend/CLAUDE.md` 참조

### 3. living-craft-backoffice (관리자 백오피스)

**기술 스택:**

- **프레임워크**: Vite + React
- **라우팅**: TanStack Router
- **상태 관리**: Zustand + TanStack React Query
- **UI**: Shadcn UI (RTL 지원 커스터마이징)

**현재 상태:**

- 🔧 Shadcn Admin 템플릿 기반
- ⏳ 기능 구현 필요

**자세한 내용**: `living-craft-backoffice/CLAUDE.md` 참조

---

## API 명세 및 연동 가이드

### API 문서 위치

모든 API 명세는 **Front 프로젝트**에 문서화되어 있습니다:

- **전체 API 스펙**: `living-craft-front/docs/api/API_SPECIFICATION.md`
- **API 개요**: `living-craft-front/docs/api/README.md`

### 공통 응답 형식

모든 API는 `SuccessResponse<T>` 구조로 래핑됩니다:

```typescript
interface SuccessResponse<T> {
    success: true;
    message: string;
    data: T;              // 각 API별 실제 데이터
    timestamp: string;    // ISO 8601
}
```

**에러 응답:**

```json
{
  "success": false,
  "error": "BadRequestException",
  "message": "잘못된 요청입니다.",
  "statusCode": 400,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/..."
}
```

### API 카테고리

#### 1. 인증 API

- `POST /api/lc/auth/login` - 토스 로그인 (Apps-in-Toss appLogin)
- `POST /api/lc/auth/refresh` - 토큰 갱신
- `POST /api/lc/auth/logout` - 로그아웃

**중요**: Apps-in-Toss의 `appLogin()` SDK로 `authorizationCode`를 받아 서버로 전달합니다.

#### 2. 서비스 API

- `GET /api/lc/services` - 서비스 목록 + 지역 정보 + 기본 비용
- `POST /api/lc/services/available-times` - 예약 가능 시간 조회

**주요 필드:**

- `requiresTimeSelection`: 시간 선택 필요 여부 (하루 종일 작업 vs 시간대 선택)
- `serviceableRegions`: 서비스 가능 지역 (지역별 출장비)

#### 3. 포트폴리오 API

- `GET /api/lc/portfolios` - 목록 조회 (카테고리, 페이지네이션)
- `GET /api/lc/portfolios/:id` - 상세 조회

#### 4. 예약 API

- `POST /api/lc/reservations` - 예약 생성
- `GET /api/lc/reservations/:id` - 예약 상세 조회
- `POST /api/lc/reservations/:id/cancel` - 예약 취소

**예약 생성 시 필요한 데이터:**

```typescript
{
    serviceId: string;
    estimateDate: string;          // YYYY-MM-DD
    estimateTime: string;          // HH:mm
    constructionDate: string;      // YYYY-MM-DD
    constructionTime: string | null;  // 하루 종일이면 null
    address: string;               // 도로명 주소
    detailAddress: string;
    customerName: string;
    customerPhone: string;
    memo: string;
    photos: string[];              // 사전 업로드된 URL 배열
}
```

#### 5. 리뷰 API

- `GET /api/lc/reviews` - 리뷰 목록 (필터, 페이지네이션)
- `POST /api/lc/reviews` - 리뷰 작성

#### 6. 사용자 API

- `GET /api/lc/users/me` - 내 정보
- `GET /api/lc/users/me/reservations` - 내 예약 목록
- `GET /api/lc/users/me/reviews` - 내 리뷰 목록

#### 7. 백오피스 API

- 관리자 인증: `POST /api/lc/admin/auth/login`
- 운영 시간 설정: `GET/POST /api/lc/admin/settings/operating-hours`
- 휴무일 관리: `POST /api/lc/admin/settings/holidays`
- 예약 관리: `GET /api/lc/admin/reservations`, `POST /api/lc/admin/reservations/:id/status`
- 서비스/포트폴리오/리뷰/고객 관리

**전체 API 명세**: `living-craft-front/docs/api/API_SPECIFICATION.md` 참조

---

## 개발 워크플로우

### 각 프로젝트 독립 개발

각 프로젝트는 독립적으로 개발 가능합니다:

```bash
# Front 개발
cd living-craft-front
yarn dev

# Backend 개발
cd living-craft-backend
npm run start:dev

# Backoffice 개발
cd living-craft-backoffice
yarn dev
```

### 통합 작업 (API 연동)

API 연동 시 다음 순서를 권장합니다:

1. **API 명세 확인**
    - `living-craft-front/docs/api/API_SPECIFICATION.md` 확인
    - Request/Response 타입 정의 파악

2. **Backend 구현**
    - NestJS 모듈 생성
    - DTO 정의 (API 명세 기반)
    - Service/Controller 구현
    - Swagger 문서 자동 생성 확인

3. **Front 연동**
    - `shared/constants/`의 Mock 데이터를 API 호출로 교체
    - TanStack Query 사용
    - 에러 핸들링 구현

4. **Backoffice 연동**
    - TanStack Query로 Admin API 연동
    - 데이터 테이블 구현

### 공통 명령어

| 작업    | Front            | Backend             | Backoffice   |
|-------|------------------|---------------------|--------------|
| 개발 서버 | `yarn dev`       | `npm run start:dev` | `yarn dev`   |
| 빌드    | `yarn build`     | `npm run build`     | `yarn build` |
| 타입 체크 | `yarn typecheck` | -                   | `yarn build` |
| 린트    | `yarn lint`      | `npm run lint`      | `yarn lint`  |
| 테스트   | `yarn test`      | `npm run test`      | -            |

---

## 프로젝트 간 의존성

### 데이터 흐름

```
┌─────────────────┐
│  Front (고객)    │ ──┐
└─────────────────┘   │
                      │  HTTP API
┌─────────────────┐   │  (REST)
│ Backoffice (관리)│ ──┤
└─────────────────┘   │
                      ↓
              ┌─────────────┐
              │   Backend   │
              │  (NestJS)   │
              └─────────────┘
                      ↓
              ┌─────────────┐
              │ PostgreSQL  │
              └─────────────┘
```

### Front → Backend

- **인증**: Apps-in-Toss `appLogin` → `authorizationCode` → Backend `/api/lc/auth/login`
- **데이터 페칭**: TanStack Query 사용 예정
- **공통 응답**: `SuccessResponse<T>` 구조 파싱
- **API Prefix**: `/api/lc/*`

### Backoffice → Backend

- **인증**: 이메일/비밀번호 기반 관리자 로그인
- **데이터 페칭**: TanStack Query
- **Admin API**: `/api/lc/admin/*` 엔드포인트 사용

### 공통 데이터 구조

API 명세(`living-craft-front/docs/api/API_SPECIFICATION.md`)에 정의된 타입을 기준으로:

- Front는 TypeScript 인터페이스로 구현
- Backend는 NestJS DTO로 구현
- Backoffice는 Zod 스키마 + TypeScript로 구현

---

## API 개발 규칙

### HTTP 메서드 제약사항

⚠️ **중요**: 이 프로젝트에서는 **GET과 POST만 사용**하며, **조회에도 POST를 우선 사용**합니다.

**메서드 사용 원칙:**
- ✅ **GET**: 전체 데이터 조회만 (필터 없음)
  - 예: `GET /api/lc/services` - 모든 서비스 조회
  - 예: `GET /api/lc/portfolios` - 모든 포트폴리오 조회
- ✅ **POST**: 모든 데이터 요청 (필터/검색/페이지네이션 포함)
  - 조회: 필터, 검색어, 페이지네이션 등이 필요하면 POST + body
  - 생성, 수정, 삭제, 상태 변경도 POST
- ❌ **PUT, PATCH, DELETE**: 사용 금지

**이유**:
- REST 원칙보다 실용성 우선
- 쿼리 파라미터보다 body가 더 편리하고 명확
- 복잡한 필터링 조건은 body에 담는 것이 적합

**예시**:
```typescript
// ✅ 올바른 예시 - 조회
@Post('search')  // 필터링/검색이 있는 조회
async searchServices(@Body() dto: SearchServicesDto) {
  // dto: { page, limit, categoryId, region, priceRange, ... }
}

@Get()  // 전체 조회 (필터 없음)
async getAllServices() {
  // 모든 서비스 반환
}

// ✅ 올바른 예시 - 생성/수정/삭제
@Post('admin/services')  // 생성
@Post('admin/services/:id/update')  // 수정
@Post('admin/services/:id/delete')  // 삭제
@Post('admin/services/:id/toggle')  // 활성/비활성 전환

// ❌ 잘못된 예시
@Get('search')  // GET + 쿼리 파라미터 사용 금지
async searchServices(
  @Query('page') page?: number,
  @Query('categoryId') categoryId?: string,
  // ...
) {}

@Put('admin/services/:id')  // PUT 사용 금지
@Patch('admin/services/:id')  // PATCH 사용 금지
@Delete('admin/services/:id')  // DELETE 사용 금지
```

**DTO 작성 예시**:
```typescript
// 검색/필터용 DTO
export class SearchServicesDto {
  @ApiPropertyOptional({ description: '페이지 번호', default: 1 })
  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @ApiPropertyOptional({ description: '페이지당 개수', default: 20 })
  @IsOptional()
  @IsNumber()
  limit?: number = 20;

  @ApiPropertyOptional({ description: '카테고리 ID' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ description: '지역' })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({ description: '검색어' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: '최소 가격' })
  @IsOptional()
  @IsNumber()
  minPrice?: number;

  @ApiPropertyOptional({ description: '최대 가격' })
  @IsOptional()
  @IsNumber()
  maxPrice?: number;
}
```

---

## Backend API 구현 가이드

### 1. 모듈 생성

Living Craft 프로젝트의 모듈은 `src/projects/lc/modules/` 디렉토리에 생성합니다:

```bash
cd living-craft-backend
nest generate module projects/lc/modules/[모듈명] --no-spec
nest generate controller projects/lc/modules/[모듈명] --no-spec
nest generate service projects/lc/modules/[모듈명] --no-spec
```

공유 모듈은 `src/shared/` 디렉토리에 생성합니다.

### 2. DTO 작성

API 명세의 Request/Response 타입을 NestJS DTO로 변환:

```typescript
// API 명세
interface CreateReservationRequest {
    serviceId: string;
    estimateDate: string;
    // ...
}

// NestJS DTO (dto/request/create-reservation.dto.ts)
export class CreateReservationDto {
    @ApiProperty({description: '서비스 ID'})
    @IsString()
    serviceId: string;

    @ApiProperty({description: '견적 날짜', example: '2024-01-15'})
    @IsString()
    @Matches(/^\d{4}-\d{2}-\d{2}$/)
    estimateDate: string;

    // ...
}
```

### 3. 응답 래핑

모든 API 응답은 `SuccessResponse<T>` 구조로 래핑해야 합니다:

```typescript
// 컨트롤러
@Post()
async
createReservation(@Body()
dto: CreateReservationDto
)
{
    const data = await this.reservationService.create(dto);

    return {
        success: true,
        message: '예약이 생성되었습니다.',
        data,
        timestamp: new Date().toISOString(),
    };
}
```

### 4. Swagger 문서화

```typescript

@ApiTags('예약 관리')
@Controller('reservations')
export class ReservationController {
    @Post()
    @ApiOperation({summary: '예약 생성'})
    @ApiResponse({status: 201, description: '예약 생성 성공'})
    @ApiResponse({status: 400, description: '잘못된 요청 데이터'})
    async createReservation(@Body() dto: CreateReservationDto) {
        // ...
    }
}
```

---

## Front API 연동 가이드

### 1. Mock 데이터 → API 호출 전환

```typescript
// Before (shared/constants/services.ts)
export const SERVICES = [
    {id: 'film', title: '인테리어 필름', ...}
];

// After (API 호출)
import {useQuery} from '@tanstack/react-query';

const {data: services} = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
        const response = await axios.get('/api/services');
        return response.data.data; // SuccessResponse.data
    },
});
```

### 2. Axios 설정

```typescript
// lib/api.ts
import axios from 'axios';

const apiClient = axios.create({
    baseURL: process.env.API_URL || 'http://localhost:8000/api/lc',
    headers: {
        'Content-Type': 'application/json',
    },
});

// 인증 토큰 추가
apiClient.interceptors.request.use((config) => {
    const token = getAccessToken(); // 스토어에서 가져오기
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default apiClient;
```

### 3. TanStack Query 설정

```typescript
// src/_app.tsx
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 10000,
            retry: 3,
        },
    },
});

export default function App() {
    return (
        <QueryClientProvider client = {queryClient} >
            {/* ... */}
            < /QueryClientProvider>
    );
}
```

---

## 다음 개발 단계

### Phase 1: Backend 모듈 개발 (현재)

**우선순위 높음:**

1. 인증 모듈 (Apps-in-Toss appLogin 연동)
2. 서비스 모듈 (서비스 목록, 가능 시간 조회)
3. 예약 모듈 (예약 CRUD)

**우선순위 중간:**

4. 포트폴리오 모듈
5. 리뷰 모듈
6. 사용자 모듈

**우선순위 낮음:**

7. 백오피스 Admin API

### Phase 2: Front-Backend API 연동

1. 인증 연동 (appLogin)
2. 서비스/예약 플로우 연동
3. 포트폴리오/리뷰 연동
4. 마이페이지 연동

### Phase 3: Backoffice 기능 구현

1. 관리자 인증
2. 예약 관리 대시보드
3. 서비스/포트폴리오/리뷰 관리
4. 운영 시간 설정

### Phase 4: 추가 기능 (선택)

- 결제 연동
- 알림/푸시 기능
- 데이터 분석 대시보드

---

## 문제 해결

### API 연동 시 자주 발생하는 이슈

1. **CORS 문제**
    - Backend에서 CORS 설정 확인
    - `main.ts`에 `app.enableCors()` 추가

2. **응답 형식 불일치**
    - 모든 API가 `SuccessResponse<T>` 구조 사용하는지 확인
    - 에러 응답도 일관된 형식 사용

3. **인증 토큰 관리**
    - Front: Zustand 스토어에 토큰 저장
    - 모든 API 요청에 `Authorization: Bearer {token}` 헤더 추가

4. **타입 불일치**
    - API 명세의 타입과 실제 구현이 일치하는지 확인
    - Swagger 문서와 비교

### 각 프로젝트 문제 해결

- **Front**: `living-craft-front/CLAUDE.md` → "디버깅 및 문제 해결" 섹션
- **Backend**: `living-craft-backend/CLAUDE.md` → "문제 해결 가이드" 섹션
- **Backoffice**: `living-craft-backoffice/CLAUDE.md` → 해당 섹션 참조

---

## 참고 문서

### API 명세 (필수)

- `living-craft-front/docs/api/API_SPECIFICATION.md` - 전체 API 스펙
- `living-craft-front/docs/api/README.md` - API 개요

### 각 프로젝트 가이드

- `living-craft-front/CLAUDE.md` - Front 상세 가이드
- `living-craft-backend/CLAUDE.md` - Backend 상세 가이드
- `living-craft-backoffice/CLAUDE.md` - Backoffice 상세 가이드

### Apps-in-Toss SDK

- `living-craft-front/docs/sdk/appLogin.md` - 토스 로그인 가이드
- `living-craft-front/docs/sdk/` - 기타 SDK 문서
