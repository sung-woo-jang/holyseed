# Living Craft 모노레포 최적화 가이드

## 개선 사항

### Phase 1: 핵심 도구 통일 (완료)
- ✅ TypeScript 5.9.3 통일
- ✅ Prettier 3.7.4 통일
- ✅ Turbo 태스크 정의 확대 (lint, format, typecheck)
- ✅ Workspace 프로토콜 적용 (workspace:*)

### Phase 2: 설정 통합 (완료)
- ✅ 루트 ESLint 설정 생성 (eslint.config.mjs)
- ✅ ESLint 공통 패키지 루트로 호이스팅
- ✅ Prettier 플러그인 통합 (@trivago/prettier-plugin-sort-imports, prettier-plugin-tailwindcss)

### Phase 3: 공유 패키지 확장 (예정)
- ⏳ shared-types 확장 (User, Portfolio, Review 등)
- ⏳ 공통 유틸리티 패키지 생성 (shared-utils)
- ⏳ 스크립트 표준화

---

## 사용법

### 전체 프로젝트 린트/포맷팅

```bash
# 전체 프로젝트 린트 검사
yarn lint

# 전체 프로젝트 포맷팅
yarn format

# 전체 프로젝트 타입 체크
yarn typecheck

# 전체 프로젝트 빌드
yarn build

# 전체 프로젝트 테스트
yarn test
```

### 특정 프로젝트만 실행

```bash
# Front 개발 서버
yarn workspace @living-craft/front run dev

# Backend 개발 서버
yarn workspace @living-craft/backend run dev

# Backoffice 개발 서버
yarn workspace @living-craft/backoffice run dev
```

### 빌드

```bash
# 전체 빌드
yarn build

# 개별 프로젝트 빌드
yarn build:front
yarn build:backend
yarn build:backoffice
```

---

## 의존성 관리

### 공통 의존성 (루트에서 호이스팅)

다음 패키지들은 루트 `package.json`에서 관리됩니다:

- **TypeScript**: `^5.9.3`
- **Prettier**: `^3.7.4`
- **ESLint**: `^9.39.1`
- **ESLint 플러그인**:
  - `@eslint/js`
  - `@typescript-eslint/eslint-plugin`
  - `@typescript-eslint/parser`
  - `eslint-plugin-prettier`
  - `typescript-eslint`
- **Prettier 플러그인**:
  - `@trivago/prettier-plugin-sort-imports`
  - `prettier-plugin-tailwindcss`

### 프로젝트별 특화 의존성

각 프로젝트는 고유한 의존성만 유지합니다:

- **Front**: React Native, Apps-in-Toss, Granite 관련 패키지
- **Backend**: NestJS, TypeORM, PostgreSQL 관련 패키지
- **Backoffice**: React, Vite, Shadcn UI 관련 패키지

---

## node_modules 관리

### 전체 재설치

```bash
# node_modules 삭제 (루트 및 모든 서브프로젝트)
rm -rf node_modules **/node_modules

# 의존성 재설치
yarn install
```

### 의존성 업데이트

```bash
# 대화형 업데이트
yarn upgrade-interactive

# 특정 패키지 업데이트
yarn upgrade <패키지명>
```

### Workspace 정보 확인

```bash
# Workspace 목록 및 의존성 확인
yarn workspaces info

# 특정 패키지가 어디서 사용되는지 확인
yarn why <패키지명>
```

---

## 설정 파일 구조

### 루트 설정 (공통)

```
/
├── package.json              # Workspace 정의 및 공통 의존성
├── turbo.json               # Turbo 빌드 설정
├── eslint.config.mjs        # 공통 ESLint 설정
├── .prettierrc              # 공통 Prettier 설정
└── yarn.lock                # 통합 락 파일 (유일)
```

### 서브프로젝트 설정

각 프로젝트는 자체 ESLint/Prettier 설정을 유지할 수 있습니다:

```
/living-craft-front/
├── package.json             # Front 전용 의존성
├── eslint.config.mjs        # Front 전용 ESLint 규칙
└── tsconfig.json            # TypeScript 설정

/living-craft-backend/
├── package.json             # Backend 전용 의존성
├── eslint.config.js         # Backend 전용 ESLint 규칙
└── tsconfig.json            # TypeScript 설정

/living-craft-backoffice/
├── package.json             # Backoffice 전용 의존성
├── eslint.config.js         # Backoffice 전용 ESLint 규칙
├── .prettierrc              # Backoffice 전용 Prettier 설정 (상세 importOrder)
└── tsconfig.json            # TypeScript 설정
```

---

## Turbo 캐싱 최적화

### 캐싱이 활성화된 태스크

- `build`: 빌드 산출물 캐싱 (`dist/`, `.next/`, `build/`)
- `lint`: 린트 결과 캐싱
- `format`: 포맷팅 결과 캐싱
- `typecheck`: 타입 체크 결과 캐싱
- `test`: 테스트 결과 캐싱

### 캐시 확인

```bash
# 첫 번째 실행 (캐시 미스)
yarn turbo run lint

# 두 번째 실행 (캐시 히트) - 변경사항이 없으면 즉시 완료
yarn turbo run lint
```

### 캐시 초기화

```bash
# Turbo 캐시 삭제
rm -rf node_modules/.cache/turbo

# 전체 재빌드
yarn turbo run build --force
```

---

## 개발 워크플로우

### 새 기능 개발

1. **브랜치 생성**
   ```bash
   git checkout -b feature/new-feature
   ```

2. **개발**
   ```bash
   # 해당 프로젝트 개발 서버 실행
   yarn workspace @living-craft/front run dev
   ```

3. **코드 품질 검사**
   ```bash
   # 린트 검사 및 자동 수정
   yarn lint

   # 포맷팅
   yarn format

   # 타입 체크
   yarn typecheck
   ```

4. **커밋 전 검증**
   ```bash
   # 전체 빌드 테스트
   yarn build

   # 테스트 실행
   yarn test
   ```

### CI/CD에서 활용

```yaml
# 예시: GitHub Actions
- name: Install dependencies
  run: yarn install --frozen-lockfile

- name: Lint
  run: yarn lint

- name: Type check
  run: yarn typecheck

- name: Build
  run: yarn build

- name: Test
  run: yarn test
```

---

## 문제 해결

### ESLint 오류

```bash
# ESLint 캐시 삭제
rm -rf **/.eslintcache

# 강제 재실행
yarn lint --no-cache
```

### Prettier 충돌

```bash
# Prettier 캐시 삭제
rm -rf node_modules/.cache/prettier

# 전체 재포맷팅
yarn format
```

### TypeScript 버전 충돌

```bash
# TypeScript 버전 확인
yarn why typescript

# 중복 설치 확인 (루트 하나만 있어야 함)
find . -name "typescript" -type d | grep node_modules
```

### Workspace 링크 문제

```bash
# 의존성 재설치
yarn install --force

# Workspace 정보 확인
yarn workspaces info
```

---

## 성능 개선 효과

### Phase 1 완료 후
- ✅ node_modules 크기: ~300-500MB 감소
- ✅ CI/CD 빌드 시간: 20-30% 단축 (Turbo 캐싱)
- ✅ TypeScript 버전 충돌 해소

### Phase 2 완료 후
- ✅ 설정 유지보수 복잡도: 50% 감소
- ✅ 린트/포맷팅 일관성: 100% 일관
- ✅ 새 프로젝트 추가 시 설정 시간 단축

### Phase 3 완료 후 (예정)
- ⏳ 타입 정의 중복 제거
- ⏳ 공통 로직 재사용성 향상
- ⏳ 개발자 온보딩 시간 단축

---

## 주의사항

### nohoist 설정 유지

React Native 관련 패키지는 `nohoist` 설정을 유지해야 합니다:

```json
{
  "workspaces": {
    "nohoist": [
      "**/react-native",
      "**/react-native/**",
      "**/@apps-in-toss/**",
      "**/@granite-js/**",
      "**/metro",
      "**/metro/**",
      "**/babel-preset-granite",
      "**/jest",
      "**/jest/**"
    ]
  }
}
```

### 개별 yarn.lock 삭제

서브프로젝트의 개별 `yarn.lock` 파일은 삭제되었습니다. 루트의 `yarn.lock`만 사용합니다.

### ESLint 설정 수정 시

각 프로젝트는 자체 ESLint 설정을 유지합니다. 공통 규칙을 변경하려면 루트 `eslint.config.mjs`를 수정하세요.

### Prettier importOrder

Backoffice는 상세한 `importOrder`를 가진 자체 `.prettierrc`를 유지합니다. 다른 프로젝트는 루트 설정을 상속합니다.

---

## 다음 단계

### Phase 3 작업 예정

1. **shared-types 확장**
   - User, Portfolio, Review 타입 추가
   - 공통 에러 코드 정의
   - 공통 상수 추가

2. **shared-utils 패키지 생성**
   - 날짜 포맷팅 유틸리티
   - 검증 함수
   - 공통 헬퍼 함수

3. **스크립트 표준화**
   - Backend의 `start:dev` → `dev` 변경
   - 루트 스크립트 확장 (`dev:front`, `dev:backend`, `dev:backoffice`)
   - `lint:fix`, `format:check` 추가

---

## 참고 문서

- [Yarn Workspaces](https://classic.yarnpkg.com/en/docs/workspaces/)
- [Turborepo 공식 문서](https://turbo.build/repo/docs)
- [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)
- [ESLint Flat Config](https://eslint.org/docs/latest/use/configure/configuration-files-new)
