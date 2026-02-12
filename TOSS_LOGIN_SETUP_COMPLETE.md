# 🎉 토스 로그인 구현 완료!

Living Craft 프로젝트의 토스 로그인(appLogin) Backend 구현이 완료되었습니다.

---

## ✅ 완료된 작업

### 1. 이용약관 작성
- ✅ `living-craft-terms.md` - 서비스 이용약관
- ✅ `living-craft-privacy.md` - 개인정보 수집·이용 동의
- 📍 위치: `/Users/jangseong-u/Desktop/Project/living-craft/`

### 2. 가이드 문서 작성
- ✅ `GITHUB_GIST_GUIDE.md` - GitHub Gist 업로드 가이드
- ✅ `TOSS_CONSOLE_SETUP_GUIDE.md` - 토스 개발자 센터 설정 가이드
- 📍 위치: `/Users/jangseong-u/Desktop/Project/living-craft/`

### 3. Backend 구현
- ✅ `TossAuthService` 생성
  - authorizationCode → accessToken 교환
  - accessToken으로 사용자 정보 조회
  - AES-256-GCM 복호화
  - 📍 위치: `living-craft-backend/src/modules/customers/services/toss-auth.service.ts`

- ✅ `CustomersService` 수정
  - login() 메서드를 실제 토스 연동으로 변경
  - 사용자 정보 upsert (신규 생성 또는 업데이트)
  - 📍 위치: `living-craft-backend/src/modules/customers/customers.service.ts`

- ✅ `CustomersModule` 수정
  - HttpModule 추가
  - TossAuthService를 providers에 추가
  - 📍 위치: `living-craft-backend/src/modules/customers/customers.module.ts`

### 4. 환경 변수 설정
- ✅ `.env` 파일에 토스 credentials 추가
- ✅ `.env.example` 파일 업데이트
- 📍 위치: `living-craft-backend/`

### 5. 빌드 검증
- ✅ Backend 빌드 성공 (webpack compiled successfully)

---

## 📋 다음 단계 (사용자 작업 필요)

### Step 1: GitHub Gist에 약관 업로드

1. `GITHUB_GIST_GUIDE.md` 파일을 참고하여 진행하세요
2. https://gist.github.com/ 접속
3. 다음 2개 파일 업로드:
   - `living-craft-terms.md`
   - `living-craft-privacy.md`
4. **Raw URL 2개를 복사**하여 보관

**예상 소요 시간:** 5분

---

### Step 2: 토스 개발자 센터 설정

1. `TOSS_CONSOLE_SETUP_GUIDE.md` 파일을 참고하여 진행하세요
2. https://developers-apps-in-toss.toss.im/ 접속 (대표 관리자 계정)
3. Living Craft 앱 선택 → "토스 로그인" 메뉴

**설정 항목:**
- ✅ 약관 동의
- ✅ 동의 항목 선택: 이름, 전화번호
- ✅ 이용약관 URL 등록 (GitHub Gist Raw URL)
- ✅ 연결 끊기 콜백 URL 설정 (webhook.site)
- ✅ 복호화 키 이메일 수신

**예상 소요 시간:** 15-20분

---

### Step 3: 복호화 키를 .env에 추가

토스 개발자 센터에서 이메일로 받은 복호화 키를 `.env` 파일에 추가하세요.

```bash
cd living-craft-backend
nano .env
```

다음 라인을 수정:
```bash
TOSS_AES_KEY=여기에_이메일로_받은_Base64_키_붙여넣기
```

저장: `Ctrl+O` → `Enter` → `Ctrl+X`

**예상 소요 시간:** 1분

---

### Step 4: Backend 서버 실행

```bash
cd living-craft-backend
npm run start:dev
```

정상 실행 확인:
- ✅ `Nest application successfully started` 메시지 확인
- ✅ http://localhost:8000/docs 접속하여 Swagger 확인
- ✅ `POST /auth/login` 엔드포인트 확인

**예상 소요 시간:** 2분

---

### Step 5: 샌드박스 앱으로 테스트

1. **샌드박스 앱 다운로드**
   - https://developers-apps-in-toss.toss.im/development/test/sandbox
   - 개발자 계정으로 로그인

2. **Frontend 개발 서버 실행**
   ```bash
   cd living-craft-front
   yarn dev
   ```

3. **샌드박스 앱에서 테스트**
   - 샌드박스 앱 실행
   - Living Craft 앱 실행
   - 로그인 버튼 클릭
   - authorizationCode 획득
   - Backend API 호출
   - 응답 확인

4. **DB 확인**
   ```bash
   cd living-craft-backend
   docker-compose exec postgres psql -U postgres -d living_craft
   ```

   ```sql
   SELECT id, toss_user_id, name, phone, created_at
   FROM customers
   ORDER BY created_at DESC
   LIMIT 5;
   ```

**예상 소요 시간:** 10-15분

---

## 🔧 문제 해결

### Q1: Backend 서버 실행 시 "TOSS_AES_KEY is not configured" 에러

**원인:** 환경 변수에 복호화 키가 설정되지 않음

**해결:**
```bash
cd living-craft-backend
cat .env | grep TOSS_AES_KEY
```
- `your_base64_encoded_aes_key_here`로 되어 있다면 실제 키로 변경
- 토스 개발자 센터에서 이메일로 받은 Base64 키를 붙여넣기

---

### Q2: 토스 로그인 시 "토스 인증 코드가 유효하지 않습니다" 에러

**원인:**
- authorizationCode가 만료됨 (10분 제한)
- authorizationCode가 이미 사용됨 (일회성)

**해결:**
- Frontend에서 appLogin()을 다시 호출하여 새 authorizationCode 획득
- 획득한 코드를 즉시 Backend로 전송

---

### Q3: "사용자 정보 복호화에 실패했습니다" 에러

**원인:**
- 복호화 키가 잘못됨
- Base64 인코딩이 제대로 안됨

**해결:**
1. 토스 개발자 센터에서 복호화 키 이메일 재확인
2. 복사할 때 공백이나 줄바꿈이 포함되지 않도록 주의
3. .env 파일에 정확히 붙여넣기

---

### Q4: DB에 사용자 정보가 저장되지 않음

**원인:**
- PostgreSQL이 실행되지 않음
- DB 연결 설정 오류

**해결:**
```bash
cd living-craft-backend
docker-compose up -d
docker-compose ps
```
- postgres 컨테이너가 "Up" 상태인지 확인
- 안 떠있으면 `docker-compose up -d` 실행

---

## 📚 참고 문서

### 작성된 가이드 문서
1. `living-craft-terms.md` - 서비스 이용약관
2. `living-craft-privacy.md` - 개인정보 수집·이용 동의
3. `GITHUB_GIST_GUIDE.md` - GitHub Gist 업로드 방법
4. `TOSS_CONSOLE_SETUP_GUIDE.md` - 토스 개발자 센터 설정 방법

### 구현된 코드 파일
1. `living-craft-backend/src/modules/customers/services/toss-auth.service.ts`
2. `living-craft-backend/src/modules/customers/customers.service.ts`
3. `living-craft-backend/src/modules/customers/customers.module.ts`
4. `living-craft-backend/.env`
5. `living-craft-backend/.env.example`

### 토스 공식 문서
- [토스 로그인 콘솔 가이드](https://developers-apps-in-toss.toss.im/login/console.md)
- [토스 로그인 개발하기](https://developers-apps-in-toss.toss.im/login/develop.md)
- [appLogin SDK 레퍼런스](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/로그인/appLogin.md)
- [샌드박스 앱 다운로드](https://developers-apps-in-toss.toss.im/development/test/sandbox)

---

## 🎯 전체 플로우 요약

```
1. 클라이언트 (토스 앱 내 Living Craft)
   └─ appLogin() 호출
   └─ authorizationCode 획득 (Promise 반환)

2. Frontend → Backend
   └─ POST /api/auth/login
   └─ Body: { authorizationCode, referrer }

3. Backend (TossAuthService)
   └─ POST https://apps-in-toss-api.toss.im/.../generate-token
   └─ authorizationCode → accessToken 교환

4. Backend (TossAuthService)
   └─ GET https://apps-in-toss-api.toss.im/.../login-me
   └─ accessToken으로 암호화된 사용자 정보 조회

5. Backend (TossAuthService)
   └─ AES-256-GCM으로 사용자 정보 복호화
   └─ userKey, name, phone 획득

6. Backend (CustomersService)
   └─ DB에서 기존 고객 조회 또는 신규 생성
   └─ JWT 토큰 발급 (Living Craft 자체 인증)

7. Backend → Frontend
   └─ Response: { accessToken, refreshToken, user }

8. Frontend
   └─ 로그인 완료!
```

---

## ⚠️ 중요 주의사항

### 보안
- ❌ 복호화 키를 절대 GitHub에 커밋하지 마세요
- ❌ 복호화 키를 Frontend에 노출하지 마세요
- ✅ 복호화 키는 반드시 Backend .env 파일에만 보관
- ✅ .env 파일은 .gitignore에 포함되어 있는지 확인

### 프로덕션 배포 전 필수 작업
1. **정식 이용약관 작성** (법률 전문가 검토)
2. **연결 끊기 콜백 엔드포인트 구현** (현재는 webhook.site 임시 사용)
3. **클라우드 서버 배포** (현재는 localhost)
4. **환경별 설정 분리** (development, staging, production)
5. **로그 모니터링 설정**
6. **에러 알림 설정**

---

## 🚀 다음 개발 단계 (선택사항)

### Phase 1: Frontend 연동 (완료 후)
- Frontend에서 Mock 모드 해제
- 실제 appLogin() SDK 호출 추가
- 에러 처리 강화
- 로딩 상태 관리

### Phase 2: 추가 기능
- CI (고유 식별값) 권한 추가 → 중복 가입 방지
- 이메일 권한 추가 → 알림용
- 소셜 로그아웃 처리
- 토큰 갱신 자동화
- 연결 끊기 콜백 엔드포인트 구현

### Phase 3: 프로덕션 준비
- 정식 이용약관 작성 및 법률 검토
- 클라우드 서버 배포 (AWS, GCP, Naver Cloud 등)
- 실제 Backend URL로 콜백 변경
- 환경 변수 관리 강화 (Secret Manager)
- 로그 모니터링 및 에러 추적

---

## 📞 도움이 필요하면

### 토스 개발자 지원
- 이메일: `cert.support@toss.im`
- 토스 개발자 센터: https://developers-apps-in-toss.toss.im/

### 프로젝트 문서
- `living-craft-front/docs/api/API_SPECIFICATION.md` - 인증 API 명세
- `living-craft-front/docs/sdk/appLogin.md` - appLogin SDK 사용법
- `living-craft-backend/src/modules/customers/` - 현재 인증 구현

---

**축하합니다! 토스 로그인 Backend 구현이 완료되었습니다!** 🎉

이제 위의 "다음 단계"를 따라 토스 개발자 센터 설정을 완료하고 테스트를 진행하세요.
