# ad-front (자산일기)

가구 단위 자산 스냅샷·거래·정기지출 관리 웹앱.

## 기술 스택

- Vite 6 + React 19
- react-router-dom 7
- CSS Modules
- Zustand (전역 상태) + TanStack Query v5 (서버 상태)
- 인증: 이메일/비밀번호 + 구글/네이버 OAuth (JWT, localStorage)

## 개발 환경

- 개발 서버: `localhost:3400`
- `/api` 요청은 `localhost:8000` (holyseed-backend)로 프록시 (`vite.config.ts`)

## 시작하기

```bash
yarn install
yarn dev        # 개발 서버 (:3400)
yarn build      # tsc -b && vite build
yarn typecheck  # tsc --noEmit
yarn lint       # eslint .
```

백엔드(`holyseed-backend`)가 `localhost:8000`에서 함께 떠 있어야 정상 동작함.

## 디렉토리 구조

```
src/
├── api/            # 백엔드 API 호출 함수 (assets, tx, recurring, categories, households, dashboard, comparison)
├── components/
│   ├── charts/     # 차트 컴포넌트
│   ├── common/     # 공통 컴포넌트
│   ├── sheets/     # 바텀시트류
│   └── ui/         # 기본 UI 요소
├── hooks/          # 커스텀 훅
├── lib/            # axios 인스턴스, 카테고리 매핑 등 유틸
├── pages/          # 라우트 페이지 (auth, assets, more, index, NotFound)
├── queries/        # TanStack Query 키/훅 (keys, mutations, useHouseholdData)
├── screens/        # 탭 단위 화면 (Home/Assets/Book/More)
├── stores/         # Zustand 스토어 (auth.store)
├── styles/         # 전역 스타일
├── types/          # API 타입 정의
├── App.tsx         # 라우트 정의
└── main.tsx        # 엔트리포인트
```

## 라우팅

| 경로 | 설명 |
|---|---|
| `/` | 홈 (대시보드) |
| `/login`, `/register` | 이메일 로그인/회원가입 |
| `/auth/onboarding` | 온보딩 (가구 생성/참여) |
| `/auth/join` | 초대로 가구 참여 |
| `/auth/callback` | OAuth(구글/네이버) 콜백 |
| `/assets/:id` | 자산 상세 |
| `/more/cashflow` | 정기지출 관리 |
| `/more/categories` | 카테고리 관리 |
| `/more/compare` | 연도별 비교 |
| `/more/members` | 가구원 관리 |
| `/more/settings` | 설정 |
| `*` | 404 |

전체 라우트는 `AuthBootstrap`으로 감싸 인증 상태 초기화 후 렌더링함.

## API 규칙

- **GET/POST만 사용**, 조회도 POST 우선 (필터/검색/페이지네이션 포함 시 POST)
- PUT/PATCH/DELETE 금지 — 수정/삭제도 `/xxx/update`, `/xxx/delete` POST 엔드포인트로 처리
- 응답 형식: `{ success, message, data, timestamp }`

## 상태 관리

- **Zustand** (`stores/auth.store.ts`): 인증 토큰, 유저, 가구 목록/현재 가구
- **TanStack Query** (`queries/`): 서버 데이터 캐싱/동기화, `queries/keys.ts`에 쿼리 키 정의

## 참고

- 상위 모노레포 가이드: `../CLAUDE.md`
- 백엔드 가이드: `../holyseed-backend/CLAUDE.md`
