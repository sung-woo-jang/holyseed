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
        CORS_ORIGINS: 'https://holyseed.p-e.kr',
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
      // laofus 실주문 엔진 — holyseed-backend와 같은 dist/main.js를 다른 포트+LIVE env로 기동
      // ⚠️ 절대 instances>1 / cluster 금지 — cron이 인스턴스마다 발화해 실주문이 중복된다.
      // ⚠️ LAOFUS_LIVE/SCHEDULER는 여기(pm2 env)에서만 켠다 — .env.production은 안전 기본값(false) 유지.
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
        CORS_ORIGINS: 'https://holyseed.p-e.kr',
        LAOFUS_LIVE: 'false',
        LAOFUS_SCHEDULER: 'false',
        LAOFUS_RUN_CRON_1: '25 3 * * 2-6',
        LAOFUS_RUN_CRON_2: '25 4 * * 2-6',
        LAOFUS_WINDOW_MIN: '90',
        LAOFUS_WINDOW_MAX: '105',
      },
      error_file: '/Users/jangseong-u/production/logs/laofus-error.log',
      out_file: '/Users/jangseong-u/production/logs/laofus-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
