# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

- 항상 한국말을 할 것
- 존댓말을 사용할 것
- AskUserQuestion 도구로 선택형 질문을 적극 활용할 것
- **Apps-in-Toss MCP 서버를 적극 활용할 것**
  - Apps-in-Toss SDK, API, 기능 관련 질문이나 작업 시 MCP를 통해 최신 문서와 예제를 참조
  - appLogin, 인앱 광고, 딥링크 등 Apps-in-Toss 기능 구현 시 MCP 활용
  - TDS 컴포넌트 사용 시 MCP를 통해 정확한 사용법 확인

---

## 프로젝트 개요

**Apps-in-Toss 미니앱 스타터** — Granite.js + React Native 기반 클린 스타터입니다.  
현재 `pages/index.tsx`만 존재하는 최소 상태입니다. 새 미니앱 개발 시 여기서 시작하세요.

### 기술 스택

- **프레임워크**: `@apps-in-toss/framework` 2.0.5 + Granite 1.0.4 + React Native 0.84.0
- **UI**: `@toss/tds-react-native` 2.0.2 (TDS Mobile RN)
- **라우팅**: Granite Router (파일 기반, `pages/` 디렉토리)
- **플랫폼**: Apps-in-Toss (토스 앱 내 Mini App)
- **빌드**: Granite CLI (`yarn dev` / `yarn build`)
- **타입스크립트**: strict mode

---

## 개발 명령어

```bash
yarn dev          # 개발 서버
yarn build        # 빌드 (ait build)
yarn typecheck    # 타입 검사
yarn lint         # 린트
yarn lint:fix     # 린트 자동 수정
yarn format       # Prettier 포맷팅
yarn test         # 테스트
```

---

## 프로젝트 구조

```
living-craft-front/
├── pages/
│   ├── _layout.tsx    # 전역 레이아웃 (모든 페이지 공통 래퍼)
│   └── index.tsx      # 홈 페이지 stub
├── src/
│   ├── _app.tsx       # 앱 루트 (AppsInToss + TDSProvider)
│   └── router.gen.ts  # 자동 생성 — 수정 금지
├── granite.config.ts   # Granite 앱 설정 (appName, brand, permissions)
├── index.ts            # 앱 진입점 (register(App))
└── tsconfig.json       # TypeScript 설정 (@/* alias)
```

---

## 레이아웃 시스템

- `pages/_layout.tsx` — 모든 페이지에 전역 적용되는 레이아웃
- `pages/about/_layout.tsx` — `about` 하위 페이지에만 적용되는 섹션 레이아웃
- 레이아웃은 중첩 가능 (상위 → 하위 순서로 적용)

`_app.tsx`는 Provider(TDSProvider 등) 전용이고, 시각적 레이아웃은 `_layout.tsx`에서 담당.

---

## 라우팅 시스템

- `pages/` 디렉토리의 파일 구조 → 자동으로 URL 경로
  - `pages/index.tsx` → `/`
  - `pages/about.tsx` → `/about`
  - `pages/portfolio/[id].tsx` → `/portfolio/:id`
- `createRoute` 함수로 각 페이지 정의
- `src/router.gen.ts`는 자동 생성 — **직접 수정 금지**

---

## 새 페이지 추가

```tsx
import { createRoute } from '@granite-js/react-native';

export const Route = createRoute('/my-page', {
  component: Page,
});

function Page() {
  // ...
}
```

---

## TDS (Toss Design System) 사용

TDS RN 컴포넌트 사용 시 **Apps-in-Toss MCP를 통해 정확한 import 경로와 사용법 확인**:

```tsx
import { Text, Button } from '@toss/tds-react-native';
```

---

## Granite 설정 (`granite.config.ts`)

- `appName`: 앱 식별자 (현재: `living-craft`)
- `scheme`: `intoss` (토스 앱 딥링크 스킴)
- `displayName`, `primaryColor`: 앱 브랜드 설정
- `permissions`: camera, photos 등 권한 설정

새 프로젝트 시작 시 `appName`과 `displayName`을 변경하세요.
