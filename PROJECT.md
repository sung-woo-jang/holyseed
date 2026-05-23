# 무한매수법 자동매매 웹앱 (ib-front + living-craft-backend/iv)

## 개요

라오어의 **무한매수법 V4.0** 기반 LOC 주문 자동계산 웹앱.

매일 종가 기준 LOC(Limit-on-Close) 주문가·수량을 자동 계산하고, 장 마감 후 체결 내역을 입력하면 내일 계획이 즉시 갱신된다.

**주요 기능**
- 당일 매수·매도 LOC 주문가 자동 계산 (모드별: 사이클시작/전반전/후반전/리버스)
- T값·평단·보유주수·잔금 실시간 추적
- 체결 입력 → 상태 자동 전이 (모드 변경, 사이클 종료 감지)
- 체결 수정·삭제 시 이후 모든 상태 재계산 (`rebuildState`)
- 복리/단리 사이클 재시작

---

## 모노레포 구조

```
living-craft/
├── ib-front/                          # 프론트엔드 (Vite + React 19)
└── living-craft-backend/
    └── src/projects/iv/               # 백엔드 모듈 (NestJS)
        ├── calculator/                # 순수 계산 로직 (DB 없음)
        │   ├── common/formulas.ts     # 별%, 별지점, 평단, 1회매수액
        │   └── infinite/             # 모드별 계획 + T값 매트릭스
        ├── entities/                  # TypeORM 엔티티 (iv 스키마)
        └── modules/
            ├── strategies/            # 전략 CRUD
            ├── plans/                 # 일별 계획 생성·캐시
            ├── executions/            # 체결 입력·수정·삭제
            ├── prices/                # Yahoo Finance 시세
            └── cycles/                # 사이클 종료·재시작
```

**API prefix**: `/api/iv/*`  
**DB 스키마**: `iv` (PostgreSQL)  
**프론트 개발 서버**: http://localhost:3200  
**백엔드 개발 서버**: http://localhost:8000  

---

## 외부 API: Yahoo Finance 2 (`yahoo-finance2`)

### 사용 엔드포인트

| 메서드 | 용도 | 호출 시점 |
|---|---|---|
| `yf.quote(ticker)` | 현재 시세 (종가·고가) | 시세 갱신마다 1회 |
| `yf.chart(ticker, { period1, interval: '1d' })` | 일별 종가 이력 | 증분 fetch (아래 설명) |

### 시세 갱신 흐름

```
[평일 ET 16:30 Cron] ─┐
[POST /iv/prices/:ticker/refresh] ─┘
         │
         ▼
  seedHistory(ticker)          ← 증분 fetch
         │
         ▼
  yf.quote(ticker)             ← 당일 종가
         │
         ▼
  iv.prices upsert
         │
         ▼
  iv.state.last_close 갱신
  iv.state.recent_closes 갱신 (직전 5거래일)
         │
         ▼
  해당 ticker 전략들의 오늘 plan 재생성
```

### seedHistory — 증분 fetch 전략

**문제**: 매번 2010-01-01부터 전체 이력(3000+행)을 fetch·upsert하면 API 호출 비용·시간이 크다.

**해결**: DB에서 해당 ticker의 가장 최신 `price_date`를 먼저 조회한 후, 그 다음 날부터만 fetch.

```
첫 실행 (DB 비어있음):
  period1 = 2010-01-01  →  약 3000행 upsert

이후 실행 (데이터 있음):
  latest.priceDate = 2026-05-22
  period1 = 2026-05-23
  →  0~1행만 fetch (이미 최신이면 Yahoo API 호출 생략)
```

당일 데이터가 이미 있으면(`period1 > today`) Yahoo chart API를 아예 호출하지 않는다.

### Cron 병렬 실행

TQQQ와 SOXL을 `Promise.all`로 동시에 갱신한다. 순차 실행 대비 약 절반의 시간.

```typescript
await Promise.all(['TQQQ', 'SOXL'].map(ticker => fetchAndSave(ticker)))
```

### Plan 즉시 재생성

시세 갱신 완료 후 해당 ticker의 모든 전략에 대해 오늘 plan을 즉시 재생성한다. 이전에는 `/plans/today` 첫 요청 시에만 재계산됐으나, 갱신 즉시 반영으로 개선.

---

## 핵심 계산 로직 요약

### T값 갱신 (무매 V4.0)

| 체결 타입 | T 변화 |
|---|---|
| `buy_full` | T += 1 |
| `buy_half_star` / `buy_half_avg` | T += 0.5 |
| `sell_quarter` | T *= 0.75 |
| `sell_fixed` | T *= 0.25 (다음 매수에 +1 또는 +0.5) |
| 리버스 매도 (40분할) | T *= 0.95 |
| 리버스 매수 (40분할) | T += (40 - T) × 0.25 |

### 별% 공식 (모드 전환 기준점)

| 종목/분할 | 공식 |
|---|---|
| TQQQ 40 | 15 - 0.75 × T |
| TQQQ 20 | 15 - 1.5 × T |
| SOXL 40 | 20 - T |
| SOXL 20 | 20 - 2 × T |

### 모드 전이 조건

```
cycle_start  →  first_half   : buy_full 체결 시 (T=1)
first_half   →  second_half  : T ≥ division / 2
second_half  →  reverse      : T ≥ division - 1
reverse      →  first_half   : TQQQ 종가 > 평단×0.85 / SOXL 종가 > 평단×0.80
any          →  cycle_start  : 보유주수 = 0 (사이클 종료)
```

---

## 개발 명령어

```bash
# 백엔드
cd living-craft-backend && npm run start:dev

# 프론트
cd ib-front && yarn dev

# Docker (PostgreSQL)
npm run docker:dev:up
```
