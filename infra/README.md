# Living Craft 인프라 가이드

Living Craft 모노레포의 인프라 및 배포 관련 문서입니다. CI/CD, 서버 구성, 데이터베이스 마이그레이션 등을 관리합니다.

---

## 1. 서버 구성 개요

### 프로덕션 환경

- **호스트**: Mac Mini (로컬 서버)
- **도메인**: `living-craft.p-e.kr`
- **배포 환경**: Self-hosted GitHub Actions Runner

### 실행 중인 프로세스

```
┌─────────────────────────────────────────────────────┐
│ Nginx (포트 80, 443)                                 │
│ - HTTP → HTTPS 리다이렉트                            │
│ - /api → Backend (8000) 리버스 프록시                │
│ - /uploads → 파일 서빙                              │
│ - / → Backoffice SPA 서빙                           │
└─────────────────────────────────────────────────────┘
         ↓                          ↓
    Backend API              Backoffice Web
    (포트 8000)              (/var/www/living-craft-backoffice)
    PM2 managed             정적 파일 서빙
         ↓
┌─────────────────────────────────────────────────────┐
│ PostgreSQL (포트 5432)                               │
│ Docker Compose로 관리                               │
│ 데이터베이스: living_craft_prod                      │
└─────────────────────────────────────────────────────┘
```

### 포트 구성

| 포트 | 용도 | 설명 |
|-----|------|------|
| 80 | HTTP | Let's Encrypt 인증서 갱신, HTTP → HTTPS 리다이렉트 |
| 443 | HTTPS | 메인 서비스 |
| 8000 | Backend API | NestJS 애플리케이션 |
| 5432 | PostgreSQL | 데이터베이스 (Docker) |

### SSL 인증서

- **제공자**: Let's Encrypt (Let's Encrypt 자동 갱신 설정됨)
- **위치**: `/etc/letsencrypt/live/living-craft.p-e.kr/`
- **파일**:
  - `fullchain.pem`: 전체 인증서 체인
  - `privkey.pem`: 개인 키
- **유효기간**: 90일
- **자동 갱신**: ✅ 유효기간 30일 전부터 자동으로 갱신 (systemd 타이머)
- **수동 갱신** (필요시):
  ```bash
  sudo certbot renew --force-renewal
  nginx -s reload
  ```

---

## 2. 원격 접속 방법

### SSH 접속

#### 같은 네트워크 (집/사무실 와이파이)

```bash
# Mac Mini에 SSH 접속
ssh jangseong-u@192.168.45.163

# ~/.ssh/config에 추가 (자주 사용할 경우)
cat >> ~/.ssh/config << 'EOF'
Host living-craft-local
    HostName 192.168.45.163
    User jangseong-u
EOF

ssh living-craft-local
```

#### 다른 네트워크 (휴대폰 핫스팟, 외부 인터넷)

```bash
# 공유기 포트 포워딩 설정됨 (외부 포트 2222)
ssh -p 2222 jangseong-u@121.124.104.99

# ~/.ssh/config에 추가
cat >> ~/.ssh/config << 'EOF'
Host living-craft-external
    HostName 121.124.104.99
    User jangseong-u
    Port 2222
EOF

ssh living-craft-external
```

### PostgreSQL 원격 접속

#### 같은 네트워크에서 접속

```bash
# psql 커맨드라인
psql -h 192.168.45.163 -p 5432 -U postgres -d living_craft_prod

# 비밀번호 입력: password123 (또는 .env.production의 DB_PASSWORD)
```

#### 외부에서 접속 (DBeaver, TablePlus 등 GUI 도구)

**먼저 공유기에서 포트 포워딩 추가**:
```
외부 포트: 5433 (또는 다른 사용 가능한 포트)
내부 IP: 192.168.45.163
내부 포트: 5432
```

**DBeaver 접속 설정**:
- **Host**: 121.124.104.99
- **Port**: 5433 (위에서 설정한 외부 포트)
- **Database**: living_craft_prod
- **Username**: postgres
- **Password**: (`.env.production`의 `DB_PASSWORD` 값)

**CLI로 접속**:
```bash
psql -h 121.124.104.99 -p 5433 -U postgres -d living_craft_prod
```

#### PostgreSQL 접속 정보 정리

| 환경 | 호스트 | 포트 | DB명 | 사용자 | 비밀번호 |
|-----|-------|------|------|-------|--------|
| 로컬/같은 네트워크 | 192.168.45.163 | 5432 | living_craft_prod | postgres | `.env`의 DB_PASSWORD |
| 외부 네트워크 | 121.124.104.99 | 5433 | living_craft_prod | postgres | `.env.production`의 DB_PASSWORD |

### 화면 공유 (macOS)

Mac Mini의 화면을 보려면:

1. **System Preferences** → **General** → **Sharing** → **Screen Sharing** 활성화
2. 같은 네트워크의 Mac에서 `192.168.45.163`으로 화면 공유 접속

---

## 2.5. 공유기 포트 포워딩 설정 (SKB)

외부 네트워크에서 접속하려면 공유기에서 포트 포워딩을 설정해야 합니다.

### 설정 방법

1. **공유기 관리 페이지 접속**
   ```
   http://192.168.45.1/home.html
   ```
   (SKB 기본 설정)

2. **관리자 로그인**
   - 공유기 관리자 아이디/비밀번호 입력

3. **포트 포워딩 추가**

   | 서비스 | 외부 포트 | 내부 IP | 내부 포트 |
   |-------|---------|--------|---------|
   | SSH | 2222 | 192.168.45.163 | 22 |
   | PostgreSQL | 5433 | 192.168.45.163 | 5432 |

### 주의사항

- ⚠️ **22번 포트는 보안상 차단**될 수 있음 → 2222 등 다른 포트 사용
- ⚠️ 포트 포워딩 변경 후 공유기 재시작 권장
- ⚠️ 외부 포트와 내부 포트는 같을 필요 없음

---

## 3. CI/CD 배포 흐름

### 배포 트리거

로컬에서 `git push origin master` 실행 시 GitHub Actions 자동 트리거됩니다.

### 각 저장소별 배포 프로세스

#### Backend (living-craft-backend)

**Workflow**: `.github/workflows/deploy.yml`

배포 단계:
1. 코드 체크아웃
2. Node.js 24 설정 및 의존성 캐시
3. `npm ci` - 의존성 설치
4. `npm run build` - TypeScript 컴파일 및 빌드
5. `NODE_ENV=production npm run migration:run` - 데이터베이스 마이그레이션 실행
6. `pm2 restart living-craft-backend --update-env` - PM2 프로세스 재시작
7. `pm2 save` - PM2 상태 저장
8. Health Check - `curl http://localhost:8000/health` 확인

**소요 시간**: 약 2-3분

**배포 위치**: 로컬 파일시스템 (PM2가 관리)

#### Backoffice (living-craft-backoffice)

**Workflow**: `.github/workflows/deploy.yml`

배포 단계:
1. 코드 체크아웃
2. Node.js 24 설정 및 의존성 캐시 (yarn)
3. `yarn install --frozen-lockfile` - 의존성 설치
4. `yarn build` - Vite 빌드
5. `rm -rf /var/www/living-craft-backoffice/*` - 기존 파일 제거
6. `cp -r dist/* /var/www/living-craft-backoffice/` - 빌드 결과 배포
7. HTTPS Health Check - `curl https://living-craft.p-e.kr` 확인

**소요 시간**: 약 1-2분

**배포 위치**: `/var/www/living-craft-backoffice/`

#### Nginx 설정 변경

**Workflow**: `.github/workflows/nginx-reload.yml` (루트 `.github/workflows/`)

**트리거**: `infra/nginx/` 경로의 파일 변경 시만 실행

배포 단계:
1. 코드 체크아웃
2. `nginx -t` - Nginx 설정 파일 검증
3. `nginx -s reload` - Nginx 재로드 (무중단)
4. Health Check - `curl https://living-craft.p-e.kr/health` 확인

**소요 시간**: 약 30초

**배포 위치**: `/usr/local/etc/nginx/conf.d/` (심볼릭 링크)

### 배포 상태 확인

GitHub 저장소의 **Actions** 탭에서 실시간으로 배포 상태 확인 가능합니다.

---

## 4. Runner 설정 & 관리

### Runner 위치

Self-hosted GitHub Actions Runner가 각 프로젝트 루트에 설치되어 있습니다:

```
living-craft-backend/actions-runner/
living-craft-backoffice/actions-runner/
```

### Runner 시작

```bash
# Backend Runner 시작
cd ~/Desktop/project/living-craft/living-craft-backend/actions-runner
./run.sh

# Backoffice Runner 시작
cd ~/Desktop/project/living-craft/living-craft-backoffice/actions-runner
./run.sh
```

### Runner 중지

Runner 프로세스가 실행 중인 터미널에서 `Ctrl+C` 입력하여 종료합니다.

### 상태 확인

GitHub 저장소 → **Settings** → **Actions** → **Runners**에서 Runner 상태를 확인할 수 있습니다.

상태 표시:
- 🟢 **Idle**: 작업 대기 중
- 🟡 **Active**: 배포 중
- 🔴 **Offline**: 실행 중이 아님

### Mac Mini 재부팅 후 Runner 재시작

서버가 재부팅되면 Runner가 자동으로 시작되지 않으므로 수동으로 다시 시작해야 합니다:

```bash
# 각 Runner를 별도 터미널에서 시작
cd ~/Desktop/project/living-craft/living-craft-backend/actions-runner && ./run.sh &
cd ~/Desktop/project/living-craft/living-craft-backoffice/actions-runner && ./run.sh &

# 또는 백그라운드에서 실행
nohup ~/Desktop/project/living-craft/living-craft-backend/actions-runner/run.sh &
nohup ~/Desktop/project/living-craft/living-craft-backoffice/actions-runner/run.sh &
```

---

## 5. Nginx 설정 관리

### 설정 파일 위치

- **원본 파일**: `living-craft/infra/nginx/living-craft.conf`
- **심볼릭 링크**: `/usr/local/etc/nginx/conf.d/living-craft.conf` → `infra/nginx/living-craft.conf`

### 설정 파일 수정 방법

1. 로컬에서 `infra/nginx/living-craft.conf` 수정
2. `git commit` 및 `git push origin master`
3. GitHub Actions 자동 실행 → Nginx 자동 재로드

### 수동 Nginx 제어

```bash
# 설정 파일 검증 (문법 확인)
nginx -t

# Nginx 시작
nginx

# Nginx 재로드 (무중단, 설정 파일 다시 읽음)
nginx -s reload

# Nginx 종료
nginx -s stop

# Nginx 프로세스 상태 확인
ps aux | grep nginx
```

### 주요 설정 사항

#### SSL/TLS 인증서

```nginx
ssl_certificate /etc/letsencrypt/live/living-craft.p-e.kr/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/living-craft.p-e.kr/privkey.pem;
```

#### 리버스 프록시

- **API**: `/api` → `http://127.0.0.1:8000`
- **Health Check**: `/health` → `http://127.0.0.1:8000/health`

#### SPA 라우팅

Backoffice는 클라이언트 사이드 라우팅을 사용하므로:
```nginx
try_files $uri $uri/ /index.html;
```

#### 파일 업로드

```nginx
location /uploads {
    alias /Users/jangseong-u/production/uploads;
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

---

## 6. Migration 관리

### 로컬 개발 환경 (당신의 맥북)

**개발 환경 설정** (`.env`):
```bash
DB_SYNCHRONIZE=true  # ✅ 자동 스키마 동기화 ON
```

#### 새 테이블 추가 시 (가장 간단함)

```bash
cd living-craft-backend

# 1️⃣ Entity 파일 생성 (예: src/modules/products/entities/product.entity.ts)
# 2️⃣ 개발 서버 재시작
npm run start:dev
# ✨ 자동으로 테이블이 생성됨 (별도 마이그레이션 불필요!)
```

#### 프로덕션 배포 전 마이그레이션 파일 생성

```bash
# Entity 개발을 모두 완료한 후, 배포 전 한 번만 실행
npm run migration:generate -- -n [마이그레이션명]

# 예시
npm run migration:generate -- -n CreateProductsTable

# 생성된 파일 확인
ls src/database/migrations/
```

#### 로컬에서 마이그레이션 테스트 (선택사항)

```bash
# 마이그레이션 상태 확인
npm run migration:show

# 마이그레이션 실행
npm run migration:run

# 마이그레이션 되돌리기 (실패했을 때)
npm run migration:revert
```

### 프로덕션 배포 시 (Mac Mini 서버)

CI/CD 파이프라인이 자동으로 실행합니다:

```bash
# GitHub Actions가 자동 실행 (Backend 배포 시)
NODE_ENV=production npm run migration:run
```

### 체크리스트

- ✅ 로컬에서 Entity 작성 → 개발 서버 재시작 (자동 생성)
- ✅ 개발 완료 후 `npm run migration:generate` 실행
- ✅ 마이그레이션 파일 `git commit`
- ✅ `git push origin master` (CI/CD 자동 배포)
- ✅ 프로덕션 서버에서 자동으로 마이그레이션 실행

### 주의사항

- ⚠️ 큰 테이블의 컬럼 추가/삭제 시는 단계적으로 진행하세요.
- ⚠️ 마이그레이션 파일은 반드시 git에 커밋한 후 배포하세요.
- ⚠️ 프로덕션 마이그레이션은 자동으로 실행되므로 신중하게 작성하세요.

---

## 7. 개발/배포 방법 (치트시트)

### 각 프로젝트 개발 서버 시작

```bash
# Backend (NestJS)
cd living-craft-backend
npm run docker:dev:up  # Docker로 PostgreSQL 시작
npm run start:dev      # 개발 서버 실행 (localhost:8000)

# Backoffice (Vite + React)
cd living-craft-backoffice
yarn dev              # 개발 서버 실행 (localhost:5173)

# Front (Granite + React Native)
cd living-craft-front
yarn dev              # 개발 서버 실행
```

### 프로덕션 배포 (일반적인 흐름)

```bash
# 1. 코드 커밋 및 푸시
git add .
git commit -m "feat: 새 기능 추가"
git push origin master

# 2. GitHub Actions 자동 실행 (Actions 탭에서 확인)
# 3. 배포 완료 후 https://living-craft.p-e.kr 확인
```

### 수동 배포 (Runner가 없을 경우)

#### Backend 수동 배포

```bash
cd ~/Desktop/project/living-craft/living-craft-backend

# 코드 최신화
git pull origin master

# 빌드
npm ci
npm run build

# 마이그레이션
NODE_ENV=production npm run migration:run

# PM2 재시작
pm2 restart living-craft-backend --update-env
pm2 save

# 헬스 체크
curl http://localhost:8000/health
```

#### Backoffice 수동 배포

```bash
cd ~/Desktop/project/living-craft/living-craft-backoffice

# 코드 최신화
git pull origin master

# 빌드
yarn install --frozen-lockfile
yarn build

# 배포
rm -rf /var/www/living-craft-backoffice/*
cp -r dist/* /var/www/living-craft-backoffice/

# 검증
curl https://living-craft.p-e.kr
```

### 배포 롤백

#### Backend 롤백

```bash
# 최근 커밋으로 돌아가기
git reset --hard HEAD~1
git push origin master --force

# 또는 이전 버전 PM2 재시작
pm2 restart living-craft-backend
```

#### Backoffice 롤백

```bash
# 최근 커밋으로 돌아가기
git reset --hard HEAD~1
git push origin master --force

# GitHub Actions 자동 배포 또는 수동 배포
```

---

## 8. 로그 확인 명령어

### Backend 로그

```bash
# PM2 로그 (실시간)
pm2 logs living-craft-backend

# PM2 로그 (마지막 100줄)
pm2 logs living-craft-backend --lines 100

# PM2 프로세스 상태
pm2 status

# PM2 프로세스 상세 정보
pm2 show living-craft-backend
```

### Nginx 로그

```bash
# Access 로그 (실시간)
tail -f /usr/local/var/log/nginx/living-craft-access.log

# Error 로그
tail -f /usr/local/var/log/nginx/living-craft-error.log

# Access 로그 (마지막 50줄)
tail -n 50 /usr/local/var/log/nginx/living-craft-access.log

# 404 에러만 필터링
grep " 404 " /usr/local/var/log/nginx/living-craft-access.log
```

### PostgreSQL 로그

```bash
# Docker 컨테이너 로그 (실시간)
docker logs -f living_craft_postgres

# Docker 컨테이너 로그 (마지막 100줄)
docker logs living_craft_postgres --tail 100

# 컨테이너 상태 확인
docker ps | grep living_craft_postgres
```

### GitHub Actions 로그

GitHub 저장소 → **Actions** 탭에서 각 워크플로우 실행 기록을 확인할 수 있습니다:

- **Backend Deploy**: living-craft-backend 변경 시 실행
- **Backoffice Deploy**: living-craft-backoffice 변경 시 실행
- **Nginx Reload**: `infra/nginx/` 변경 시 실행

---

## 9. 문제 해결 가이드

### Runner가 중단되었을 때

**증상**: GitHub Actions 워크플로우가 "Waiting for a runner" 상태로 멈춤

**해결 방법**:

```bash
# 1. Runner 상태 확인
cd ~/Desktop/project/living-craft/living-craft-backend/actions-runner
# 또는
cd ~/Desktop/project/living-craft/living-craft-backoffice/actions-runner

# 2. 프로세스 확인
ps aux | grep run.sh

# 3. Runner 재시작
# 기존 프로세스 종료
kill -9 [PID]

# Runner 다시 시작
./run.sh

# 4. GitHub 저장소 Settings → Actions → Runners에서 상태 확인
```

### PM2 프로세스가 죽었을 때

**증상**: `curl http://localhost:8000/health` 연결 실패

**해결 방법**:

```bash
# 1. PM2 상태 확인
pm2 status

# 2. 프로세스 재시작
pm2 restart living-craft-backend

# 3. 로그 확인
pm2 logs living-craft-backend

# 4. 필요하면 환경변수 갱신 후 재시작
pm2 restart living-craft-backend --update-env
```

### Nginx 재시작이 필요할 때

**증상**: HTTPS 연결 실패, SSL 인증서 에러

**해결 방법**:

```bash
# 1. 설정 파일 검증
nginx -t

# 2. 에러가 있으면 파일 확인
cat /usr/local/etc/nginx/conf.d/living-craft.conf

# 3. Nginx 재로드 (무중단)
nginx -s reload

# 4. 상태 확인
curl https://living-craft.p-e.kr/health
```

### 데이터베이스 연결 실패

**증상**: Backend 로그에 "ECONNREFUSED 127.0.0.1:5432"

**해결 방법**:

```bash
# 1. PostgreSQL 컨테이너 상태 확인
docker ps | grep living_craft_postgres

# 2. 컨테이너 시작 여부 확인
docker exec -it living_craft_postgres pg_isready -U postgres

# 3. 컨테이너 로그 확인
docker logs living_craft_postgres

# 4. 필요하면 컨테이너 재시작
docker restart living_craft_postgres

# 5. Backend 서버 재시작
pm2 restart living-craft-backend
```

### 마이그레이션 실패

**증상**: Backend 배포 실패, "migration failed" 에러

**해결 방법**:

```bash
# 1. 로컬에서 마이그레이션 테스트
cd living-craft-backend
npm run docker:dev:up
npm run migration:run

# 2. 에러가 발생하면 마이그레이션 파일 확인
ls -la src/database/migrations/

# 3. 마이그레이션 상태 확인
npm run migration:show

# 4. 필요하면 마이그레이션 되돌리기
npm run migration:revert

# 5. 문제를 수정한 후 다시 커밋
git add .
git commit -m "fix: 마이그레이션 에러 수정"
git push origin master
```

### SSL 인증서 갱신 확인

**인증서 상태 확인**:

```bash
# 현재 설치된 인증서 확인
sudo certbot certificates

# 인증서 자세히 보기
openssl x509 -in /etc/letsencrypt/live/living-craft.p-e.kr/fullchain.pem -text -noout | grep -A 2 "Validity"

# HTTPS 연결 확인
openssl s_client -connect living-craft.p-e.kr:443
```

**자동 갱신이 실패했을 경우** (드물지만):

```bash
# 강제 갱신
sudo certbot renew --force-renewal

# Nginx 재로드
nginx -s reload

# 갱신 로그 확인
sudo journalctl -u certbot.timer -n 50
```

---

## 추가 정보

### 관련 문서

- **전체 프로젝트 가이드**: `living-craft/CLAUDE.md`
- **Backend 가이드**: `living-craft-backend/CLAUDE.md`
- **Backoffice 가이드**: `living-craft-backoffice/CLAUDE.md`
- **API 명세**: `living-craft-front/docs/api/API_SPECIFICATION.md`

### 중요 경로

| 경로 | 설명 |
|-----|------|
| `/Users/jangseong-u/production/uploads` | 사용자 업로드 파일 |
| `/var/www/living-craft-backoffice` | Backoffice 빌드 결과 |
| `/usr/local/etc/nginx/conf.d/` | Nginx 설정 디렉토리 |
| `/etc/letsencrypt/live/living-craft.p-e.kr/` | SSL 인증서 |
| `/Users/jangseong-u/.pm2/logs/` | PM2 로그 |

### 연락처 & 문제 보고

인프라 관련 문제가 있으면:
1. 로그 확인 (위의 로그 확인 명령어 참조)
2. 문제 해결 가이드 참조
3. GitHub Issues에 상세 내용 기록
