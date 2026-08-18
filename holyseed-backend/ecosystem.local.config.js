/**
 * 로컬(개발 맥) laofus+VR 상시 가동용 pm2 설정 — 서버용 ecosystem.config.js와 별개.
 *
 * ⚠️ 절대 instances>1 / cluster 금지 — cron이 인스턴스마다 발화해 실주문이 중복된다.
 * ⚠️ LAOFUS_LIVE/SCHEDULER, VR_LIVE/SCHEDULER는 여기(pm2 env)에서만 켠다 — .env는 안전 기본값(false) 유지.
 *    (@nestjs/config는 이미 설정된 process.env를 덮어쓰지 않으므로 pm2 env가 우선)
 * ⚠️ VR도 laofus와 같은 토스 계좌/API 앱을 쓰므로 반드시 이 프로세스 안에서 함께 돈다
 *    (TossClientService를 같은 DI 싱글톤으로 공유 — 토큰 경합 원천 차단, 별도 pm2 앱 금지)
 *
 * 운용: ad-hoc `nest dev` 필요 시 `pm2 stop laofus-backend` 후 개발, 끝나면 start.
 */
module.exports = {
  apps: [
    {
      name: 'laofus-backend',
      cwd: __dirname, // .env 로드 기준 경로
      script: 'dist/main.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '500M',
      min_uptime: '10s',
      max_restarts: 20,
      env: {
        NODE_ENV: 'development', // 로컬 DB(.env) + synchronize:true
        PORT: '8001', // holyseed-backend(8000, 클러스터)와 분리 — 대시보드는 holyseed-backend의 /api/laofus/* 조회만 사용하므로 이 포트는 외부에서 쓸 일 없음
        // ⚠️ 실거래 상태(계좌 잔고·보유수량과 대조되는 원장)가 걸려 있어 DB_DATABASE를 여기서 고정한다.
        //    .env/.env.local의 DB_DATABASE는 다른 로컬 개발용으로 자유롭게 바뀔 수 있는데(2026-07-25 실제로
        //    holyseed_dev로 바뀌어 있어서 이 프로세스가 며칠 지난 스냅샷 DB로 뜰 뻔함), 그게 이 라이브
        //    트레이딩 프로세스에 영향을 주면 안 된다 — 항상 실계좌와 일치하는 'holyseed'만 사용.
        DB_DATABASE: 'holyseed',
        LAOFUS_LIVE: 'true',
        LAOFUS_SCHEDULER: 'true',
        // 매매 시각: 마감 95분 전 (2026-07-21 토스 앱 확인 — 소수점 주문가능시간이
        // 22:30~04:00 KST(EDT)/23:30~05:00 KST(EST)로, 마감 65분 전(구 설정)은 그 마감
        // 불과 5분 전이라 타이트해 30분 더 앞당김)
        LAOFUS_RUN_CRON_1: '25 3 * * 2-6', // EDT: 마감 05:00 KST → 03:25
        LAOFUS_RUN_CRON_2: '25 4 * * 2-6', // EST: 마감 06:00 KST → 04:25
        LAOFUS_WINDOW_MIN: '90',
        LAOFUS_WINDOW_MAX: '105',
        // 장중 쿼터매도/전량매도 즉시 감시 — 신규 기능이라 며칠간 dry-run으로 로그만 관찰 후
        // 문제 없으면 LAOFUS_SELL_MONITOR_LIVE를 'true'로 바꿀 것 (EOD 라이브에는 영향 없음)
        LAOFUS_SELL_MONITOR: 'true',
        LAOFUS_SELL_MONITOR_LIVE: 'false',
        // 기본 '*/5 * * * *'(매 5분, :00/:05/.../:25/.../:40/.../:55)는 EOD run(:25)·회수(:40)
        // 크론과 분 단위로 겹쳐 this.running 락을 공유하는 run()/reconcileOnly()가 조용히(이벤트도
        // 안 남기고) 스킵되는 사고가 실제 발생함(2026-08-18, 전날 마감 쿼터매도가 두 번 다 증발).
        // :25/:40을 피하도록 2분 오프셋 — 감시 주기(5분)는 그대로 유지.
        LAOFUS_SELL_MONITOR_CRON: '2-59/5 * * * *',
        // VR(TQQQ 밸류 리밸런싱) — laofus와 같은 토스 계좌/API 앱을 쓰므로 토큰 경합을 피하려고
        // 같은 프로세스(이 laofus-backend 앱)에서 함께 돈다. 절대 별도 pm2 앱으로 분리하지 말 것.
        VR_LIVE: 'true',
        VR_SCHEDULER: 'true',
        VR_RUN_CRON: '*/5 * * * *', // 5분마다, 프리+정규+애프터마켓 전부
        VR_EXTENDED_LIMIT_BUFFER_PCT: '0.3',
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
    {
      // lab 대시보드 상시 서빙 (무한매수법 섹션 포함) — vite preview가 dist/를 :4800에 서빙 (/api → :8000 프록시 내장)
      name: 'lab-front',
      cwd: `${__dirname}/../lab-front`,
      script: 'node_modules/vite/bin/vite.js',
      args: 'preview',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
    {
      // 새벽 실행 보장 — 유휴/시스템 잠자기 방지 (전원 연결 시). 뚜껑은 열어둘 것.
      name: 'laofus-caffeinate',
      script: '/usr/bin/caffeinate',
      args: '-is',
      interpreter: 'none',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
    },
  ],
}
