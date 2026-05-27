/**
 * 카탈로그 카테고리 대표 사진 업로드 스크립트
 *
 * 사용법:
 *   npx ts-node -r tsconfig-paths/register src/projects/jip/scripts/seed-category-photos.ts
 *   npx ts-node -r tsconfig-paths/register src/projects/jip/scripts/seed-category-photos.ts --dry-run
 */

import * as fs from 'fs';
import * as path from 'path';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const FormData = require('form-data');
import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api';
const PHOTO_DIR = path.resolve(__dirname, '../../../../../docs/집슐랭/임시용사진/집수리');
const DRY_RUN = process.argv.includes('--dry-run');

const CATEGORY_PHOTO_MAP: Record<string, string> = {
  kitchen: '싱크대/20260514_사각싱크볼 교체_인테리어공사현장/20260514_121915.jpg',
  bath: '욕실/20260421_081921.jpg',
  film: '욕실/20260430_143318.jpg',
  floor: '연마_광택/20260504/20260504_170158.jpg',
};

async function getToken(): Promise<string> {
  const res = await axios.post(`${BASE_URL}/jip/auth/login`, {
    username: 'admin',
    password: 'changeme123',
  });
  return res.data.data?.accessToken ?? res.data.data?.token ?? res.data.token;
}

async function uploadCategoryPhoto(categoryCode: string, filePath: string, token: string): Promise<string> {
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));
  form.append('categoryCode', categoryCode);
  const res = await axios.post(`${BASE_URL}/jip/uploads/catalog-category-photo`, form, {
    headers: { ...form.getHeaders(), Authorization: `Bearer ${token}` },
    timeout: 30000,
  });
  return res.data.data.url;
}

async function run() {
  console.log(DRY_RUN ? '[DRY RUN]\n' : '[UPLOAD] 카테고리 사진 업로드 시작\n');

  let token = '';
  if (!DRY_RUN) {
    token = await getToken();
    console.log('  로그인 완료\n');
  }

  let ok = 0, skip = 0, fail = 0;

  for (const [categoryCode, relPath] of Object.entries(CATEGORY_PHOTO_MAP)) {
    const absPath = path.join(PHOTO_DIR, relPath);
    if (!fs.existsSync(absPath)) {
      console.log(`  SKIP  ${categoryCode}  ← 파일 없음: ${relPath}`);
      skip++; continue;
    }
    const size = (fs.statSync(absPath).size / 1024 / 1024).toFixed(1);
    console.log(`  ${DRY_RUN ? 'FOUND' : 'UPLOAD'} ${categoryCode}  (${size}MB)  ← ${relPath}`);
    if (!DRY_RUN) {
      try {
        const url = await uploadCategoryPhoto(categoryCode, absPath, token);
        console.log(`         → ${url}`);
        ok++;
      } catch (e: unknown) {
        const err = e as any;
        const msg = err?.response?.data ? JSON.stringify(err.response.data) : String(e);
        console.error(`         ✗ 실패: ${msg}`);
        fail++;
      }
    } else { ok++; }
  }

  console.log(`\n완료: ${ok}  스킵: ${skip}  실패: ${fail}`);
}

run().catch((e) => { console.error('스크립트 오류:', e); process.exit(1); });
