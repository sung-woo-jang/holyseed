# laofus — SOXL 소수점 무한매수법 자동매매

라오어 무한매수법 V4.0(40분할)을 토스증권 Open API로 자동화. 원본 프로젝트(`~/Desktop/Project/laofus`)에서 2026-07-15 이관.

## 시스템 구성

| 부분 | 위치 |
|---|---|
| 판단 로직 (순수함수) | `packages/laofus-core/` — 백엔드·프론트 공유, 테스트 19개 |
| 엔진 + API | `holyseed-backend/src/projects/laofus/` (`laofus` DB 스키마, `/api/laofus/*`) |
| 대시보드 | `laofus-front/` (:3800) |
| 방법론 문서 | `docs/laofus/방법론/`, `docs/laofus/VR/` |
| 토스 API 스펙 | `docs/laofus/toss-openapi.json` |

## 운용 규칙 (요약 — 상세는 방법론 문서)

**LOC 에뮬레이션**: 토스 LOC(`LIMIT`+`CLS`)는 정수 수량만 지원 → 소수점 무매는 **장마감 30분 전 현재가로 조건 판단 + 시장가 주문** (`orderAmount` 금액지정 매수 / 소수점 수량 매도, 둘 다 정규장만).

- 별% = (20 − T)%, 별지점 = 평단 × (1 + 별%), 1회매수금 = 잔금/(40 − T)
- 전반전(T<20): P<평단 → 전액 매수(T+1) / 평단≤P<별지점 → 절반(T+0.5) / P≥별지점 → 매수 없음
- 후반전(20≤T<40): P<별지점 → 전액 매수(T+1)
- 매도: P≥별지점 → 쿼터매도(보유/4, T×0.75) / P≥평단×1.20 → 전량매도(사이클 종료)
- T>39: 리버스모드 — 자동화 미지원, 엔진 중단 후 수동
- 사이클 종료 시 `cycleDone` — 복리 여부 사용자 확인 후 새 사이클 수동 시작

**안전장치**: 계좌-DB 보유수량 불일치 시 주문 중단 / DB 다운 시 주문 없이 중단 / 멱등키(clientOrderId) 사용 / 스킵·오류 전부 Event 기록.

**시간창**: cron 04:30+05:30(KST, 화~토) 이중 등록, `checkWindow`가 마감 20~35분 전 창 검증 (서머타임 자동 대응).
주의 — 토스 캘린더 API의 `today`는 KST 날짜 기준이라 새벽엔 진행 중 세션이 `previousBusinessDay`에 있음 (2026-07-15 미체결 사고의 원인, 회귀 테스트로 고정).

**잔금 원칙**: 계좌 예수금에 무매 외 자금 섞여 있음 → 1회매수금은 반드시 `laofus.engine_state.cash` 기준. `buying-power`는 주문 전 잔액 검증에만.

## 환경변수 (holyseed-backend/.env)

```
TOSS_CLIENT_ID / TOSS_CLIENT_SECRET   # 토스 Open API 키 (live)
LAOFUS_LIVE=false                     # ⚠️ .env는 항상 false — LIVE는 pm2 env 주입으로만
LAOFUS_SCHEDULER=false                # ⚠️ .env는 항상 false — 동상 (ad-hoc nest dev 안전 기본값)
LAOFUS_API_KEY=                       # 설정 시 X-Laofus-Key 헤더 검증 (서버 배포 시 필수)
```

## 로컬 pm2 상시 가동 (2026-07-15 완전 전환, 현재 운용)

`holyseed-backend/ecosystem.local.config.js`가 3개 앱 관리:

| 앱 | 역할 |
|---|---|
| `laofus-backend` | dist/main.js :8000 — **pm2 env로 `LAOFUS_LIVE=true`+`LAOFUS_SCHEDULER=true` 주입** (fork 1개 고정 — cluster 금지, cron 중복 주문) |
| `laofus-front` | vite preview :4800 — 대시보드 상시 서빙 (`/api` → :8000 프록시) |
| `laofus-caffeinate` | `caffeinate -is` — 새벽 실행 보장(잠자기 방지). 충전기 연결+뚜껑 열기 유지 |

운용 규칙:
- **백엔드 코드 수정 후**: `yarn workspace @holyseed/backend build && pm2 restart laofus-backend`
- **프론트 수정 후**: `yarn build:laofus && pm2 restart laofus-front`
- **ad-hoc `nest dev` 필요 시**: `pm2 stop laofus-backend` → 개발(:8000, .env 안전 기본값이라 dry·스케줄 off) → `pm2 start laofus-backend`
- 재부팅 생존: `pm2 startup`이 출력하는 sudo 명령 1회 실행 필요 (미실행 상태면 재부팅 후 `pm2 resurrect`)

## 서버 배포 체크리스트

1. 서버 postgres에 `CREATE SCHEMA IF NOT EXISTS laofus;` (TypeORM이 스키마 자체는 안 만듦)
2. 서버 `.env.production`에 위 환경변수 추가 (`LAOFUS_API_KEY` 반드시 설정 — 매매 API 공개 노출 방지)
3. 배포 후 `yarn laofus:seed` 1회 (서버에서)
4. dry-run 판단 로그 확인 후 `LAOFUS_LIVE=true` + pm2 restart
5. **로컬과 서버 동시 LIVE 금지** — 중복 주문 발생. 서버 전환 시 로컬은 `LAOFUS_SCHEDULER=false`

## 현재 상태 (2026-07-15 이관 시점)

- 1차 사이클 (6/16 시작), T=15, 보유 3.570558주, 평단 $211.44, 잔금 $1,245.06, 원금 $2,000
- 노션 "매매 히스토리" DB는 수동 병행 기록 (시드 데이터의 원본)
- 토스 앱 자동투자($25×2)는 7/14 해지 완료

## 토스 Open API 핵심 제약

- LOC = `LIMIT`+`timeInForce=CLS`, 미국주식 전용, **정수 수량만**
- 소수점 매수: `orderAmount` MARKET (US, 정규장만) / 소수점 매도: 수량 MARKET SELL (6자리, 정규장만)
- client당 유효 토큰 1개 (재발급 시 기존 무효화) → `.laofus-token-cache.json` 파일 캐시 필수
- rate limit 빡빡 — `/accounts` 반복 호출 금지 (accountSeq 캐시), 시세·계좌 조회는 서버 캐시 경유
