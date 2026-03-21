module.exports = {
  apps: [
    {
      name: 'living-craft-backend',
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
        CORS_ORIGINS: 'https://living-craft.p-e.kr',
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
  ],
};
