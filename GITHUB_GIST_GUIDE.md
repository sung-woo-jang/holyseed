# GitHub Gist 약관 업로드 가이드

이 가이드는 작성한 이용약관을 GitHub Gist에 업로드하여 공개 URL을 얻는 방법을 안내합니다.

---

## 📋 준비된 파일

다음 2개의 약관 파일이 준비되어 있습니다:

1. **`living-craft-terms.md`** - 서비스 이용약관
   - 위치: `/Users/jangseong-u/Desktop/Project/living-craft/living-craft-terms.md`

2. **`living-craft-privacy.md`** - 개인정보 수집·이용 동의
   - 위치: `/Users/jangseong-u/Desktop/Project/living-craft/living-craft-privacy.md`

---

## 🚀 GitHub Gist 업로드 방법

### Step 1: GitHub 로그인

1. https://gist.github.com/ 접속
2. 우측 상단 "Sign in" 클릭
3. GitHub 계정으로 로그인 (없다면 회원가입 필요)

### Step 2: 새 Gist 생성

1. 로그인 후 메인 페이지에서 우측 상단 "+" 버튼 또는 "New gist" 클릭

### Step 3: 첫 번째 파일 추가 (서비스 이용약관)

1. **Filename including extension** 필드에 입력:
   ```
   living-craft-terms.md
   ```

2. 내용 입력:
   - `/Users/jangseong-u/Desktop/Project/living-craft/living-craft-terms.md` 파일을 텍스트 에디터로 열기
   - 전체 내용 복사 (Cmd+A, Cmd+C)
   - Gist의 큰 텍스트 영역에 붙여넣기 (Cmd+V)

### Step 4: 두 번째 파일 추가 (개인정보 수집·이용 동의)

1. **"Add file"** 버튼 클릭 (첫 번째 파일 입력란 아래)

2. **Filename including extension** 필드에 입력:
   ```
   living-craft-privacy.md
   ```

3. 내용 입력:
   - `/Users/jangseong-u/Desktop/Project/living-craft/living-craft-privacy.md` 파일을 텍스트 에디터로 열기
   - 전체 내용 복사 (Cmd+A, Cmd+C)
   - Gist의 두 번째 텍스트 영역에 붙여넣기 (Cmd+V)

### Step 5: Gist 설명 추가 (선택사항)

1. **Gist description** 필드에 입력 (선택사항):
   ```
   Living Craft 서비스 이용약관 및 개인정보처리방침
   ```

### Step 6: Public Gist로 생성

1. 하단의 **"Create public gist"** 버튼 클릭
   - ⚠️ "Create secret gist"가 아닌 **"Create public gist"**를 선택해야 합니다!
   - 토스 개발자 센터에서 접근하려면 Public이어야 합니다

### Step 7: Raw URL 복사

Gist가 생성되면:

1. **첫 번째 파일 (living-craft-terms.md)**
   - 파일 우측 상단의 **"Raw"** 버튼 클릭
   - 브라우저 주소창의 URL 복사
   - 예시: `https://gist.githubusercontent.com/username/abc123def456/raw/living-craft-terms.md`

2. **두 번째 파일 (living-craft-privacy.md)**
   - 브라우저 뒤로가기로 Gist 페이지로 돌아가기
   - 두 번째 파일의 **"Raw"** 버튼 클릭
   - 브라우저 주소창의 URL 복사
   - 예시: `https://gist.githubusercontent.com/username/abc123def456/raw/living-craft-privacy.md`

---

## 📝 얻게 되는 URL

업로드 후 다음 2개의 공개 URL을 얻게 됩니다:

```
서비스 이용약관 URL:
https://gist.githubusercontent.com/[your-username]/[gist-id]/raw/living-craft-terms.md

개인정보 수집·이용 동의 URL:
https://gist.githubusercontent.com/[your-username]/[gist-id]/raw/living-craft-privacy.md
```

이 URL들을 토스 개발자 센터에 등록하면 됩니다!

---

## ✅ 다음 단계

URL을 얻었다면:

1. 2개의 Raw URL을 안전한 곳에 복사해두기
2. 토스 개발자 센터로 이동
3. "토스 로그인 설정" → "이용약관 등록"에서 각 URL 입력

---

## 🔧 문제 해결

### Q1: "Raw" 버튼이 보이지 않아요
- 파일명 우측에 있는 "Raw" 버튼을 찾아보세요
- 또는 파일명을 클릭한 후 다시 확인해보세요

### Q2: Secret Gist로 만들어버렸어요
- Gist 페이지에서 우측 상단 "Delete this gist" 클릭
- 다시 "Create public gist"로 생성하세요

### Q3: URL이 너무 길어요
- 정상입니다. GitHub Gist의 Raw URL은 원래 길이가 깁니다
- 전체 URL을 그대로 복사하여 사용하세요

### Q4: 약관 내용을 수정하고 싶어요
1. Gist 페이지에서 우측 상단 "Edit" 버튼 클릭
2. 내용 수정
3. 하단 "Update public gist" 클릭
4. Raw URL은 그대로 유지됩니다 (재등록 불필요)

---

## 💡 팁

### Gist 관리
- 생성한 Gist는 https://gist.github.com/[your-username] 에서 관리 가능
- 언제든지 수정, 삭제 가능
- 수정해도 Raw URL은 변경되지 않음

### 버전 관리
- Gist는 자동으로 버전 관리됨
- "Revisions" 탭에서 이전 버전 확인 가능

---

**다음 작업:**
Raw URL 2개를 복사한 후, 토스 개발자 센터 설정을 진행하세요!
