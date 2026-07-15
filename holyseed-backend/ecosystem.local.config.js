/**
 * 로컬(개발 맥) laofus 상시 가동용 pm2 설정 — 서버용 ecosystem.config.js와 별개.
 *
 * ⚠️ 절대 instances>1 / cluster 금지 — cron이 인스턴스마다 발화해 실주문이 중복된다.
 * ⚠️ LAOFUS_LIVE/SCHEDULER는 여기(pm2 env)에서만 켠다 — .env는 안전 기본값(false) 유지.
 *    (@nestjs/config는 이미 설정된 process.env를 덮어쓰지 않으므로 pm2 env가 우선)
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
        PORT: '8000',
        LAOFUS_LIVE: 'true',
        LAOFUS_SCHEDULER: 'true',
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
    {
      // 대시보드 상시 서빙 — vite preview가 dist/를 :4800에 서빙 (/api → :8000 프록시 내장)
      name: 'laofus-front',
      cwd: `${__dirname}/../laofus-front`,
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
