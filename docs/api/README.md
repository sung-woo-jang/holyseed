# Living Craft API 문서화

## 프로젝트 개요

**Living Craft**는 출장 서비스 예약 플랫폼입니다. 인테리어 필름 시공, 유리 청소 등의 출장 서비스를 예약할 수 있습니다.

### 서비스 특징
- 1인 운영 서비스 (숨고와 유사하지만 단일 사업자)
- 토스 앱 내에서 동작하는 Apps-in-Toss 앱
- 고객용 앱 + 관리자용 백오피스 구조

---

## API 문서 위치

이 API 문서는 모노레포 구조에서 다음 위치에 있습니다:

```
living-craft/docs/api/
```

**모든 프로젝트(Frontend, Backend, Backoffice)에서 이 문서를 참조하여 API를 개발합니다.**

---

## 모노레포 프로젝트 구조

```
living-craft/                              # 모노레포 루트
├── docs/api/                              # ⭐ API 문서 위치 (여기!)
│   ├── README.md                          # API 개요
│   └── API_SPECIFICATION.md               # 전체 API 명세
│
├── living-craft-front/                    # 고객용 앱 (React Native + Granite.js)
│   ├── CLAUDE.md                          # Frontend 개발 가이드
│   ├── pages/                             # 라우트 페이지
│   ├── widgets/                           # 위젯 컴포넌트
│   └── shared/                            # 공용 리소스
│
├── living-craft-backend/                  # API 서버 (NestJS + PostgreSQL)
│   ├── CLAUDE.md                          # Backend 개발 가이드
│   ├── src/
│   │   ├── modules/                       # API 모듈들
│   │   └── main.ts
│   └── docker-compose.yml                 # PostgreSQL 설정
│
└── living-craft-backoffice/               # 관리자 백오피스 (Vite + React)
    ├── CLAUDE.md                          # Backoffice 개발 가이드
    └── src/
        └── routes/                        # 백오피스 라우트
```

### 각 프로젝트 상세 정보

| 프로젝트 | 경로 | 주요 기술 | 개발 가이드 |
|---------|------|----------|------------|
| **Frontend** | `living-craft-front/` | React Native, Granite.js, TDS | [CLAUDE.md](../../living-craft-front/CLAUDE.md) |
| **Backend** | `living-craft-backend/` | NestJS, PostgreSQL, TypeORM | [CLAUDE.md](../../living-craft-backend/CLAUDE.md) |
| **Backoffice** | `living-craft-backoffice/` | Vite, React, Shadcn UI | [CLAUDE.md](../../living-craft-backoffice/CLAUDE.md) |

### 현재 상태

| 프로젝트 | 상태 | 설명 |
|---------|------|------|
| Frontend | ✅ UI 완성 | Mock 데이터로 동작 중, API 연동 대기 |
| Backend | 🔧 개발 필요 | NestJS 템플릿 상태, 모듈 개발 필요 |
| Backoffice | 🔧 개발 필요 | Shadcn Admin 템플릿 기반, 기능 구현 필요 |

---

## 개발 시작하기

각 프로젝트를 독립적으로 실행할 수 있습니다.

### Frontend 개발 서버 실행

```bash
cd living-craft-front
yarn dev
# 또는
npx granite dev
```

접속: Metro bundler가 시작되며 Apps-in-Toss 환경에서 실행

### Backend 개발 서버 실행

```bash
cd living-craft-backend

# PostgreSQL 시작 (Docker)
docker-compose up -d

# 개발 서버 시작
npm run start:dev
```

접속: http://localhost:8000
Swagger: http://localhost:8000/api/docs

### Backoffice 개발 서버 실행

```bash
cd living-craft-backoffice
yarn dev
```

접속: http://localhost:5173

---

### API 개발 워크플로우

1. **이 문서(API_SPECIFICATION.md) 확인** → 구현할 API 명세 파악
2. **Backend에서 API 구현** → NestJS 모듈, Controller, Service 작성
3. **Frontend/Backoffice에서 API 연동** → TanStack Query로 데이터 페칭
4. **테스트 및 검증** → Swagger로 API 테스트, 앱에서 통합 테스트

---

## 인증 방식

### 고객 앱 (Front)
- **Apps-in-Toss appLogin** 사용
- 토스 앱 내에서 인증 후 `authorizationCode` 발급
- 서버로 전달하여 사용자 정보 획득 및 JWT 발급

```typescript
// 프론트엔드 로그인 흐름
const { authorizationCode, referrer } = await appLogin();
// authorizationCode를 서버로 전달
```

### 백오피스
- 최소한의 간단한 인증 (1인 운영)
- 이메일/비밀번호 기반 관리자 로그인

---

## API 문서 구조

| 문서 | 설명 |
|------|------|
| [API_SPECIFICATION.md](./API_SPECIFICATION.md) | 전체 API 명세서 |

---

## 주요 기능별 API 요약

### 고객용 API (Front → Backend)

| 기능 | 엔드포인트 | 설명 |
|------|-----------|------|
| 인증 | `POST /api/auth/login` | 토스 로그인 |
| 서비스 | `GET /api/services` | 서비스 목록 조회 |
| 포트폴리오 | `GET /api/portfolios` | 작업 사례 조회 |
| 예약 | `POST /api/reservations` | 예약 생성 |
| 리뷰 | `GET /api/reviews` | 리뷰 목록 조회 |
| 마이페이지 | `GET /api/users/me/*` | 내 정보, 예약, 리뷰 |

### 백오피스용 API (Backoffice → Backend)

| 기능 | 설명 |
|------|------|
| 예약 관리 | 예약 조회, 상태 변경, 취소 |
| 서비스 관리 | 서비스 CRUD, 지역 설정 |
| 포트폴리오 관리 | 작업 사례 CRUD |
| 리뷰 관리 | 리뷰 조회, 답글, 삭제 |
| 고객 관리 | 고객 목록 조회 |

---

## 개발 계획

### Phase 1: 기본 기능 (현재)
- [x] 프론트엔드 완성 (Mock 데이터)
- [ ] API 문서화
- [ ] 백엔드 모듈 개발
- [ ] 프론트-백엔드 연동

### Phase 2: 추가 기능 (나중에)
- [ ] 결제 기능
- [ ] 알림/푸시 기능

---

## 참고 문서

- [토스 로그인 (appLogin)](../sdk/appLogin.md)
- [백엔드 가이드](../../../living-craft-backend/CLAUDE.md)
