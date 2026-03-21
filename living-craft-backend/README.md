# 개인 사업자용 예약 서비스 플랫폼 백엔드

1인 사업자가 운영하는 현장 방문형 서비스의 온라인 예약을 받고 관리할 수 있는 웹 플랫폼의 백엔드 API 서버입니다.

## 📋 프로젝트 개요

### 핵심 컨셉
- **고객**: 간편한 온라인 예약 사이트
- **운영자**: 내 사업 관리 도구  
- **예약 방식**: 정찰제(고정가) + 견적제(맞춤형) 동시 지원

### 주요 기능
- 🔐 **인증 시스템**: JWT 기반, 네이버 OAuth, 비회원 예약 지원
- 📅 **예약 관리**: 정찰제/견적제 서비스, 실시간 예약 가능 시간 확인  
- 📊 **관리자 대시보드**: 예약 현황, 견적 관리, 고객 관리
- 📱 **알림 시스템**: SMS/이메일 자동 발송 (네이버 클라우드 플랫폼)
- ⭐ **리뷰 시스템**: 고객 만족도 관리
- 🎨 **포트폴리오**: 작업 사례 관리

## 🛠️ 기술 스택

```
Frontend: React + TypeScript
Backend:  NestJS + TypeScript  
Database: PostgreSQL + TypeORM
Cache:    Redis (Bull Queue)
Styling:  SCSS
```

### 주요 라이브러리
- **NestJS**: 백엔드 프레임워크
- **TypeORM**: ORM 
- **JWT**: 인증
- **Bull**: 작업 큐 (알림 발송)
- **Multer**: 파일 업로드
- **Winston**: 로깅
- **class-validator**: 데이터 검증

## 🚀 개발 환경 설정

### 환경 요구사항
- Node.js 18+
- Docker & Docker Compose

### 1. 프로젝트 클론
```bash
git clone https://github.com/your-username/reservation-backend.git
cd reservation-backend
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경 변수 설정
```bash
cp .env.example .env
# .env 파일을 수정하여 설정 값 입력
```

### 4. 데이터베이스 및 Redis 실행 (Docker)
```bash
# DB, Redis, pgAdmin 실행
docker-compose -f docker-compose.local.yml up -d

# 실행 확인
docker ps
```

### 5. 데이터베이스 초기화
```bash
# 데이터베이스 마이그레이션
npm run migration:run

# 시드 데이터 생성 (선택사항)
npm run seed
```

### 6. 개발 서버 실행
```bash
npm run start:dev
```

### 7. 접속 확인
- **API 서버**: http://localhost:3000
- **Swagger 문서**: http://localhost:3000/api/docs  
- **헬스체크**: http://localhost:3000/health
- **pgAdmin**: http://localhost:5050 (admin@reservation.com / admin123)
- **Redis Commander**: http://localhost:8081

## 🐛 Docker 트러블슈팅

### 컨테이너 관리 명령어

```bash
# 기존 컨테이너/볼륨 완전 정리
docker-compose -f docker-compose.local.yml down -v --remove-orphans

# 이미지 다시 받기
docker-compose -f docker-compose.local.yml pull

# 환경변수 확인 (설정 검증)
docker-compose -f docker-compose.local.yml config

# 전체 서비스 실행
docker-compose -f docker-compose.local.yml up -d

# 특정 서비스만 실행 (문제 분리 진단)
docker-compose -f docker-compose.local.yml up postgres -d
docker-compose -f docker-compose.local.yml up redis -d
docker-compose -f docker-compose.local.yml up pgadmin -d
docker-compose -f docker-compose.local.yml up redis-commander -d
```

### 로그 및 상태 확인

```bash
# 서비스별 로그 확인
docker-compose -f docker-compose.local.yml logs postgres
docker-compose -f docker-compose.local.yml logs redis  
docker-compose -f docker-compose.local.yml logs pgadmin
docker-compose -f docker-compose.local.yml logs redis-commander

# 실시간 로그 모니터링
docker-compose -f docker-compose.local.yml logs -f

# 컨테이너 상태 확인
docker ps -a
docker stats

# 헬스체크 확인
docker inspect reservation_postgres_dev | grep Health -A 10
docker inspect reservation_redis_dev | grep Health -A 10
```

### 네트워크 및 볼륨 확인

```bash
# 네트워크 상태
docker network ls
docker network inspect reservation-backend_reservation_dev_network

# 볼륨 상태  
docker volume ls
docker volume inspect reservation-backend_postgres_data_dev
docker volume inspect reservation-backend_redis_data_dev

# 컨테이너 간 통신 테스트
docker exec -it reservation_postgres_dev pg_isready
docker exec -it reservation_redis_dev redis-cli ping
```

### 포트 충돌 해결

```bash
# 포트 사용 확인
netstat -tulpn | grep :5432  # PostgreSQL
netstat -tulpn | grep :6379  # Redis  
netstat -tulpn | grep :5050  # pgAdmin
netstat -tulpn | grep :8081  # Redis Commander

# macOS의 경우
lsof -i :5432
lsof -i :6379
lsof -i :5050
lsof -i :8081

# 포트를 사용하는 프로세스 종료
sudo kill -9 $(lsof -t -i:5432)
```

### 시스템 리소스 확인

```bash
# 메모리 확인
free -h

# 디스크 공간 확인  
df -h
docker system df

# Docker 디스크 정리 (주의: 다른 프로젝트 영향)
docker system prune -f
docker volume prune -f
```

### 흔한 문제 해결

1. **PostgreSQL 연결 실패**
```bash
# 컨테이너 재시작
docker-compose -f docker-compose.local.yml restart postgres

# 데이터베이스 연결 테스트
docker exec -it reservation_postgres_dev psql -U postgres -d reservation_dev
```

2. **Redis 연결 실패**  
```bash
# Redis 재시작
docker-compose -f docker-compose.local.yml restart redis

# Redis 연결 테스트
docker exec -it reservation_redis_dev redis-cli ping
```

3. **pgAdmin 접속 불가**
```bash
# pgAdmin 로그 확인
docker-compose -f docker-compose.local.yml logs pgadmin

# pgAdmin 데이터 초기화
docker volume rm reservation-backend_pgadmin_data_dev
docker-compose -f docker-compose.local.yml up pgadmin -d
```

4. **환경변수 문제**
```bash
# .env 파일 확인
cat .env

# 환경변수 적용 확인
docker-compose -f docker-compose.local.yml config | grep -A 5 environment
```

### 완전 초기화 (최후의 수단)

```bash
# 모든 컨테이너와 볼륨 삭제
docker-compose -f docker-compose.local.yml down -v --remove-orphans

# 관련 이미지 삭제
docker rmi postgres:15-alpine redis:7.2-alpine dpage/pgadmin4:latest rediscommander/redis-commander:0.8.1

# 네트워크 정리
docker network prune -f

# 처음부터 다시 시작
docker-compose -f docker-compose.local.yml up -d
```

## 🐳 Docker 구성

### 하이브리드 접근법
- **Docker 사용**: PostgreSQL, Redis, pgAdmin (인프라)
- **직접 실행**: NestJS 애플리케이션 (개발 편의성)

```yaml
# docker-compose.local.yml
services:
  postgres:    # 5432 포트
  redis:       # 6379 포트  
  pgadmin:     # 5050 포트
```

### 장점
- ✅ DB 설치/설정 복잡함 없음
- ✅ 애플리케이션 디버깅 쉬움  
- ✅ 코드 변경 시 빠른 재시작
- ✅ 개인 개발자에게 최적화

## 📚 API 문서

### Swagger UI
개발 환경에서 Swagger를 통해 API 테스트 가능합니다.
- **URL**: http://localhost:3000/api/docs

### 주요 엔드포인트

```typescript
// 인증
POST   /api/auth/login/naver       # 네이버 OAuth
POST   /api/auth/admin/login       # 관리자 로그인  
POST   /api/auth/verify            # 비회원 예약 인증

// 서비스
GET    /api/services               # 서비스 목록 (공개)
POST   /api/services               # 서비스 생성 (관리자)

// 예약  
POST   /api/reservations           # 예약 생성
GET    /api/reservations/search    # 예약번호로 조회 (공개)
GET    /api/reservations           # 예약 목록 (관리자)

// 견적
POST   /api/quotes                 # 견적 요청 생성  
PUT    /api/quotes/:id             # 견적서 작성 (관리자)
POST   /api/quotes/:id/approve     # 견적 승인 (고객)

// 캘린더
GET    /api/calendar/available     # 예약 가능 날짜/시간
GET    /api/calendar/slots         # 특정 날짜 시간 슬롯

// 기타
GET    /api/reviews                # 리뷰 목록 (공개)
GET    /api/portfolio              # 포트폴리오 (공개)  
GET    /api/faq                    # FAQ (공개)
```

## 🗄️ 데이터베이스 설계

### 핵심 테이블

```sql
users                    # 사용자 (관리자/고객)
├── oauth_accounts      # OAuth 정보
└── user_profiles       # 고객 추가 정보

services                 # 서비스 정보
└── service_images      # 서비스 이미지

reservations            # 예약 정보
├── quotes              # 견적 정보 (견적제용)
└── reviews             # 리뷰 (예약당 1개)

calendar_settings       # 영업시간 설정
blocked_dates          # 휴무일/차단된 날짜

portfolio_images       # 포트폴리오
notification_templates # 알림 템플릿
notification_logs      # 알림 발송 로그
faqs                   # 자주 묻는 질문
```

### 예약 상태 관리

```typescript
enum ReservationStatus {
  PENDING = 'pending',      // 견적 대기
  CONFIRMED = 'confirmed',  // 예약 확정  
  COMPLETED = 'completed',  // 서비스 완료
  CANCELLED = 'cancelled'   // 취소됨
}
```

## 🧪 테스트

```bash
# 단위 테스트
npm run test

# 테스트 커버리지
npm run test:cov  

# 테스트 감시 모드  
npm run test:watch
```

**참고**: E2E 테스트는 개인 프로젝트에서 불필요하여 제거했습니다.

## 🚀 배포

### 개발 환경
```bash
# 1. DB/Redis 시작
docker-compose -f docker-compose.local.yml up -d

# 2. 애플리케이션 개발 모드
npm run start:dev
```

### 프로덕션 배포
```bash  
# 1. DB/Redis 시작
docker-compose -f docker-compose.local.yml up -d

# 2. 애플리케이션 빌드 후 실행
npm ci --only=production
npm run build  
npm run start:prod
```

### PM2를 사용한 배포 (권장)
```bash
npm install -g pm2
npm run build
pm2 start dist/main.js --name reservation-api
pm2 startup
pm2 save
```

## ⚙️ 환경 변수

### 필수 설정

```bash
# 데이터베이스
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password123
DB_DATABASE=reservation_db

# JWT 
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# 관리자 계정
ADMIN_EMAIL=admin@example.com  
ADMIN_PASSWORD=admin123!

# 네이버 OAuth
NAVER_CLIENT_ID=your-naver-client-id
NAVER_CLIENT_SECRET=your-naver-client-secret
NAVER_CALLBACK_URL=http://localhost:3000/api/auth/callback/naver
```

### 알림 설정 (네이버 클라우드 플랫폼)

```bash
# SMS (SENS)
NCP_ACCESS_KEY=your-ncp-access-key
NCP_SECRET_KEY=your-ncp-secret-key  
NCP_SERVICE_ID=your-service-id
NCP_CALLING_NUMBER=010-1234-5678

# Email (Cloud Outbound Mailer)
NCP_EMAIL_ACCESS_KEY=your-email-access-key
NCP_EMAIL_SECRET_KEY=your-email-secret-key
```

## 🔐 보안 고려사항

- ✅ JWT 토큰 기반 인증
- ✅ 비밀번호 해싱 (bcrypt)  
- ✅ CORS 설정
- ✅ 입력 데이터 검증 (class-validator)
- ✅ SQL 인젝션 방지 (TypeORM)
- ✅ API Rate Limiting (프로덕션 권장)

## 📱 특별 기능

### 예약번호 시스템
```typescript
// 형식: YYYYMMDD-0001
// 예: 20241225-0001 (2024년 12월 25일 첫 번째 예약)
```

### 자동 알림 시스템
- 예약 확정 시: 고객에게 SMS/이메일  
- 하루 전 리마인더: 자동 발송
- 견적 도착 알림: 즉시 발송

### 이중 예약 방지
- 실시간 예약 가능 시간 확인
- 트랜잭션 기반 예약 처리
- 영업시간/휴무일 자동 차단

## 🏗️ 프로젝트 구조

```
reservation-backend/
├── src/
│   ├── auth/              # 인증 모듈
│   ├── users/             # 사용자 관리  
│   ├── services/          # 서비스 관리
│   ├── reservations/      # 예약 관리
│   ├── quotes/            # 견적 관리
│   ├── calendar/          # 캘린더 관리
│   ├── reviews/           # 리뷰 관리
│   ├── notifications/     # 알림 시스템
│   ├── files/             # 파일 업로드
│   └── common/            # 공통 모듈
├── uploads/               # 업로드 파일 저장소
├── docker-compose.local.yml
└── README.md
```

## 🤝 개발 가이드

### 코딩 컨벤션
- ESLint + Prettier 적용
- TypeScript strict 모드
- NestJS 모듈 구조 준수
- 의미있는 커밋 메시지

### 브랜치 전략
```bash
main        # 프로덕션
develop     # 개발
feature/*   # 기능 개발
hotfix/*    # 긴급 수정
```

## 📈 운영 고려사항

### 자동화 포인트
- ✅ 정찰제 예약 자동 확정
- ✅ 알림 발송 자동화  
- ✅ 일정 차단 자동화

### 수동 처리 
- 📝 견적 작성 (케이스별 직접 작성)
- 📞 일정 조정 (필요시 직접 연락)
- 🔧 특수 상황 대응

### 백업 계획
- 💾 데이터: Docker Volume으로 자동 관리
- 📊 연락처: 모든 예약 정보 엑셀 다운로드 지원
- ☎️ 대체 수단: 전화 예약도 병행 운영

## 📋 TODO 리스트

- [ ] 네이버 OAuth 완전 구현
- [ ] 파일 업로드 최적화
- [ ] 통계 대시보드 고도화  
- [ ] API 문서 자동 생성
- [ ] 로깅 시스템 고도화
- [ ] 성능 모니터링 도구 연동

## 📞 지원

- **이슈**: [GitHub Issues](https://github.com/your-username/reservation-backend/issues)
- **문서**: 프로젝트 내 `prd.md`, `develop.md` 참조

---

**🎯 이 프로젝트는 개인 사업자가 혼자서도 쉽게 관리할 수 있도록 설계되었습니다.**

복잡한 기능보다는 핵심 기능에 집중하여 실용적이고 유지보수가 쉬운 구조로 개발했습니다.
