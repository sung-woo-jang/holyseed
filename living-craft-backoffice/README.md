# Admin FSD Template

[Shadcn Admin Dashboard](https://github.com/satnaing/shadcn-admin)를 **Feature-Sliced Design (FSD)** 아키텍처에 맞게 마이그레이션한 어드민 대시보드 템플릿입니다.

![Admin Dashboard](public/images/shadcn-admin.png)

## 📌 프로젝트 소개

이 프로젝트는 원본 Shadcn Admin Dashboard의 모든 기능을 유지하면서, 더 나은 확장성과 유지보수성을 위해 **FSD 아키텍처**로 재구조화한 템플릿입니다.

### 원본 프로젝트
- **Repository**: [satnaing/shadcn-admin](https://github.com/satnaing/shadcn-admin)
- **Author**: [@satnaing](https://github.com/satnaing)
- **License**: [MIT License](https://choosealicense.com/licenses/mit/)

### 주요 변경사항
- ✅ **FSD 아키텍처 적용** - 계층별 명확한 책임 분리
- ✅ **모듈화된 구조** - app, pages, widgets, features, entities, shared 레이어
- ✅ **향상된 유지보수성** - 기능별 독립적인 모듈 구성
- ✅ **확장 가능한 설계** - 새로운 기능 추가 시 일관된 패턴 적용

## ✨ 주요 기능

- 🌓 **라이트/다크 모드**
- 📱 **반응형 디자인**
- ♿ **접근성 (Accessibility)**
- 🧭 **내장 사이드바 컴포넌트**
- 🔍 **글로벌 검색 명령**
- 📄 **10+ 페이지**
- 🎨 **커스텀 컴포넌트**
- 🌏 **RTL (Right-to-Left) 지원**

## 🏗️ FSD 아키텍처 구조

```
src/
├── app/                      # 애플리케이션 초기화 및 글로벌 설정
│   ├── App.tsx              # 메인 앱 컴포넌트
│   ├── layout/              # 전역 레이아웃
│   │   └── authenticated-layout/  # 인증 후 레이아웃
│   ├── providers/           # 글로벌 프로바이더
│   │   ├── theme-provider/      # 라이트/다크 모드
│   │   ├── direction-provider/  # RTL/LTR 지원
│   │   ├── font-provider/       # 폰트 선택
│   │   └── query-provider/      # React Query 설정
│   └── routes/              # 라우트 정의 (React Router)
│       └── index.tsx        # 라우트 설정
│
├── pages/                   # 페이지 컴포넌트 (라우트별)
│   ├── auth/               # 인증 페이지
│   │   ├── sign-in/
│   │   ├── sign-up/
│   │   ├── forgot-password/
│   │   └── otp/
│   ├── dashboard/
│   ├── users/
│   ├── tasks/
│   ├── chats/
│   ├── apps/
│   ├── settings/
│   ├── help-center/
│   └── errors/             # 에러 페이지 (401, 403, 404, 500, 503)
│
├── widgets/                # 독립적인 위젯 (복합 UI 블록)
│   ├── header/            # 헤더 위젯
│   └── sidebar/           # 사이드바 위젯
│
├── features/               # 비즈니스 기능 모듈
│   ├── auth/              # 인증 기능
│   │   ├── model/         # Zustand store (인증 상태)
│   │   ├── sign-in/
│   │   ├── sign-up/
│   │   ├── forgot-password/
│   │   ├── otp/
│   │   └── auth-layout/
│   ├── users/             # 사용자 관리 기능
│   │   └── ui/            # 테이블, 다이얼로그, 폼 등
│   ├── tasks/             # 작업 관리 기능
│   ├── chats/             # 채팅 기능
│   ├── dashboard/         # 대시보드 차트 및 위젯
│   ├── settings/          # 설정 페이지 기능
│   ├── layout-config/     # 레이아웃 설정 (사이드바 축약 등)
│   ├── search/            # 글로벌 검색 기능
│   └── help-center/
│
├── entities/              # 비즈니스 엔티티 (도메인 모델)
│   ├── user/             # 사용자 도메인
│   │   ├── model/        # 스키마, 타입 정의
│   │   └── lib/          # 데이터 유틸리티
│   ├── task/             # 작업 도메인
│   ├── chat/             # 채팅 도메인
│   └── app/              # 앱 도메인
│
└── shared/                # 공유 리소스 (재사용 가능)
    ├── assets/           # 아이콘, 로고 등
    │   ├── brand-icons/  # 브랜드 아이콘
    │   ├── custom/       # 커스텀 아이콘
    │   └── logo/
    ├── ui/               # Shadcn UI 컴포넌트 (Radix UI 기반)
    ├── ui-kit/           # 커스텀 공유 컴포넌트
    │   ├── data-table/   # 데이터 테이블 유틸리티
    │   ├── command-menu/ # 검색 명령 메뉴
    │   ├── theme-switch/ # 테마 스위처
    │   └── ...
    ├── lib/              # 유틸리티 함수
    │   ├── utils.ts      # cn(), getPageNumbers()
    │   ├── cookies.ts    # 쿠키 관리
    │   └── handle-server-error.ts  # 에러 핸들링
    ├── hooks/            # 공유 React 훅
    ├── config/           # 설정 파일
    ├── types/            # 공유 타입 정의
    └── styles/           # 글로벌 CSS, Tailwind 설정
```

### FSD 레이어 설명

- **app**: 애플리케이션 설정, 프로바이더, 라우터 등 전역 초기화
- **pages**: 라우트에 매핑되는 페이지 컴포넌트
- **widgets**: 독립적으로 동작하는 큰 UI 블록 (헤더, 사이드바 등)
- **features**: 사용자 시나리오와 비즈니스 로직 (로그인, 사용자 CRUD 등)
- **entities**: 비즈니스 도메인 모델 (User, Task 등)
- **shared**: 프로젝트 전반에서 사용되는 재사용 가능한 코드

## 🛠️ 기술 스택

**UI 프레임워크:** [ShadcnUI](https://ui.shadcn.com) (TailwindCSS + RadixUI)

**빌드 도구:** [Vite](https://vitejs.dev/)

**라우팅:** [React Router v6](https://reactrouter.com/)

**상태 관리:**
- [Zustand](https://zustand-demo.pmnd.rs/) (전역 인증 상태)
- React Context (UI 상태: 테마, 방향, 레이아웃)
- [TanStack Query](https://tanstack.com/query/latest) (서버 상태 관리)

**폼 관리:** [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) (스키마 검증)

**타입 체킹:** [TypeScript](https://www.typescriptlang.org/)

**린팅/포맷팅:** [ESLint](https://eslint.org/) & [Prettier](https://prettier.io/)

**아이콘:** [Lucide Icons](https://lucide.dev/icons/), [Tabler Icons](https://tabler.io/icons)

**HTTP 클라이언트:** [Axios](https://axios-http.com/)

**데이터 테이블:** [TanStack React Table](https://tanstack.com/table/latest)

**차트:** [Recharts](https://recharts.org/)

## 🚀 시작하기

### 프로젝트 클론

```bash
git clone https://github.com/sung-woo-jang/admin-fsd-template.git
```

### 프로젝트 디렉토리로 이동

```bash
cd admin-fsd-template
```

### 의존성 설치

```bash
yarn install
```

### 개발 서버 실행

```bash
yarn dev
```

### 빌드

```bash
yarn build
```

### 프리뷰

```bash
yarn preview
```

## 📝 개발 명령어

```bash
# 타입 체크
yarn tsc -b

# 린트 검사
yarn lint

# 코드 포맷팅
yarn format

# 포맷팅 검사 (변경 없음)
yarn format:check

# 미사용 임포트/익스포트 검사
yarn knip
```

## 🎨 커스터마이징된 컴포넌트

이 프로젝트는 Shadcn UI 컴포넌트를 사용하지만, RTL 지원 및 기타 개선을 위해 일부 컴포넌트가 수정되었습니다.

<details>
<summary>자세히 보기 (클릭하여 펼치기)</summary>

### 수정된 컴포넌트

- scroll-area
- sonner
- separator

### RTL 업데이트 컴포넌트

- alert-dialog
- calendar
- command
- dialog
- dropdown-menu
- select
- table
- sheet
- sidebar
- switch

**참고사항:**
- RTL 지원이 필요하지 않은 경우 'RTL 업데이트 컴포넌트'는 Shadcn CLI를 통해 안전하게 업데이트할 수 있습니다.
- '수정된 컴포넌트'는 다른 커스터마이징이 포함되어 있을 수 있으므로 수동으로 병합이 필요할 수 있습니다.
- 구현 세부 사항은 `src/shared/ui/` 디렉토리의 소스 파일을 확인하세요.

</details>

## 🔑 주요 특징

### 라우팅
- React Router v6 기반 라우팅
- 중첩 라우트 지원
- 인증된 라우트 보호 (`AuthenticatedLayout`)
- 에러 페이지 (401, 403, 404, 500, 503)

### 상태 관리
- **Zustand**: 전역 인증 상태 (`/src/features/auth/model/auth-store.ts`)
- **React Context**: UI 상태 (테마, 방향, 폰트, 레이아웃)
- **TanStack Query**: 서버 상태, 캐싱, 자동 재시도

### 에러 처리
- 401/403: 자동 인증 리셋 및 로그인 페이지로 리다이렉트
- 500: 서버 에러 페이지로 이동
- Toast 알림을 통한 사용자 피드백

## 📖 문서

더 자세한 개발 가이드는 [CLAUDE.md](./CLAUDE.md)를 참고하세요.

## 🙏 크레딧

이 템플릿은 [@satnaing](https://github.com/satnaing)의 [Shadcn Admin Dashboard](https://github.com/satnaing/shadcn-admin)를 기반으로 제작되었습니다.

원본 프로젝트에 기여하고 싶으시다면:
- **원작자 후원**: [GitHub Sponsors](https://github.com/sponsors/satnaing) 또는 [Buy me a coffee](https://buymeacoffee.com/satnaing)
- **문의**: [satnaingdev@gmail.com](mailto:satnaingdev@gmail.com)

## 📄 라이선스

이 프로젝트는 원본 프로젝트와 동일하게 [MIT License](https://choosealicense.com/licenses/mit/)를 따릅니다.
