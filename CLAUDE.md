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
├── ad-native/                # 자산일기 RN 앱 (Expo, Android 사이드로드 + OTA)
│
├── wedding-front/           # 결혼식 아카이브 웹앱 (Vite + React)
│
└── holyseed-backend/    # API 서버 (NestJS)
    └── CLAUDE.md            # Backend 프로젝트 가이드
```

---

## 개발 환경 = 배포 환경 (맥미니 겸용)

이 맥미니는 로컬 개발 환경이면서 동시에 self-hosted GitHub Actions runner로서 실제 배포(빌드·`pm2 restart`)까지 담당합니다. `deploy-*.yml` 워크플로우는 master push 시 **지금 개발 중인 이 저장소 경로(`/Users/jangseong-u/project/holyseed`)에서 그대로** `git reset --hard origin/master`를 실행합니다.

⚠️ **따라서 커밋되지 않은 로컬 변경은 언제든 덮어써져 유실될 수 있습니다.** 작업을 중단하거나 자리를 비울 때는 항상 커밋(또는 최소한 `git stash`)해두고, uncommitted 상태로 방치하지 않을 것.

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

### 2-1. lab-front (개인 다목적 대시보드)

- Vite 6 + React 19, react-router 7, Tailwind 4 + shadcn/Radix (scss modules 혼용)
- 개발 서버: localhost:4000 (proxy `/api` → :8000), preview/상시 서빙 :4800 (pm2 `lab-front`)
- 2중 사이드바 레이아웃: 1차=섹션 아이콘 바, 2차=섹션 내 페이지 목록
- 섹션 추가 = `src/app/nav/sections.tsx`의 SECTIONS 항목 + `App.tsx` 라우트 추가
- 섹션 6개: **무한매수법**(구 laofus-front 흡수 — `/laofus`, `.laofus-scope` 스타일 격리, 자체 fetch로 `/api/laofus/*` 무인증 호출, laofus-core alias), TQQQ VR, 근무일지, 일정, 저축, 필름 재단
- 무한매수법 판단 로직은 `packages/laofus-core` 공유 (백엔드와 동일 순수함수)

### 2-2. ad-native (자산일기 React Native 앱)

- Expo(managed) + React Native. `ad-front`와 데이터 레이어(auth store, TanStack Query 훅, API 클라이언트)·화면 구성(홈/자산/거래장부/더보기 4탭)을 동일하게 유지하며 네이티브로 재구현한 개인용 Android 사이드로드 앱
- 개발 서버: `cd ad-native && npx expo start` (Expo Go로 QR 스캔) — 임의로 백그라운드 실행 금지, 필요할 때마다 확인 후 포그라운드로 실행
- 로컬 프록시 없이 실기기에서 항상 `https://ad.holyseed.p-e.kr/api/ad`를 직접 호출 (`app.json`의 `extra.apiBaseUrl`)
- **⚠️ 자동 업데이트(OTA) 배포 — ad-native 코드를 수정했다면 반드시 세트로 실행할 것, 사용자에게 재확인 없이 진행**:
  1. `cd ad-native && npm run typecheck`
  2. `npm run publish-update` — `expo export`로 뽑은 JS 번들을 자체 호스팅 Expo Updates 서버(`holyseed-backend`의 `/api/ad-native/updates/manifest`)에 등록. 사용자는 앱을 완전히 껐다 켜기만 하면 재설치 없이 반영됨(핫스왑 아님, 다음 실행부터 적용)
  - 네이티브 모듈 추가·권한 변경·`app.json`의 `scheme`/`updates`/`android.package` 등 네이티브 설정 변경처럼 OTA로 반영 안 되는 경우만 예외: `npx expo prebuild -p android --clean` → `cd android && ./gradlew assembleRelease`로 APK를 다시 빌드하고, 이 경우엔 사용자에게 새 APK 파일을 직접 전달해 재설치를 요청할 것
- 백엔드 쪽 구현: `holyseed-backend/src/projects/ad-native/modules/updates/` (Expo Updates 프로토콜 v1, 코드 서명 없음). 관련 env: `AD_NATIVE_UPDATES_DIR`(업데이트 번들 저장 위치, 기본 `~/ad-native-updates` — 배포 시 git clean에 안 지워지도록 레포 밖 경로), `AD_NATIVE_UPDATES_PUBLIC_URL`(에셋 다운로드 URL 베이스, 기본 `https://ad.holyseed.p-e.kr` — 공유 `PUBLIC_BASE_URL`과 실제 라우팅 도메인이 달라 재사용하면 404 남, 절대 재사용하지 말 것)

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
  - `laofus-backend`는 8001 포트 전용(holyseed-backend 8000과 분리, 2026-07-23 포트충돌 크래시 수정). ad-hoc `nest dev`(8000)는 `holyseed-backend`와 충돌하니 그쪽을 `pm2 stop`. 백엔드 수정 반영은 `yarn workspace @holyseed/backend build && pm2 delete laofus-backend && pm2 start ecosystem.local.config.js --only laofus-backend` (단순 `pm2 restart`는 pm2가 캐싱한 구 env를 재사용해 LIVE/SCHEDULER가 조용히 꺼진 채 남을 수 있음 — 2026-07-23 실제 발생)
  - **주의**: 무매 잔금은 `laofus.engine_state.cash` 기준 (계좌 예수금 아님). 계좌-DB 보유수량 불일치 시 엔진이 주문 중단
  - 방법론 문서·운용 규칙: `docs/laofus/README.md` 필독. 시드: `yarn laofus:seed`. 대시보드 상시 서빙 :4800 (pm2 `lab-front`, 무한매수법 섹션 `/laofus`)
- **LAB 프로젝트**: `src/projects/lab/` - 개인 다목적 대시보드 (`lab` 스키마, `/api/lab/*`)
  - 자체 이메일/비번 JWT 인증 (lab.users)
  - 모듈: film-optimizer(필름 재단), vr(TQQQ 밸류 리밸런싱), worklog(근무일지·급여계산), schedule(일정), saving(1억 저축 플래너)
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

루트에서: `yarn dev:ad`, `yarn dev:back`, `yarn build:ad`, `yarn typecheck:ad`, `yarn dev:lab`, `yarn build:lab`, `yarn typecheck:lab`, `yarn dev:ad-native`, `yarn typecheck:ad-native`

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
