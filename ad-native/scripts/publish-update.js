#!/usr/bin/env node
/**
 * ad-native OTA 업데이트 퍼블리시 스크립트.
 * `npx expo export`로 뽑은 JS 번들·에셋을 백엔드가 서빙하는 업데이트 저장소(홈 디렉토리 밖 절대경로,
 * holyseed-backend/src/config/app.config.ts의 `adNativeUpdatesDir`와 동일 기본값)에 복사하고
 * index.json에 새 항목을 맨 앞에 추가한다. 수동 실행 전용 — CI에서 자동 호출하지 않는다.
 *
 * 사용법: node scripts/publish-update.js [android|ios]
 */
const { execFileSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const platform = process.argv[2] || 'android';
if (!['android', 'ios'].includes(platform)) {
  console.error(`알 수 없는 플랫폼: ${platform} (android|ios만 지원)`);
  process.exit(1);
}

const updatesDir = process.env.AD_NATIVE_UPDATES_DIR || path.join(os.homedir(), 'ad-native-updates');
const appJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'app.json'), 'utf-8'));
const runtimeVersion = appJson.expo.version;
if (!runtimeVersion) {
  console.error('app.json의 expo.version이 없어요 — runtimeVersion(policy: appVersion) 계산 불가.');
  process.exit(1);
}

const EXT_TO_MIME = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  ttf: 'font/ttf',
  otf: 'font/otf',
  woff: 'font/woff',
  woff2: 'font/woff2',
  json: 'application/json',
  mp4: 'video/mp4',
};

function hashFile(absPath) {
  const buf = fs.readFileSync(absPath);
  return crypto.createHash('sha256').update(buf).digest('base64url');
}

function main() {
  const exportDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-native-export-'));
  console.log(`▸ expo export -p ${platform} (${exportDir})`);
  execFileSync('npx', ['expo', 'export', '-p', platform, '--output-dir', exportDir], {
    cwd: ROOT,
    stdio: 'inherit',
  });

  const metadata = JSON.parse(fs.readFileSync(path.join(exportDir, 'metadata.json'), 'utf-8'));
  const platformMeta = metadata.fileMetadata[platform];
  if (!platformMeta) {
    console.error(`metadata.json에 ${platform} 번들 정보가 없어요.`);
    process.exit(1);
  }

  const updateId = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const destDir = path.join(updatesDir, platform, runtimeVersion, updateId);
  fs.mkdirSync(destDir, { recursive: true });

  function publishFile(relPath, ext) {
    const srcAbs = path.join(exportDir, relPath);
    const destAbs = path.join(destDir, relPath);
    fs.mkdirSync(path.dirname(destAbs), { recursive: true });
    fs.copyFileSync(srcAbs, destAbs);
    const hash = hashFile(srcAbs);
    return {
      hash,
      key: hash,
      contentType: ext ? (EXT_TO_MIME[ext] || 'application/octet-stream') : 'application/javascript',
      path: path.posix.join(platform, runtimeVersion, updateId, relPath.split(path.sep).join('/')),
    };
  }

  const launchAsset = publishFile(platformMeta.bundle, null);
  // metadata.json의 assets 배열엔 같은 파일이 여러 번(동일 리소스가 여러 컴포넌트에서 참조될 때) 중복 등장함 —
  // 매니페스트에 중복 키로 나가면 클라이언트가 같은 로컬 캐시 경로에 동시에 쓰다 충돌해 fetchUpdateAsync가
  // "Failed to download new update"로 실패할 수 있어 해시 기준으로 dedupe
  const seenHashes = new Set();
  const assets = platformMeta.assets
    .map((a) => publishFile(a.path, a.ext))
    .filter((a) => {
      if (seenHashes.has(a.hash)) return false;
      seenHashes.add(a.hash);
      return true;
    });

  const indexPath = path.join(updatesDir, 'index.json');
  const index = fs.existsSync(indexPath) ? JSON.parse(fs.readFileSync(indexPath, 'utf-8')) : {};
  index[platform] ??= {};
  index[platform][runtimeVersion] ??= [];
  index[platform][runtimeVersion].unshift({ id: updateId, createdAt, launchAsset, assets });
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));

  fs.rmSync(exportDir, { recursive: true, force: true });

  console.log(`\n✅ 배포 완료`);
  console.log(`   platform: ${platform}`);
  console.log(`   runtimeVersion: ${runtimeVersion}`);
  console.log(`   updateId: ${updateId}`);
  console.log(`   저장 위치: ${destDir}`);
  console.log(`   index.json: ${indexPath}`);
}

main();
