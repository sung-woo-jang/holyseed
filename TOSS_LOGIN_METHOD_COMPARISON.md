# 🔐 토스 로그인 방식 비교 가이드

Living Craft 프로젝트의 올바른 토스 로그인 구현 방법을 명확히 하기 위한 문서입니다.

---

## ⚠️ 중요: Living Craft는 어떤 방식을 사용하나요?

**Living Craft는 "Apps-in-Toss 미니앱"이므로, 이미 구현된 방식이 올바릅니다!**

토스 개발자 센터(https://developers-apps-in-toss.toss.im/)에서 설정만 완료하면 됩니다.

---

## 📋 두 가지 토스 로그인 방식 비교

| 구분 | Apps-in-Toss 로그인 (✅ Living Craft) | 파트너사 로그인 (❌ 해당 없음) |
|------|--------------------------------------|------------------------------|
| **대상** | 토스 앱 내 미니앱 | 독립적인 웹사이트/앱 |
| **플랫폼** | Granite.js + React Native | 일반 웹/앱 (어떤 기술이든) |
| **인증 방식** | appLogin() SDK (Promise 반환) | OAuth2 리다이렉트 (웹 표준) |
| **API 도메인** | apps-in-toss-api.toss.im | oauth2.cert.toss.im |
| **설정 방법** | 토스 개발자 센터 콘솔에서 직접 설정 | 이메일(cert.support@toss.im)로 신청 |
| **필요한 정보** | 이용약관 URL, 동의 항목 선택 | 서비스명, 도메인, 사업자등록증, 담당자 정보 등 |
| **콜백 URL** | 불필요 (SDK가 Promise로 반환) | 필수 (OAuth2 리다이렉트용) |
| **복호화 키 수신** | 개발자 센터에서 "이메일로 받기" 버튼 | 이메일 신청 후 영업일 기준 3일 소요 |

---

## ✅ Living Craft에 이미 구현된 방식 (Apps-in-Toss)

### 구현 완료 상태

✅ **Backend 코드 완성**
- `TossAuthService` - 토큰 교환, 사용자 정보 조회, AES 복호화
- `CustomersService` - Toss 로그인 통합, 사용자 upsert, JWT 발급
- `CustomersModule` - 의존성 주입 설정

✅ **API 엔드포인트 설정**
```bash
TOSS_TOKEN_URL=https://apps-in-toss-api.toss.im/api-partner/v1/apps-in-toss/user/oauth2/generate-token
TOSS_USER_INFO_URL=https://apps-in-toss-api.toss.im/api-partner/v1/apps-in-toss/user/oauth2/login-me
```

✅ **프로덕션 준비 완료된 이용약관**
- `living-craft-terms.md` - 25개 조항의 정식 서비스 이용약관
- `living-craft-privacy.md` - 15개 섹션의 정식 개인정보 수집·이용 동의

✅ **가이드 문서 작성**
- `GITHUB_GIST_GUIDE.md` - 약관 업로드 방법
- `TOSS_CONSOLE_SETUP_GUIDE.md` - 토스 개발자 센터 설정 방법
- `TOSS_LOGIN_SETUP_COMPLETE.md` - 전체 프로세스 및 문제 해결

### 인증 플로우

```
1. Frontend (토스 앱 내 Living Craft)
   └─ appLogin() 호출 (Granite SDK)
   └─ authorizationCode 획득 (Promise 반환)
   └─ 토스 앱이 자체적으로 인증 처리

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
   └─ AES-256-GCM 복호화
   └─ userKey, name, phone 획득

6. Backend (CustomersService)
   └─ DB에 사용자 생성 또는 업데이트 (upsert)
   └─ Living Craft 자체 JWT 토큰 발급

7. Backend → Frontend
   └─ Response: { accessToken, refreshToken, user }

8. Frontend
   └─ 로그인 완료! 🎉
```

---

## ❌ 파트너사 로그인 방식 (Living Craft에 해당 없음)

### 이 방식을 사용하는 경우

- 토스 앱 **밖에서** 독립적으로 동작하는 웹사이트/앱
- 예: 이커머스 사이트, 일반 모바일 앱 등

### 신청 프로세스

1. **이메일 신청**: cert.support@toss.im
2. **제공 정보**:
   - 서비스명
   - 서비스 도메인
   - 사업자등록증
   - 담당자 정보 (이름, 연락처, 이메일)
   - 콜백 URL
   - 이용약관 URL
3. **검토 기간**: 영업일 기준 3일 소요
4. **승인 후**: client_id, client_secret, 복호화 키 수신

### 인증 플로우 (참고용)

```
1. 사용자가 웹사이트에서 "토스 로그인" 버튼 클릭
2. 토스 인증 페이지로 리다이렉트
3. 사용자가 토스에서 인증 완료
4. 콜백 URL로 리다이렉트 (authorizationCode 포함)
5. 서버에서 authorizationCode → accessToken 교환
6. 사용자 정보 조회 및 복호화
```

**Living Craft는 이 방식을 사용하지 않습니다!**

---

## 🎯 Living Craft에서 해야 할 일

### ✅ 이미 완료된 작업

- [x] Backend 코드 구현
- [x] 이용약관 작성 (프로덕션 준비 완료)
- [x] 가이드 문서 작성
- [x] 환경 변수 설정
- [x] 빌드 검증

### 📝 남은 작업 (사용자 직접 수행)

#### Step 1: 이용약관에 사업자 정보 입력

`living-craft-terms.md`와 `living-craft-privacy.md` 파일에서 다음 정보를 채워넣으세요:

```markdown
**사업자명**: [사업자 이름]
**대표자**: [대표자 이름]
**사업자등록번호**: [123-45-67890]
**주소**: [서울특별시 ...]
**전화번호**: [010-XXXX-XXXX]
**이메일**: [contact@living-craft.com]
**개인정보 보호책임자**: [이름, 직책, 연락처, 이메일]
```

#### Step 2: GitHub Gist에 약관 업로드

1. `GITHUB_GIST_GUIDE.md` 파일을 참고하세요
2. https://gist.github.com/ 접속
3. 다음 2개 파일 업로드:
   - `living-craft-terms.md`
   - `living-craft-privacy.md`
4. **Raw URL 2개를 복사**하여 보관

**예상 소요 시간**: 5분

#### Step 3: 토스 개발자 센터 설정

1. `TOSS_CONSOLE_SETUP_GUIDE.md` 파일을 참고하세요
2. https://developers-apps-in-toss.toss.im/ 접속 (대표 관리자 계정)
3. Living Craft 앱 선택 → "토스 로그인" 메뉴

**설정 항목**:
- ✅ 약관 동의
- ✅ 동의 항목 선택: 이름, 전화번호
- ✅ 이용약관 URL 등록 (GitHub Gist Raw URL)
- ✅ 연결 끊기 콜백 URL 설정 (webhook.site 임시 사용)
- ✅ **"이메일로 복호화 키 받기" 버튼 클릭** ← 여기서 키를 받습니다!

**예상 소요 시간**: 15-20분

**⚠️ 중요**: Apps-in-Toss 미니앱은 cert.support@toss.im로 이메일 신청하지 않습니다! 개발자 센터 콘솔에서 직접 설정합니다.

#### Step 4: 복호화 키를 .env에 추가

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

**예상 소요 시간**: 1분

#### Step 5: Backend 서버 실행

```bash
cd living-craft-backend
npm run start:dev
```

정상 실행 확인:
- ✅ `Nest application successfully started` 메시지 확인
- ✅ http://localhost:8000/docs 접속하여 Swagger 확인
- ✅ `POST /auth/login` 엔드포인트 확인

**예상 소요 시간**: 2분

#### Step 6: 샌드박스 앱으로 테스트

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

**예상 소요 시간**: 10-15분

---

## 🔍 핵심 차이점 요약

| 항목 | Apps-in-Toss (Living Craft) | 파트너사 로그인 |
|------|----------------------------|----------------|
| **구현 완료 여부** | ✅ 완료 | ❌ 불필요 |
| **설정 방법** | 개발자 센터 콘솔 | 이메일 신청 |
| **소요 시간** | 즉시 (콘솔에서 설정) | 3영업일 (승인 대기) |
| **필요한 이메일** | 없음 (콘솔 자동 발송) | cert.support@toss.im |
| **복호화 키 수신** | 개발자 센터 버튼 클릭 → 자동 이메일 | 신청 후 수동 발송 |

---

## 📚 참고 문서

### Living Craft 프로젝트 문서 (이미 작성됨)

1. `TOSS_CONSOLE_SETUP_GUIDE.md` - **이 문서를 따라하세요!**
2. `GITHUB_GIST_GUIDE.md` - 약관 업로드 방법
3. `TOSS_LOGIN_SETUP_COMPLETE.md` - 전체 프로세스 및 문제 해결
4. `living-craft-terms.md` - 정식 서비스 이용약관
5. `living-craft-privacy.md` - 정식 개인정보 수집·이용 동의

### 토스 공식 문서

- **Apps-in-Toss 로그인** (Living Craft):
  - [토스 로그인 콘솔 가이드](https://developers-apps-in-toss.toss.im/login/console.md)
  - [토스 로그인 개발하기](https://developers-apps-in-toss.toss.im/login/develop.md)
  - [appLogin SDK 레퍼런스](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/로그인/appLogin.md)

- **파트너사 로그인** (참고용):
  - [파트너사 로그인 연동하기](https://docs.tosspayments.com/resources/glossary/terms) (해당 없음)

---

## ✅ 체크리스트

완료 후 다음 항목을 모두 확인하세요:

### 이용약관
- [ ] `living-craft-terms.md`에 사업자 정보 입력 완료
- [ ] `living-craft-privacy.md`에 사업자 정보 입력 완료
- [ ] GitHub Gist에 업로드 완료
- [ ] Raw URL 2개 복사 완료

### 토스 개발자 센터
- [ ] https://developers-apps-in-toss.toss.im/ 로그인
- [ ] Living Craft 앱 선택
- [ ] "토스 로그인" 메뉴 진입
- [ ] 동의 항목 선택 (이름, 전화번호)
- [ ] 이용약관 URL 등록
- [ ] 연결 끊기 콜백 URL 설정
- [ ] **"이메일로 복호화 키 받기" 버튼 클릭**
- [ ] 이메일로 복호화 키 수신 확인

### Backend
- [ ] `.env` 파일에 복호화 키 입력
- [ ] 서버 정상 실행 확인
- [ ] Swagger 문서 확인

### 테스트
- [ ] 샌드박스 앱 다운로드
- [ ] Frontend 개발 서버 실행
- [ ] 로그인 플로우 테스트
- [ ] DB에 사용자 데이터 저장 확인

---

## 🎉 결론

**Living Craft는 이미 올바른 방식으로 구현되었습니다!**

이제 사용자가 해야 할 일은:
1. 이용약관에 사업자 정보 입력
2. GitHub Gist 업로드
3. 토스 개발자 센터 설정 (TOSS_CONSOLE_SETUP_GUIDE.md 참고)
4. 복호화 키 추가
5. 테스트

**cert.support@toss.im로 이메일 신청은 필요 없습니다!**

---

**축하합니다! 토스 로그인 Backend 구현이 완료되었습니다!** 🎉

이제 위의 체크리스트를 따라 토스 개발자 센터 설정을 완료하고 테스트를 진행하세요.
