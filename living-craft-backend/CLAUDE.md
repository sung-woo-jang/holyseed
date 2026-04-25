# CLAUDE.md

이 파일은 NestJS 클린 템플릿 프로젝트에서 Claude Code가 코드 작업을 할 때 가이드를 제공합니다.

## 프로젝트 개요

**Living Craft Backend** - 멀티 프로젝트 아키텍처를 지원하는 NestJS 기반 백엔드 서버입니다.

### 멀티 프로젝트 구조

이 백엔드는 여러 프로젝트를 하나의 서버에서 관리할 수 있도록 설계되었습니다:

- **프로젝트 격리**: 각 프로젝트는 독립된 API 경로, 데이터베이스 스키마, 모듈을 가집니다
- **공유 모듈**: 파일 업로드, 헬스 체크 등 공통 기능은 공유 모듈로 관리
- **스키마 분리**: 각 프로젝트는 별도의 PostgreSQL 스키마를 사용하여 데이터 격리

### ZC (Zippt Crawler) 프로젝트

- **API Prefix**: `/api/zc/*`
- **데이터베이스 스키마**: `zc`
- **모듈 위치**: `src/projects/zc/`
- **Swagger 문서**: `/zc/docs`

### 공유 모듈

- **파일 업로드**: 이미지 및 문서 업로드 기능 (Multer + Sharp + NCP Object Storage)
- **헬스 체크**: 서버 상태 모니터링
- **주소 검색**: 주소 검색 API 프록시

## 개발 명령어

### 기본 명령어
```bash
# 의존성 설치
npm install

# 개발 서버 실행 (hot reload)
npm run start:dev

# 프로덕션 빌드 및 실행
npm run build
npm run start:prod
```

### Docker 인프라 관리
```bash
# PostgreSQL, pgAdmin 시작
npm run docker:dev:up

# 서비스 중지
npm run docker:dev:down

# 로그 확인
npm run docker:dev:logs

# 상태 확인
npm run docker:dev:status
```

### 데이터베이스 작업
```bash
# 마이그레이션 실행
npm run migration:run

# 마이그레이션 생성
npm run migration:generate -- -n MigrationName

# 마이그레이션 되돌리기
npm run migration:revert
```

### 테스트 및 코드 품질
```bash
# 유닛 테스트
npm run test

# 커버리지 포함 테스트
npm run test:cov

# Watch 모드 테스트
npm run test:watch

# 린팅
npm run lint

# 코드 포맷팅
npm run format
```

## 프로젝트 아키텍처

### 핵심 기술 스택
- **Backend**: NestJS with TypeScript
- **Database**: PostgreSQL with TypeORM
- **File Upload**: Multer
- **API Documentation**: Swagger

### 디렉토리 구조

```
src/
├── projects/           # 프로젝트별 모듈
│   └── zc/            # ZC (Zippt Crawler) 프로젝트
├── shared/            # 공유 모듈
│   ├── files/        # 파일 업로드
│   ├── health/       # 헬스 체크
│   ├── address/      # 주소 검색
│   └── shared.module.ts
├── common/            # 공통 유틸리티
├── config/            # 설정 파일
└── database/          # 데이터베이스 설정
```

### 주요 설계 패턴

**경로 별칭** (Jest 및 tsconfig에서 설정됨):
- `@/` → `src/`
- `@common/` → `src/common/`
- `@config/` → `src/config/`
- `@database/` → `src/database/`
- `@zc/` → `src/projects/zc/`
- `@shared/` → `src/shared/`

**글로벌 필터**:
- `HttpExceptionFilter`를 통한 전역 예외 처리

**데이터베이스 전략**:
- TypeORM을 사용한 엔티티 우선 접근법
- 공통 필드(id, timestamps)를 위한 Base Entity 패턴 사용
- **synchronize: 항상 true (개발/프로덕션 모두)**
  - ⚠️ **중요**: 이 프로젝트는 1인 운영 프로젝트로 데이터 중요도가 낮고 편의성을 우선시합니다
  - 마이그레이션 파일 관리 없이 엔티티 변경 시 자동으로 DB 스키마 동기화
  - **절대 synchronize: false로 변경하지 마세요**
- **프로젝트별 스키마 분리**: 각 프로젝트는 별도의 PostgreSQL 스키마 사용 (현재: ZC → `zc` 스키마)

**멀티 프로젝트 패턴**:
- 각 프로젝트는 `src/projects/{project-name}/` 디렉토리에 위치
- 프로젝트별로 독립적인 모듈, 컨트롤러, 서비스 구성
- Global Prefix로 API 경로 분리 (예: `/api/zc/*`)
- Swagger 문서도 프로젝트별로 분리

## 개발 환경 설정

### 사전 요구사항
- Node.js 18+
- Docker & Docker Compose

### 로컬 개발 환경
1. 하이브리드 접근법 사용: Docker는 인프라용, 로컬 Node.js는 앱용
2. 데이터베이스, pgAdmin은 컨테이너에서 실행 (설정 간편화)
3. NestJS 앱은 로컬에서 실행 (디버깅 경험 향상)

### 환경 변수 설정
- `.env` 파일 사용, `.env.local`로 폴백
- 데이터베이스 기본값: localhost:5432, postgres/password123, living_craft_dev
- 데이터베이스 스키마: zc (ZC 프로젝트 전용)

### 개발 환경 접속 포인트
- API 서버: http://localhost:8000
- ZC Swagger: http://localhost:8000/zc/docs
- 헬스 체크: http://localhost:8000/health
- pgAdmin: http://localhost:5050 (admin@livingcraft.com / admin123)

## 코딩 컨벤션 및 스타일 가이드

### 기본 원칙

- **정보 부족 시**: 명확히 요청하고 필요한 정보를 구체적으로 요구
- **개선점 발견 시**: 먼저 개선점을 설명하고 계획을 제시한 후 작업
- **모든 응답**: 한국어로 작성
- **직접 수정 금지**: 분석 및 계획 단계를 거친 후 수정

### 네이밍 컨벤션

#### 파일 및 폴더 구조

```typescript
// 폴더명: kebab-case
user-profile/
product-catalog/

// 모듈 파일: PascalCase
UserController.ts
ProductService.ts
OrderEntity.ts

// 일반 파일: camelCase
emailValidator.ts
dateFormatter.ts
stringHelper.ts
```

#### 변수 및 상수

```typescript
// 변수: camelCase
const userName = 'john';
const productList = [];
const totalAmount = 1000;

// Boolean 변수: is/has/can prefix
const isLoading = true;
const hasPermission = false;
const canEdit = true;

// 상수: UPPER_SNAKE_CASE
const BASE_URL = 'https://api.example.com';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Enum
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest',
}
```

#### 함수 네이밍

```typescript
// Event handlers: handle + Target + Event
const handleSubmitButtonClick = () => {};
const handleFormSubmit = () => {};

// Service functions (CRUD)
const fetchUserProfile = async () => {};
const createProduct = async () => {};
const updateOrderStatus = async () => {};
const deleteProduct = async () => {};

// Validation functions
const validateEmail = (email: string) => boolean;
const isValidPhoneNumber = (phone: string) => boolean;
```

#### 타입 정의

```typescript
// Interface: I prefix
interface IUserProfile {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}

// DTO Interface
interface ICreateProductRequest {
  name: string;
  price: number;
  description?: string;
}

// Response Type: T prefix
type TApiResponse<T> = {
  data: T;
  message: string;
  success: boolean;
  statusCode: number;
};
```

### 파일 구조 패턴

#### 모듈 구조

새 프로젝트의 모듈은 `src/projects/{project-name}/modules/` 아래에 위치합니다:

```
src/projects/{project-name}/modules/
└── module-name/
    ├── dto/
    │   ├── request/
    │   │   ├── create-item.dto.ts
    │   │   ├── update-item.dto.ts
    │   │   └── index.ts
    │   ├── response/
    │   │   ├── item-response.dto.ts
    │   │   └── index.ts
    │   └── index.ts
    ├── entities/
    │   ├── item.entity.ts
    │   └── index.ts
    ├── module-name.controller.ts
    ├── module-name.service.ts
    ├── module-name.module.ts
    └── index.ts
```

공유 모듈은 `src/shared/` 아래에 위치합니다.

#### 엔티티 작성 패턴

```typescript
import { Entity, Column } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';

@Entity('products', { schema: 'your_schema' })  // 프로젝트 스키마 지정
export class Product extends BaseEntity {
  @Column({ length: 200 })
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'stock_quantity', default: 0 })
  stockQuantity: number;
}
```

**중요**: 모든 엔티티에 `{ schema: '{project_name}' }` 옵션을 지정해야 합니다.

#### DTO 작성 패턴

```typescript
import { IsString, IsNumber, IsOptional, Min, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({
    description: '상품명',
    example: '노트북'
  })
  @IsString({ message: '상품명은 문자열이어야 합니다.' })
  @MaxLength(200, { message: '상품명은 200자를 초과할 수 없습니다.' })
  @Transform(({ value }) => value?.trim())
  name: string;

  @ApiProperty({
    description: '가격',
    example: 1500000
  })
  @IsNumber({}, { message: '가격은 숫자여야 합니다.' })
  @Min(0, { message: '가격은 0 이상이어야 합니다.' })
  price: number;

  @ApiPropertyOptional({
    description: '상품 설명',
    example: '고성능 노트북'
  })
  @IsOptional()
  @IsString({ message: '설명은 문자열이어야 합니다.' })
  @Transform(({ value }) => value?.trim())
  description?: string;
}
```

#### 서비스 작성 패턴

```typescript
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/request/create-product.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async createProduct(dto: CreateProductDto): Promise<Product> {
    // Early return pattern
    if (dto.price < 0) {
      throw new BadRequestException('가격은 0 이상이어야 합니다.');
    }

    const product = this.productRepository.create(dto);
    return await this.productRepository.save(product);
  }

  async findProductById(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('상품을 찾을 수 없습니다.');
    }

    return product;
  }
}
```

### 공통 패턴 및 규칙

#### API 응답 형식

```typescript
// 성공 응답
{
  "success": true,
  "data": { /* 실제 데이터 */ },
  "message": "요청이 성공적으로 처리되었습니다.",
  "statusCode": 200
}

// 에러 응답
{
  "success": false,
  "error": "BadRequestException",
  "message": "잘못된 요청입니다.",
  "statusCode": 400,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/products"
}
```

### API 개발 규칙

#### HTTP 메서드 제약사항

⚠️ **중요**: 이 프로젝트에서는 **GET과 POST만 사용**하며, **조회에도 POST를 우선 사용**합니다.

**메서드 사용 원칙:**
- ✅ **GET**: 전체 데이터 조회만 (필터 없음)
  - 예: `GET /api/products` - 모든 제품 조회
  - 예: `GET /api/categories` - 모든 카테고리 조회
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
async searchProducts(@Body() dto: SearchProductsDto) {
  // dto: { page, limit, categoryId, brandId, search, priceRange, ... }
}

@Get()  // 전체 조회 (필터 없음)
async getAllProducts() {
  // 모든 제품 반환
}

// ✅ 올바른 예시 - 생성/수정/삭제
@Post('admin')  // 생성
@Post('admin/:id/update')  // 수정
@Post('admin/:id/delete')  // 삭제
@Post('admin/:id/toggle')  // 상태 변경

// ❌ 잘못된 예시
@Get('search')  // GET + 쿼리 파라미터 사용 금지
async searchProducts(
  @Query('page') page?: number,
  @Query('categoryId') categoryId?: string,
  // ...
) {}

@Put('admin/:id')  // PUT 사용 금지
@Patch('admin/:id')  // PATCH 사용 금지
@Delete('admin/:id')  // DELETE 사용 금지
```

**DTO 작성 예시**:
```typescript
// 검색/필터용 DTO
export class SearchProductsDto {
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

  @ApiPropertyOptional({ description: '브랜드 ID' })
  @IsOptional()
  @IsString()
  brandId?: string;

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

#### 컨트롤러 작성 패턴

```typescript
import { Controller, Post, Get, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/request/create-product.dto';

@Controller('products')
@ApiTags('상품 관리')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @ApiOperation({ summary: '새 상품 생성' })
  @ApiResponse({ status: 201, description: '상품 생성 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청 데이터' })
  async createProduct(@Body() dto: CreateProductDto) {
    return await this.productService.createProduct(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: '상품 상세 조회' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 404, description: '상품을 찾을 수 없음' })
  async getProduct(@Param('id', ParseIntPipe) id: number) {
    return await this.productService.findProductById(id);
  }
}
```

### TypeScript 및 Import 규칙

```typescript
// 좋은 예: 경로 별칭 사용
import { BaseEntity } from '@common/entities/base.entity';
import { HttpExceptionFilter } from '@common/filters/http-exception.filter';
import { Product } from '@zc/modules/products/entities/product.entity';
import { FileService } from '@shared/files/file.service';

// 나쁜 예: 상대 경로 남용
import { BaseEntity } from '../../common/entities/base.entity';
import { Product } from '../products/entities/product.entity';
```

### 리팩토링 가이드

#### 허용 범위 (✅ 허용)

- **Early Return Pattern**: 조건문을 early return 방식으로 변경
- **네이밍 개선**: 컨벤션에 맞게 변수명, 함수명 수정
- **코드 정리**: 불필요한 중복 제거, 가독성 향상
- **구조 개선**: 함수 분리, 로직 정리 (과도하지 않은 선에서)
- **타입 개선**: TypeScript 타입 정확성 향상
- **에러 메시지 한국어화**: 사용자 친화적 에러 메시지

#### 금지사항 (❌ 금지)

- **비즈니스 로직 변경**: 기능적 동작 수정 금지
- **새 파일 생성**: 컴포넌트 분리, 유틸 함수 분리 등
- **상수 추출**: 특정 값을 별도 상수로 분리
- **모듈 분리**: 대규모 구조 변경
- **과도한 리팩토링**: 필요 없어 보이면 하지 않기

## 테스트 전략

### 현재 설정
- Jest에 경로 매핑 설정됨
- 단위 테스트는 `*.spec.ts` 파일에 작성
- 커버리지 리포트 기능 사용 가능

### 테스트 데이터베이스
- 개발 환경과 동일한 PostgreSQL 설정 사용
- 실제 데이터베이스 대상 테스트 (모킹 없음)

## 개발 시 주의사항

1. **프로젝트 탐색**: 정보 부족 시 기존 코드베이스에서 패턴 확인
2. **Early Return 패턴**: 조건문은 early return 방식으로 작성 권장
3. **에러 메시지 한국어화**: 사용자 친화적인 한국어 에러 메시지 사용
4. **TypeORM 관계 설정**: 명시적인 JoinColumn과 관계 이름 설정
5. **API 문서화**: Swagger 데코레이터로 API 문서 작성 필수
6. **환경 변수 검증**: 중요한 환경 변수는 validation schema에서 검증
7. **전역 필터 활용**: HttpExceptionFilter가 자동으로 에러 응답 포맷팅

## 새로운 프로젝트 추가 방법

멀티 프로젝트 아키텍처에서 새로운 프로젝트를 추가하려면:

### 1. 프로젝트 디렉토리 생성

```bash
mkdir -p src/projects/{project-name}/modules
```

### 2. 프로젝트 모듈 생성

```typescript
// src/projects/{project-name}/{project-name}.module.ts
import { Module } from '@nestjs/common';

@Module({
  imports: [
    // 프로젝트의 모듈들을 import
  ],
})
export class ProjectNameModule {}
```

### 3. 데이터베이스 스키마 생성

PostgreSQL에서 새 스키마를 생성합니다:

```sql
CREATE SCHEMA IF NOT EXISTS {project_name};
```

### 4. 엔티티에 스키마 지정

모든 엔티티에 `{ schema: '{project_name}' }` 옵션을 추가합니다.

### 5. AppModule에 등록

```typescript
// src/app.module.ts
import { ProjectNameModule } from './projects/{project-name}/{project-name}.module';

@Module({
  imports: [
    // ...
    ProjectNameModule,
  ],
})
export class AppModule {}
```

### 6. Global Prefix 설정

```typescript
// src/main.ts
const app = await NestFactory.create(AppModule);
app.setGlobalPrefix('api/{project-name}');
```

### 7. Swagger 설정 (선택사항)

프로젝트별 Swagger 문서를 설정합니다.

## 환경별 설정

### 개발 환경 (Development)
- 포트: 8000
- 데이터베이스: living_craft_dev
- 스키마: zc (ZC Crawler)
- **synchronize: true** (자동 스키마 동기화)
- 로깅: 활성화
- Swagger UI: 활성화

### 프로덕션 환경 (Production)
- 포트: 환경변수로 설정
- 데이터베이스: 프로덕션 DB
- 스키마: zc
- **synchronize: true** ⚠️ 1인 운영 프로젝트로 편의성 우선 (마이그레이션 미사용)
- 로깅: 에러만
- Swagger UI: 비활성화

## MCP 서버 설정

이 프로젝트는 Claude Code와 함께 사용할 수 있는 MCP(Model Context Protocol) 서버가 구성되어 있습니다.

### 설치된 MCP 서버

#### 1. docker-mcp
Docker 컨테이너와 Compose 스택을 Claude로 직접 관리할 수 있습니다.

**사용 예시**:
- "living_craft_postgres 컨테이너 로그 보여줘"
- "docker-compose 서비스 상태 확인해줘"
- "PostgreSQL 컨테이너 재시작해줘"
- "실행 중인 모든 컨테이너 목록 보여줘"

#### 2. postgres (PostgreSQL MCP 서버)
데이터베이스 스키마 탐색 및 읽기 전용 쿼리를 실행할 수 있습니다.

**사용 예시**:
- "living_craft 데이터베이스의 모든 테이블 보여줘"
- "특정 테이블 스키마 알려줘"
- "최근 데이터 10개 조회해줘"
- "Entity와 실제 DB 스키마 비교해줘"

**보안 참고사항**:
- PostgreSQL MCP는 읽기 전용으로 설정되어 있습니다
- 데이터 수정(INSERT/UPDATE/DELETE)은 불가능합니다
- 프로덕션 데이터베이스 연결 시 주의하세요

#### 3. postman (Postman MCP 서버)
Postman 워크스페이스, 컬렉션, 환경 변수 등을 Claude로 직접 관리할 수 있습니다.

**사용 예시**:
- "내 Postman 워크스페이스 목록 보여줘"
- "특정 컬렉션의 API 요청들 확인해줘"
- "새로운 환경 변수 추가해줘"
- "컬렉션 문서 업데이트해줘"
- "API 테스트 실행해줘"

**참고사항**:
- Postman API 키가 필요합니다
- Minimal/Full/Code 세 가지 구성 중 선택 가능
- 현재 Minimal 구성으로 설치되어 있습니다 (기본 작업 수행)

### MCP 서버 관리 명령어

```bash
# MCP 서버 목록 확인
claude mcp list

# MCP 서버 상세 정보
claude mcp get docker-mcp
claude mcp get postgres
claude mcp get postman

# MCP 서버 제거 (필요시)
claude mcp remove docker-mcp
claude mcp remove postgres
claude mcp remove postman
```

### 새로운 MCP 서버 추가

```bash
# stdio 방식 MCP 서버 추가
claude mcp add --transport stdio <서버명> -- npx -y <패키지명> [인자...]

# 예시: SQLite MCP 서버 추가
claude mcp add --transport stdio sqlite -- npx -y @modelcontextprotocol/server-sqlite ./database.db
```

## 문제 해결 가이드

### Docker 컨테이너 문제
```bash
# 컨테이너 완전 재시작
npm run docker:dev:down
npm run docker:dev:up

# 로그 확인
npm run docker:dev:logs
```

### 데이터베이스 연결 실패
```bash
# PostgreSQL 상태 확인
docker exec -it living_craft_postgres_dev pg_isready -U postgres

# 데이터베이스 접속 테스트
docker exec -it living_craft_postgres_dev psql -U postgres -d living_craft_dev
```

### 마이그레이션 문제
```bash
# 마이그레이션 상태 확인
npm run migration:show

# 마이그레이션 강제 실행
npm run migration:run
```

### MCP 서버 연결 문제
```bash
# MCP 서버 상태 확인
claude mcp list

# Claude Code 재시작
# MCP 서버 설정 변경 후에는 Claude Code를 재시작해야 합니다
```
