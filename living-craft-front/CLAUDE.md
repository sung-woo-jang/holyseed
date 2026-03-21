# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

- 항상 한국말을 할 것
- 존댓말을 사용할 것
- AskUserQuestion 도구로 선택형 질문을 적극 활용할 것
- **Apps-in-Toss MCP 서버를 적극 활용할 것**
  - Apps-in-Toss SDK, API, 기능 관련 질문이나 작업 시 MCP를 통해 최신 문서와 예제를 참조
  - appLogin, 인앱 광고, 딥링크 등 Apps-in-Toss 기능 구현 시 MCP 활용
  - TDS 컴포넌트 사용 시 MCP를 통해 정확한 사용법 확인

## 개발 환경

이 프로젝트는 **Granite.js 기반의 React Native 앱**입니다. Granite는 Toss의 Apps-in-Toss 프레임워크를 사용하여 React Native 앱을 빌드하는 도구입니다.

### 주요 명령어

```bash
# 개발 서버 실행
yarn dev
npx granite dev

# 빌드
yarn build

# 타입 검사
yarn typecheck
npx tsc --noEmit

# 린트
yarn lint           # 검사만
yarn lint:fix       # 자동 수정

# 포맷팅
yarn format         # Prettier로 포맷팅
yarn fix:all        # 린트 + 포맷팅 모두 실행

# 테스트
yarn test
```

## 프로젝트 아키텍처

### 디렉토리 구조

```
living-craft-front/
├── pages/              # 라우트 페이지 (파일 기반 라우팅)
└── src/
    ├── components/     # 도메인별 컴포넌트
    │   ├── ui/        # 재사용 가능한 일반 UI 컴포넌트
    │   ├── home/      # 홈 도메인 컴포넌트
    │   ├── reservation/ # 예약 도메인 컴포넌트
    │   ├── portfolio/ # 포트폴리오 도메인 컴포넌트
    │   └── layouts/   # 레이아웃 컴포넌트
    ├── hooks/          # 공용 커스텀 훅
    ├── api/            # API 호출 함수
    ├── store/          # Zustand 상태 관리
    ├── types/          # 타입 정의
    ├── utils/          # 유틸리티 함수
    ├── constants/      # 상수 정의
    ├── contexts/       # React Context
    ├── mocks/          # Mock 데이터
    ├── _app.tsx        # 앱 루트 컴포넌트
    └── router.gen.ts   # 자동 생성된 라우터 (수정 금지)
```

### Path Alias

TypeScript와 Babel 모두에서 다음 경로 별칭을 사용합니다:

- `@components/*` → `src/components/*`
- `@hooks/*` → `src/hooks/*`
- `@api/*` → `src/api/*`
- `@store/*` → `src/store/*`
- `@types/*` → `src/types/*`
- `@utils/*` → `src/utils/*`
- `@constants/*` → `src/constants/*`
- `@contexts/*` → `src/contexts/*`
- `@mocks/*` → `src/mocks/*`

### 라우팅 시스템

- **파일 기반 라우팅**: `pages/` 디렉토리 내의 파일 구조가 자동으로 라우트가 됩니다
- Granite의 `createRoute` 함수를 사용하여 각 페이지를 정의합니다
- 동적 라우트는 `[id].tsx` 형식의 파일명을 사용합니다
- `src/router.gen.ts`는 자동 생성되므로 직접 수정하지 마세요

### 디렉토리 조직

- **pages**: Granite 파일 기반 라우팅으로 관리되는 라우트 페이지
- **src/components**: 도메인별로 폴더 구분
  - `components/ui`: 재사용 가능한 일반 UI 컴포넌트 (Carousel, Card, FilterTabs, AccordionStep 등)
  - `components/{domain}`: 도메인별 컴포넌트 (home, reservation, portfolio, layouts 등)
- **src/hooks**: 공용 커스텀 훅 (useServices, useReservationForm, useReservationValidation 등)
- **src/api**: API 호출 함수 및 요청 유틸리티
- **src/store**: Zustand 상태 관리 (useReservationStore 등)
- **src/types**: 타입 정의 (ReservationFormData, Service 등)
- **src/utils**: 유틸리티 함수 (날짜 포맷팅, 검증 등)
- **src/constants**: 상수 데이터 (기본값, Mock 데이터 등)
- **src/contexts**: React Context (ScrollContext 등)

### 의존성 규칙

- **pages**는 `src/components`의 컴포넌트를 import 가능
- **컴포넌트**들은 `src/hooks`, `src/api`, `src/store`, `src/types`, `src/utils`, `src/constants`, `src/contexts`를 자유롭게 import 가능
- **순환 참조 피하기**: 컴포넌트가 Route를 직접 import하지 않고, props나 context를 통해 데이터 전달

## 주요 기술 스택

- **프레임워크**: React Native 0.72.6 + Granite.js
- **라우팅**: Granite Router (파일 기반)
- **UI 라이브러리**: @toss/tds-react-native, @granite-js/native
- **빌드 도구**: Granite CLI
- **타입스크립트**: strict mode 활성화
- **린터**: ESLint 9 (Flat Config)

## 개발 가이드

### 새 페이지 추가하기

1. `pages/` 디렉토리에 `.tsx` 파일 생성
2. `createRoute` 함수로 라우트 정의
3. 파일 구조가 자동으로 URL 경로가 됨
    - `pages/about.tsx` → `/about`
    - `pages/portfolio/[id].tsx` → `/portfolio/:id`

### 새 컴포넌트 추가하기

#### 도메인 컴포넌트
1. `src/components/{domain}/` 디렉토리에 컴포넌트 파일 생성
2. 필요한 hooks, store, types 등을 import
3. 도메인 로직이 포함된 컴포넌트 작성

#### 공용 UI 컴포넌트
1. `src/components/ui/` 디렉토리에 컴포넌트 폴더 생성
2. 재사용 가능하고 도메인에 독립적인 컴포넌트 작성
3. TDS 컴포넌트를 확장하거나 커스터마이징

### 타입 안정성

- `noUncheckedIndexedAccess: true` 설정으로 배열 접근 시 `undefined` 체크 필요
- `strict: true`로 모든 엄격한 타입 체크 활성화
- `noUnusedLocals`, `noUnusedParameters` 설정으로 미사용 변수/파라미터 금지

## Granite 설정

`granite.config.ts`에서 앱 설정을 관리합니다:

- 앱 이름: `living-craft`
- URL 스킴: `intoss`
- Apps-in-Toss 플랫폼과 통합

## 참고 문서

프로젝트의 `docs/` 디렉토리에 다음 문서들이 있습니다:

- Carousel 컴포넌트 사용법
- Image 컴포넌트 사용법
- NavigationBar 사용법
- Card 컴포넌트 가이드
- Tabbar 사용법
- Toast 사용법
