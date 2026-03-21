module.exports = function (options, webpack) {
  return {
    ...options,
    watchOptions: {
      // 감시 대상에서 제외할 폴더/파일 패턴
      ignored: [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/uploads/**',
        '**/.git/**',
        '**/coverage/**',
        '**/.vscode/**',
        '**/.idea/**',
        '**/logs/**',
        '**/tmp/**',
        '**/temp/**',
        '**/data/**',
        '**/.cache/**',
        '**/.DS_Store',
        '**/yarn.lock',
        '**/package-lock.json',
        '**/*.log',
      ],
      // 변경 감지 후 재빌드까지 대기 시간 (ms)
      // 여러 파일이 동시에 변경되면 한 번만 재빌드
      aggregateTimeout: 1000,
      // 폴링 간격 (macOS EMFILE 이슈 해결)
      // 5초마다 폴링하여 불필요한 재빌드 최소화
      poll: 5000,
    },
  };
};
