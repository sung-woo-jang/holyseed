/**
 * 사이트 에셋 사진 업로드 스크립트 (hero, CTA, About 사진 등)
 *
 * 사용법:
 *   npx ts-node -r tsconfig-paths/register src/projects/jip/scripts/seed-site-assets.ts
 *   npx ts-node -r tsconfig-paths/register src/projects/jip/scripts/seed-site-assets.ts --dry-run
 */

import * as fs from 'fs';
import * as path from 'path';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const FormData = require('form-data');
import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api';
const PHOTO_DIR = path.resolve(__dirname, '../../../../../docs/집슐랭/임시용사진/집수리');
const DRY_RUN = process.argv.includes('--dry-run');

const SITE_ASSET_MAP: Array<{ key: string; relPath: string; caption: string }> = [
  { key: 'home.hero',      relPath: '욕실/20260428_132446.jpg',                                                   caption: '깔끔하게 완성된 욕실' },
  { key: 'home.about_cta', relPath: '싱크대/20260514_기존싱크볼 교체/20260514_165632.jpg',                     caption: '새 싱크대로 주방이 달라졌어요' },
  { key: 'about.intro',    relPath: '욕실/20260430_154511.jpg',                                                   caption: '꼼꼼한 시공' },
  { key: 'about.gallery.1',relPath: '욕실/20260511_090043.jpg',                                                   caption: '화장실 수전 교체' },
  { key: 'about.gallery.2',relPath: '싱크대/20260514_기존싱크볼 교체/20260514_171043.jpg',                        caption: '주방 싱크볼 교체' },
];

async function getToken(): Promise<string> {
  const res = await axios.post(`${BASE_URL}/jip/auth/login`, { username: 'admin', password: 'changeme123' });
  return res.data.data?.accessToken ?? res.data.data?.token ?? res.data.token;
}

async function uploadSiteAsset(key: string, filePath: string, caption: string, token: string): Promise<string> {
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));
  form.append('assetKey', key);
  form.append('caption', caption);
  const res = await axios.post(`${BASE_URL}/jip/uploads/site-asset`, form, {
    headers: { ...form.getHeaders(), Authorization: `Bearer ${token}` },
    timeout: 30000,
  });
  return res.data.data.url;
}

async function run() {
  console.log(DRY_RUN ? '[DRY RUN]\n' : '[UPLOAD] 사이트 에셋 업로드 시작\n');

  let token = '';
  if (!DRY_RUN) {
    token = await getToken();
    console.log('  로그인 완료\n');
  }

  let ok = 0, skip = 0, fail = 0;

  for (const { key, relPath, caption } of SITE_ASSET_MAP) {
    const absPath = path.join(PHOTO_DIR, relPath);
    if (!fs.existsSync(absPath)) {
      console.log(`  SKIP  ${key}  ← 파일 없음: ${relPath}`);
      skip++; continue;
    }
    const size = (fs.statSync(absPath).size / 1024 / 1024).toFixed(1);
    console.log(`  ${DRY_RUN ? 'FOUND' : 'UPLOAD'} ${key}  (${size}MB)`);
    if (!DRY_RUN) {
      try {
        const url = await uploadSiteAsset(key, absPath, caption, token);
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
