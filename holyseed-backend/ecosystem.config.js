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
  ],
};
