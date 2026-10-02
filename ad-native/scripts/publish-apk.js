#!/usr/bin/env node
/**
 * ad-native 설치 파일(APK) 배포 스크립트 — OTA로 못 고치는 네이티브 변경(새 네이티브 모듈·권한·app.json 네이티브 설정)용.
 * 빌드한 APK를 백엔드가 정적 서빙하는 업데이트 저장소(`<updatesDir>/apk/`)에 복사하고 latest.json을 갱신한다.
 * 앱은 실행/복귀 시 latest.json의 versionCode가 자기보다 높으면 "받아서 설치" 창을 띄운다(src/lib/apk-update).
 *
 * 사용법: node scripts/publish-apk.js [--notes "변경 요약"] [--apk <경로>]
 *   (APK 기본 경로: android/app/build/outputs/apk/release/app-release.apk)
 */
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

const apkSrc = path.resolve(opt('--apk') || path.join(ROOT, 'android/app/build/outputs/apk/release/app-release.apk'));
const notes = opt('--notes');
const updatesDir = process.env.AD_NATIVE_UPDATES_DIR || path.join(os.homedir(), 'ad-native-updates');

const appJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'app.json'), 'utf-8'));
const versionName = appJson.expo.version;
const versionCode = appJson.expo.android?.versionCode;
if (!versionName || !Number.isInteger(versionCode)) {
  console.error('app.json의 expo.version / expo.android.versionCode(정수)가 필요해요.');
  process.exit(1);
}
if (!fs.existsSync(apkSrc)) {
  console.error(`APK가 없어요: ${apkSrc}\n먼저 빌드하세요: npx expo prebuild -p android --clean && cd android && ./gradlew assembleRelease`);
  process.exit(1);
}

// 오래된 APK를 올리는 실수 방지 — 가능하면 aapt로 APK 안의 versionCode를 app.json과 대조
try {
  const sdk = process.env.ANDROID_HOME || path.join(os.homedir(), 'Library/Android/sdk');
  const bt = path.join(sdk, 'build-tools');
  const latest = fs.readdirSync(bt).sort().pop();
  const out = execFileSync(path.join(bt, latest, 'aapt'), ['dump', 'badging', apkSrc], { encoding: 'utf-8' });
  const m = out.match(/versionCode='(\d+)' versionName='([^']*)'/);
  if (m && (Number(m[1]) !== versionCode || m[2] !== versionName)) {
    console.error(`APK(${m[2]}/${m[1]})와 app.json(${versionName}/${versionCode})의 버전이 달라요. 다시 빌드하세요.`);
    process.exit(1);
  }
} catch {
  console.warn('⚠️ aapt로 APK 버전을 확인하지 못했어요 — app.json과 같은 빌드인지 직접 확인하세요.');
}

const apkDir = path.join(updatesDir, 'apk');
fs.mkdirSync(apkDir, { recursive: true });
const fileName = `adnative-${versionCode}.apk`;
const dest = path.join(apkDir, fileName);
fs.copyFileSync(apkSrc, dest);

const buf = fs.readFileSync(dest);
const manifest = {
  versionCode,
  versionName,
  path: fileName,
  size: buf.length,
  sha256: crypto.createHash('sha256').update(buf).digest('hex'),
  notes: notes || undefined,
  createdAt: new Date().toISOString(),
};
const manifestPath = path.join(apkDir, 'latest.json');
fs.writeFileSync(`${manifestPath}.tmp`, JSON.stringify(manifest, null, 2));
fs.renameSync(`${manifestPath}.tmp`, manifestPath);

// 최신 2개만 남기고 정리
const apks = fs
  .readdirSync(apkDir)
  .map((f) => ({ f, code: Number((f.match(/^adnative-(\d+)\.apk$/) || [])[1]) }))
  .filter((x) => x.code)
  .sort((a, b) => b.code - a.code);
for (const old of apks.slice(2)) fs.unlinkSync(path.join(apkDir, old.f));

console.log(`✅ APK 배포 완료\n   version: ${versionName} (code ${versionCode})\n   size: ${(buf.length / 1024 / 1024).toFixed(1)}MB\n   저장 위치: ${dest}\n   manifest: ${manifestPath}`);
