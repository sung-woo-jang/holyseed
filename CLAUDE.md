# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

- 항상 한국말을 할 것
- 존댓말을 사용할 것
- AskUserQuestion 도구로 선택형 질문을 적극 활용할 것
- asset-diary-front 부분 화면개발 작업을 할 때는 **Apps-in-Toss MCP 서버를 적극 활용할 것**
    - Apps-in-Toss SDK, API, 기능 관련 질문이나 작업 시 MCP를 통해 최신 문서와 예제를 참조
    - appLogin, 인앱 광고, 딥링크 등 Apps-in-Toss 기능 구현 시 MCP 활용
    - TDS 컴포넌트 사용 시 MCP를 통해 정확한 사용법 확인

---

## 프로젝트 개요

**Asset Diary (자산일기)**는 가구 단위 자산 스냅샷·거래·정기지출을 관리하는 서비스입니다. 토스 앱 내에서 동작하는 Apps-in-Toss 기반의 Mini App과 NestJS 백엔드로 구성되어 있습니다.

---

## 모노레포 구조

```
living-craft/
├── asset-diary-front/       # 자산일기 앱 (React Native, Apps-in-Toss)
│
└── living-craft-backend/    # API 서버 (NestJS)
    └── CLAUDE.md            # Backend 프로젝트 가이드
```

---

## 서브프로젝트 개요

### 1. asset-diary-front (자산일기 앱)

**기술 스택:**

- **프레임워크**: Granite.js + React Native
- **라우팅**: Granite Router (파일 기반)
- **UI**: Toss Design System (@toss/tds-react-native)
- **상태 관리**: Zustand + React Hook Form
- **플랫폼**: Apps-in-Toss (토스 앱 내 Mini App)

### 2. living-craft-backend (API 서버)

**기술 스택:**

- **프레임워크**: NestJS
- **데이터베이스**: PostgreSQL + TypeORM
- **인증**: JWT (Apps-in-Toss appLogin 연동)
- **API 문서**: Swagger

**프로젝트 구조:**

- **AD 프로젝트**: `src/projects/ad/` - Asset Diary 전용 모듈 13개
- **공유 모듈**: `src/shared/` - 파일 업로드, 헬스체크, 주소 검색
- **데이터베이스**: `ad` 스키마로 격리
- **API Prefix**: `/api/ad/*`

**개발 환경:**

- Docker Compose로 PostgreSQL 관리
- 개발 서버: localhost:8000
- Swagger: localhost:8000/ad/docs

**자세한 내용**: `living-craft-backend/CLAUDE.md` 참조

---

## 공통 명령어

| 작업    | asset-diary-front | living-craft-backend |
|-------|------------------|---------------------|
| 개발 서버 | `yarn dev`       | `npm run start:dev` |
| 빌드    | `yarn build`     | `npm run build`     |
| 타입 체크 | `yarn typecheck` | -                   |
| 린트    | `yarn lint`      | `npm run lint`      |
| 테스트   | `yarn test`      | `npm run test`      |

---

## API 개발 규칙

### HTTP 메서드 제약사항

⚠️ **중요**: 이 프로젝트에서는 **GET과 POST만 사용**하며, **조회에도 POST를 우선 사용**합니다.

- ✅ **GET**: 전체 데이터 조회만 (필터 없음)
- ✅ **POST**: 모든 데이터 요청 (필터/검색/페이지네이션 포함), 생성/수정/삭제
- ❌ **PUT, PATCH, DELETE**: 사용 금지

### 공통 응답 형식

```typescript
interface SuccessResponse<T> {
    success: true;
    message: string;
    data: T;
    timestamp: string; // ISO 8601
}
```

---

## Apps-in-Toss SDK

- `asset-diary-front/docs/sdk/` - SDK 문서 (있을 경우)
