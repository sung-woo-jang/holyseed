module.exports = {
  apps: [
    {
      name: 'holyseed-backend',
      script: 'dist/main.js',
      instances: 2, // CPU 코어 수에 맞게 조정 (Mac Mini 성능에 따라 1~4)
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',

      // 환경 변수 설정
      env_production: {
        NODE_ENV: 'production',
        PORT: 8000,
        CORS_ORIGINS: 'https://holyseed.p-e.kr,https://ad.holyseed.p-e.kr,https://wedding.holyseed.p-e.kr,https://lab.holyseed.p-e.kr',
      },

      // 로그 설정
      error_file: '/Users/jangseong-u/production/logs/backend-error.log',
      out_file: '/Users/jangseong-u/production/logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      // 재시작 정책
      min_uptime: '10s',
      max_restarts: 10,

      // 프로세스 시작 대기 시간
      listen_timeout: 10000,
      kill_timeout: 5000,
    },
    {
      // lab 대시보드 상시 서빙 — vite preview가 dist/를 :4800에 서빙 (/api → :8000 프록시 내장)
      name: 'lab-front',
      cwd: '/Users/jangseong-u/project/holyseed/lab-front',
      script: 'node_modules/vite/bin/vite.js',
      args: 'preview',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
    {
      // laofus+VR 실주문 엔진 — holyseed-backend와 같은 dist/main.js를 다른 포트+LIVE env로 기동
      // ⚠️ 절대 instances>1 / cluster 금지 — cron이 인스턴스마다 발화해 실주문이 중복된다.
      // ⚠️ 이 맥미니가 곧 실거래 서버다(별도 원격 서버 없음) — deploy-backend.yml이 백엔드 푸시마다
      //    `pm2 startOrRestart ecosystem.config.js --only laofus-backend --env production`으로 재기동하므로
      //    여기 LAOFUS_LIVE/SCHEDULER, VR_LIVE/SCHEDULER가 실제 운영값이다. false로 두면 배포 때마다 라이브가 꺼진다
      //    (2026-07-23~24 실제 발생 — 배포 때마다 조용히 꺼져서 며칠간 매매 스킵됨). .env.production은 안전
      //    기본값(false) 유지 — holyseed-backend(조회 전용, 8000)는 이 값을 그대로 물려받아야 하기 때문.
      // ⚠️ VR도 laofus와 같은 토스 계좌/API 앱을 쓰므로 반드시 이 프로세스 안에서 함께 돈다 (토큰 경합 방지).
      name: 'laofus-backend',
      script: 'dist/main.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '500M',
      min_uptime: '10s',
      max_restarts: 20,
      env_production: {
        NODE_ENV: 'production',
        PORT: 8001,
        // ⚠️ 실거래 상태(계좌와 대조되는 원장)가 걸려 있어 DB_DATABASE를 고정한다 — .env.production이
        // 다른 이유로 바뀌어도(2026-07-25 로컬 .env/.env.local이 holyseed_dev로 바뀌어 며칠 지난
        // 스냅샷 DB로 뜰 뻔한 사고 발생) 이 라이브 트레이딩 프로세스는 영향받지 않도록.
        DB_DATABASE: 'holyseed',
        CORS_ORIGINS: 'https://holyseed.p-e.kr,https://ad.holyseed.p-e.kr,https://wedding.holyseed.p-e.kr,https://lab.holyseed.p-e.kr',
        LAOFUS_LIVE: 'true',
        LAOFUS_SCHEDULER: 'true',
        LAOFUS_RUN_CRON_1: '25 3 * * 2-6',
        LAOFUS_RUN_CRON_2: '25 4 * * 2-6',
        LAOFUS_WINDOW_MIN: '90',
        LAOFUS_WINDOW_MAX: '105',
        VR_LIVE: 'false',
        VR_SCHEDULER: 'false', // 2026-07-29 사용자 요청으로 임시 중단
        VR_RUN_CRON: '*/5 * * * *',
        VR_EXTENDED_LIMIT_BUFFER_PCT: '0.3',
      },
      error_file: '/Users/jangseong-u/production/logs/laofus-error.log',
      out_file: '/Users/jangseong-u/production/logs/laofus-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
