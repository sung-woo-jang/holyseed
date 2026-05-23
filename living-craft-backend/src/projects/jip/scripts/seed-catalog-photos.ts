/**
 * 카탈로그 서비스 아이템 사진 초기 업로드 스크립트
 *
 * 사용법:
 *   npx ts-node -r tsconfig-paths/register src/projects/jip/scripts/seed-catalog-photos.ts
 *   npx ts-node -r tsconfig-paths/register src/projects/jip/scripts/seed-catalog-photos.ts --dry-run
 *
 * 백엔드 서버(localhost:8000)가 실행 중이어야 합니다.
 */

import * as fs from 'fs';
import * as path from 'path';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const FormData = require('form-data');
import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api';
const PHOTO_DIR = path.resolve(__dirname, '../../../../../docs/집슐랭/임시용사진/집수리');
const DRY_RUN = process.argv.includes('--dry-run');

// itemCode → 사진 파일 상대 경로 (PHOTO_DIR 기준)
const ITEM_PHOTO_MAP: Record<string, string> = {
  b1: '욕실/20260413_143002.jpg',
  b2: '욕실/20260421_081952.jpg',
  b3: '욕실/20260421_121342.jpg',
  b4: '욕실/20260421_135412.jpg',
  b5: '욕실/20260423_180936.jpg',
  b6: '욕실/20260430_123133.jpg',
  b7: '욕실/20260512_111513.jpg',
  k1: '싱크대/20260514_사각싱크볼 교체_인테리어공사현장/20260514_131023.jpg',
  k2: '연마_광택/20260504/20260504_092712.jpg',
  k3: '싱크대/20260514_기존싱크볼 교체/20260514_181316.jpg',
  k4: '싱크대/260424_학원_싱크대_전기온수기/20260427_144852.jpg',
  k5: '싱크대/2_싱크대상부장수리 업체 씽크대부분보수 하는곳 기울어지고 떨어지는 작업/KakaoTalk_Photo_2026-05-20-15-29-08 017.jpeg',
  k6: '싱크대/1_싱크대문짝떨어진거수리업체 경첩 교체설치업체/KakaoTalk_Photo_2026-05-20-15-28-27 009.jpeg',
  fl1: '연마_광택/20260504/20260504_170749.jpg',
  fl2: '연마_광택/20260509/20260509_125831.jpg',
  fl3: '연마_광택/20260509/20260509_125819.jpg',
  // f1, f2, f3: 필름 시공 — 사진 없음, emoji fallback 유지
};

async function getToken(): Promise<string> {
  const res = await axios.post(`${BASE_URL}/jip/auth/login`, {
    username: 'admin',
    password: 'changeme123',
  });
  return res.data.data?.accessToken ?? res.data.data?.token ?? res.data.token;
}

async function uploadItemPhoto(itemCode: string, filePath: string, token: string): Promise<string> {
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));
  form.append('itemCode', itemCode);

  const res = await axios.post(`${BASE_URL}/jip/uploads/catalog-item-photo`, form, {
    headers: { ...form.getHeaders(), Authorization: `Bearer ${token}` },
    timeout: 30000,
  });
  return res.data.data.url;
}

async function run() {
  console.log(DRY_RUN ? '[DRY RUN] 실제 업로드 없이 매핑 확인만 합니다.\n' : '[UPLOAD] 실제 업로드를 시작합니다.\n');

  let token = '';
  if (!DRY_RUN) {
    console.log('  로그인 중...');
    token = await getToken();
    console.log('  로그인 완료\n');
  }

  let ok = 0;
  let skip = 0;
  let fail = 0;

  for (const [itemCode, relPath] of Object.entries(ITEM_PHOTO_MAP)) {
    const absPath = path.join(PHOTO_DIR, relPath);
    const exists = fs.existsSync(absPath);

    if (!exists) {
      console.log(`  SKIP  ${itemCode}  ← 파일 없음: ${relPath}`);
      skip++;
      continue;
    }

    const size = (fs.statSync(absPath).size / 1024 / 1024).toFixed(1);
    console.log(`  ${DRY_RUN ? 'FOUND' : 'UPLOAD'} ${itemCode}  (${size}MB)  ← ${relPath}`);

    if (!DRY_RUN) {
      try {
        const url = await uploadItemPhoto(itemCode, absPath, token);
        console.log(`         → ${url}`);
        ok++;
      } catch (e: unknown) {
        const err = e as any;
        const status = err?.response?.status ?? '';
        const msg = err?.response?.data ? JSON.stringify(err.response.data) : (e instanceof Error ? e.message : String(e));
        console.error(`         ✗ 실패 [${status}]: ${msg}`);
        fail++;
      }
    } else {
      ok++;
    }
  }

  console.log('\n---');
  console.log(`완료: ${ok}개  스킵: ${skip}개  실패: ${fail}개`);
  if (DRY_RUN) console.log('(dry-run 모드 — 실제 업로드 없었음)');
}

run().catch((e) => {
  console.error('스크립트 오류:', e);
  process.exit(1);
});
