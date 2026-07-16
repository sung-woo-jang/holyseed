# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

- 항상 한국말을 할 것
- 존댓말을 사용할 것
- AskUserQuestion 도구로 선택형 질문을 적극 활용할 것

---

## 프로젝트 개요

**Asset Diary (자산일기)**는 가구 단위 자산 스냅샷·거래·정기지출을 관리하는 서비스입니다. Vite 기반 웹앱과 NestJS 백엔드로 구성되어 있습니다.

---

## 모노레포 구조

```
holyseed/
├── ad-front/                # 자산일기 웹앱 (Vite + React)
│
├── wedding-front/           # 결혼식 아카이브 웹앱 (Vite + React)
│
└── holyseed-backend/    # API 서버 (NestJS)
    └── CLAUDE.md            # Backend 프로젝트 가이드
```

---

## 서브프로젝트 개요

### 1. ad-front (자산일기 웹앱)

**기술 스택:**

- **프레임워크**: Vite 6 + React 19
- **라우팅**: react-router-dom 7
- **스타일링**: CSS Modules
- **상태 관리**: Zustand + TanStack Query v5
- **인증**: 이메일/비밀번호 + 구글/네이버 OAuth (JWT, localStorage)
- **개발 서버**: localhost:3400 (proxy `/api` → localhost:8000)

### 2. wedding-front (결혼식 아카이브)

- Vite 6 + React 19 + CSS Modules, FSD 구조
- 개발 서버: localhost:3600

### 2-1. laofus-front (SOXL 무한매수법 대시보드)

- Vite 6 + React 19, react-router 7
- 개발 서버: localhost:3800 (proxy `/api` → :8000)
- 화면: 홈(판단 미리보기+시뮬레이터)/차트/사이클/계좌/시스템
- 판단 로직은 `packages/laofus-core` 공유 (백엔드와 동일 순수함수)

### 2-2. lab-front (개인 다목적 대시보드)

- Vite 6 + React 19, react-router 7, Tailwind 4 + shadcn/Radix (scss modules 혼용)
- 개발 서버: localhost:4000 (proxy `/api` → :8000), preview 5000
- 2중 사이드바 레이아웃: 1차=섹션 아이콘 바, 2차=섹션 내 페이지 목록
- 섹션 추가 = `src/app/nav/sections.tsx`의 SECTIONS 항목 + `App.tsx` 라우트 추가
- 현재 섹션: 노션 기록(틀만), 필름 재단 최적화(옛 living-craft film-optimizer 복원 이식)

### 3. holyseed-backend (API 서버)

**기술 스택:**

- **프레임워크**: NestJS
- **데이터베이스**: PostgreSQL + TypeORM (synchronize: true)
- **인증**: JWT
- **API 문서**: Swagger

**프로젝트 구조:**

- **AD 프로젝트**: `src/projects/ad/` - Asset Diary 모듈 (`ad` 스키마, `/api/ad/*`)
- **WEDDING 프로젝트**: `src/projects/wedding/` (`wedding` 스키마, `/api/wedding/*`)
- **LAOFUS 프로젝트**: `src/projects/laofus/` - SOXL 무한매수법 자동매매 (`laofus` 스키마, `/api/laofus/*`)
  - 토스증권 Open API로 미국 장마감 65분 전(KST 03:55/04:55 cron — 소수점 주문 당일 체결 컷오프 대응) LOC 에뮬레이션 매매
  - **⚠️ LIVE 운용 중 (2026-07-15~)**: pm2 `laofus-backend`가 상시 가동하며 실주문 담당. `.env`는 항상 `LAOFUS_LIVE=false`/`LAOFUS_SCHEDULER=false`(안전 기본값) — LIVE는 `ecosystem.local.config.js`의 pm2 env 주입으로만
  - ad-hoc `nest dev` 전 반드시 `pm2 stop laofus-backend` (포트 8000 충돌), 끝나면 `pm2 start laofus-backend`. 백엔드 수정 반영은 `yarn workspace @holyseed/backend build && pm2 restart laofus-backend`
  - **주의**: 무매 잔금은 `laofus.engine_state.cash` 기준 (계좌 예수금 아님). 계좌-DB 보유수량 불일치 시 엔진이 주문 중단
  - 방법론 문서·운용 규칙: `docs/laofus/README.md` 필독. 시드: `yarn laofus:seed`. 대시보드 상시 서빙 :4800 (pm2 `laofus-front`)
- **LAB 프로젝트**: `src/projects/lab/` - 개인 다목적 대시보드 (`lab` 스키마, `/api/lab/*`)
  - 자체 이메일/비번 JWT 인증 (lab.users) + film-optimizer(필름지/재단 프로젝트/조각 CRUD)
- **공유 모듈**: `src/shared/` - 파일 업로드, 헬스체크, 주소 검색

**개발 환경:**

- Docker Compose로 PostgreSQL 관리
- 개발 서버: localhost:8000
- Swagger: localhost:8000/ad/docs, localhost:8000/wedding/docs

**자세한 내용**: `holyseed-backend/CLAUDE.md` 참조

---

## 공통 명령어

| 작업    | ad-front         | holyseed-backend |
|-------|------------------|---------------------|
| 개발 서버 | `yarn dev`       | `npm run start:dev` |
| 빌드    | `yarn build`     | `npm run build`     |
| 타입 체크 | `yarn typecheck` | -                   |
| 린트    | `yarn lint`      | `npm run lint`      |
| 테스트   | -                | `npm run test`      |

루트에서: `yarn dev:ad`, `yarn dev:back`, `yarn build:ad`, `yarn typecheck:ad`, `yarn dev:lab`, `yarn build:lab`, `yarn typecheck:lab`

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
