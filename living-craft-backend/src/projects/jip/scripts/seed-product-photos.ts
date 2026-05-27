/**
 * 제품(Product) 사진 업로드 스크립트 — 제품당 여러 장 (1:N)
 *
 * 사용법:
 *   npx ts-node -r tsconfig-paths/register src/projects/jip/scripts/seed-product-photos.ts
 *   npx ts-node -r tsconfig-paths/register src/projects/jip/scripts/seed-product-photos.ts --dry-run
 */

import * as fs from 'fs';
import * as path from 'path';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const FormData = require('form-data');
import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api';
const PHOTO_DIR = path.resolve(__dirname, '../../../../../docs/집슐랭/임시용사진/집수리');
const DRY_RUN = process.argv.includes('--dry-run');

type Role = 'main' | 'detail' | 'example' | 'color';
interface PhotoEntry { relPath: string; role: Role; label?: string }

const PRODUCT_PHOTO_MAP: Record<string, PhotoEntry[]> = {
  // ── 주방 상판 교체 (k1-*) ──────────────────────────────────────────────────
  'k1-1': [
    { relPath: '싱크대/20260514_사각싱크볼 교체_인테리어공사현장/20260514_111205.jpg', role: 'main', label: '시공 현장' },
    { relPath: '싱크대/20260514_사각싱크볼 교체_인테리어공사현장/20260514_115135.jpg', role: 'detail', label: '마감 디테일' },
    { relPath: '싱크대/20260514_기존싱크볼 교체/20260514_165632.jpg', role: 'example', label: '완성 모습' },
  ],
  'k1-2': [
    { relPath: '싱크대/20260514_기존싱크볼 교체/20260514_163946.jpg', role: 'main', label: '시공 현장' },
    { relPath: '싱크대/20260514_기존싱크볼 교체/20260514_163958.jpg', role: 'detail', label: '상판 디테일' },
    { relPath: '싱크대/20260514_기존싱크볼 교체/20260514_171053.jpg', role: 'example', label: '완성 모습' },
  ],
  'k1-3': [
    { relPath: '싱크대/20260514_사각싱크볼 교체_인테리어공사현장/20260514_121915.jpg', role: 'main', label: '시공 현장' },
    { relPath: '싱크대/20260514_사각싱크볼 교체_인테리어공사현장/20260514_121925.jpg', role: 'detail', label: '마감 디테일' },
  ],

  // ── 싱크볼 교체 (k3-*) ───────────────────────────────────────────────────
  'k3-1': [
    { relPath: '싱크대/20260514_기존싱크볼 교체/20260514_171043.jpg', role: 'main', label: '교체 완료' },
    { relPath: '싱크대/20260514_기존싱크볼 교체/20260514_181254.jpg', role: 'detail', label: '싱크볼 디테일' },
    { relPath: '싱크대/20260514_기존싱크볼 교체/20260514_181316.jpg', role: 'example', label: '주방 전체' },
  ],
  'k3-2': [
    { relPath: '싱크대/20260514_기존싱크볼 교체/20260514_181303.jpg', role: 'main', label: '교체 완료' },
    { relPath: '싱크대/20260514_기존싱크볼 교체/20260514_171053.jpg', role: 'detail', label: '싱크볼 디테일' },
  ],
  'k3-3': [
    { relPath: '싱크대/20260514_기존싱크볼 교체/20260514_165635.jpg', role: 'main', label: '언더마운트 완성' },
    { relPath: '싱크대/20260514_기존싱크볼 교체/20260514_165638.jpg', role: 'detail', label: '테두리 마감' },
  ],

  // ── 주방 수전 교체 (k4-*) ────────────────────────────────────────────────
  'k4-1': [
    { relPath: '싱크대/260424_학원_싱크대_전기온수기/20260424_150254.jpg', role: 'main', label: '수전 설치 완료' },
    { relPath: '싱크대/260424_학원_싱크대_전기온수기/20260424_150258.jpg', role: 'detail', label: '수전 디테일' },
    { relPath: '싱크대/260424_학원_싱크대_전기온수기/20260424_153248.jpg', role: 'example', label: '주방 전체' },
  ],
  'k4-2': [
    { relPath: '싱크대/260424_학원_싱크대_전기온수기/20260424_150324.jpg', role: 'main', label: '수전 설치 완료' },
    { relPath: '싱크대/260424_학원_싱크대_전기온수기/20260424_153252.jpg', role: 'detail', label: '수전 디테일' },
  ],
  'k4-3': [
    { relPath: '싱크대/260424_학원_싱크대_전기온수기/20260424_150326.jpg', role: 'main', label: '수전 설치 완료' },
    { relPath: '싱크대/260424_학원_싱크대_전기온수기/20260424_153255.jpg', role: 'detail', label: '수전 디테일' },
  ],
  'k4-4': [
    { relPath: '싱크대/260424_학원_싱크대_전기온수기/20260424_150327.jpg', role: 'main', label: '수전 설치 완료' },
    { relPath: '싱크대/260424_학원_싱크대_전기온수기/20260424_150328.jpg', role: 'detail', label: '수전 디테일' },
  ],
  'k4-5': [
    { relPath: '싱크대/20260514_사각싱크볼 교체_인테리어공사현장/20260514_111205.jpg', role: 'main', label: '수전 설치 완료' },
    { relPath: '싱크대/20260514_사각싱크볼 교체_인테리어공사현장/20260514_115008.jpg', role: 'detail', label: '수전 디테일' },
  ],
  'k4-6': [
    { relPath: '싱크대/20260514_사각싱크볼 교체_인테리어공사현장/20260514_115135.jpg', role: 'main', label: '프리미엄 수전 완성' },
    { relPath: '싱크대/20260514_사각싱크볼 교체_인테리어공사현장/20260514_121921.jpg', role: 'detail', label: '디테일' },
  ],

  // ── 문짝·경첩 교체 (k5, k6) ──────────────────────────────────────────────
  'k5-1': [  // k5는 ProductGroup에 items가 없지만 혹시 seed-jip에 있다면
    { relPath: '싱크대/2_싱크대상부장수리 업체 씽크대부분보수 하는곳 기울어지고 떨어지는 작업/KakaoTalk_Photo_2026-05-20-15-29-05 001.jpeg', role: 'main', label: '교체 완료' },
  ],

  // ── 화장실 수전 (b1-*) ───────────────────────────────────────────────────
  'b1-1': [
    { relPath: '욕실/20260421_081921.jpg', role: 'main', label: '수전 설치 완료' },
    { relPath: '욕실/20260421_081926.jpg', role: 'detail', label: '수전 디테일' },
    { relPath: '욕실/20260421_082009.jpg', role: 'example', label: '욕실 전체' },
  ],
  'b1-2': [
    { relPath: '욕실/20260421_081935.jpg', role: 'main', label: '무광 수전 완성' },
    { relPath: '욕실/20260421_081945.jpg', role: 'detail', label: '수전 디테일' },
  ],
  'b1-3': [
    { relPath: '욕실/20260421_081952.jpg', role: 'main', label: '겸용 수전 완성' },
    { relPath: '욕실/20260421_082018.jpg', role: 'detail', label: '샤워 연결부' },
  ],

  // ── 세면대 교체 (b2-*) ───────────────────────────────────────────────────
  'b2-1': [
    { relPath: '욕실/20260421_121342.jpg', role: 'main', label: '탑카운터 설치 완료' },
    { relPath: '욕실/20260421_121343.jpg', role: 'detail', label: '세면대 디테일' },
    { relPath: '욕실/20260421_121347.jpg', role: 'example', label: '욕실 전체' },
  ],
  'b2-2': [
    { relPath: '욕실/20260421_121354.jpg', role: 'main', label: '스퀘어 탑 완성' },
    { relPath: '욕실/20260421_121358.jpg', role: 'detail', label: '마감 디테일' },
    { relPath: '욕실/20260421_121400.jpg', role: 'example', label: '욕실 전체' },
  ],
  'b2-3': [
    { relPath: '욕실/20260421_121408.jpg', role: 'main', label: '언더마운트 완성' },
    { relPath: '욕실/20260421_121411.jpg', role: 'detail', label: '테두리 마감' },
  ],

  // ── 변기 교체 (b3-*) ─────────────────────────────────────────────────────
  'b3-1': [
    { relPath: '욕실/20260421_135412.jpg', role: 'main', label: '변기 교체 완료' },
    { relPath: '욕실/20260421_135414.jpg', role: 'detail', label: '변기 디테일' },
    { relPath: '욕실/20260421_135508.jpg', role: 'example', label: '욕실 전체' },
  ],
  'b3-2': [
    { relPath: '욕실/20260421_135510.jpg', role: 'main', label: '일체형 변기 완성' },
    { relPath: '욕실/20260421_135511.jpg', role: 'detail', label: '변기 디테일' },
  ],

  // ── 샤워 슬라이드바 (b6-*) ───────────────────────────────────────────────
  'b6-1': [
    { relPath: '욕실/20260423_180936.jpg', role: 'main', label: '슬라이드바 설치 완료' },
    { relPath: '욕실/20260423_180928.jpg', role: 'detail', label: '설치 디테일' },
  ],
  'b6-2': [
    { relPath: '욕실/20260423_181455.jpg', role: 'main', label: '골드 슬라이드바 완성' },
    { relPath: '욕실/20260423_181502.jpg', role: 'detail', label: '디테일' },
  ],

  // ── 인테리어 필름 — 전용 사진 없음, 인테리어 분위기 임시 매핑 ────────────
  'f1-1': [
    { relPath: '욕실/20260430_143318.jpg', role: 'main', label: '필름 시공 사례' },
    { relPath: '욕실/20260430_143328.jpg', role: 'example', label: '시공 후' },
  ],
  'f1-2': [
    { relPath: '욕실/20260430_171453.jpg', role: 'main', label: '필름 시공 사례' },
    { relPath: '욕실/20260430_171457.jpg', role: 'example', label: '시공 후' },
  ],
  'f1-3': [
    { relPath: '욕실/20260515_160809.jpg', role: 'main', label: '필름 시공 사례' },
    { relPath: '욕실/20260515_160816.jpg', role: 'example', label: '시공 후' },
  ],
  'f1-4': [
    { relPath: '욕실/20260515_160838.jpg', role: 'main', label: '필름 시공 사례' },
    { relPath: '욕실/20260515_160845.jpg', role: 'example', label: '시공 후' },
  ],
};

async function getToken(): Promise<string> {
  const res = await axios.post(`${BASE_URL}/jip/auth/login`, { username: 'admin', password: 'changeme123' });
  return res.data.data?.accessToken ?? res.data.data?.token ?? res.data.token;
}

async function uploadProductPhoto(productCode: string, filePath: string, role: Role, label: string | undefined, token: string): Promise<string> {
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));
  form.append('productCode', productCode);
  form.append('role', role);
  if (label) form.append('label', label);
  const res = await axios.post(`${BASE_URL}/jip/uploads/product-photos`, form, {
    headers: { ...form.getHeaders(), Authorization: `Bearer ${token}` },
    timeout: 30000,
  });
  return res.data.data.url;
}

async function run() {
  console.log(DRY_RUN ? '[DRY RUN]\n' : '[UPLOAD] 제품 사진 업로드 시작\n');

  let token = '';
  if (!DRY_RUN) {
    token = await getToken();
    console.log('  로그인 완료\n');
  }

  let ok = 0, skip = 0, fail = 0;

  for (const [productCode, photos] of Object.entries(PRODUCT_PHOTO_MAP)) {
    for (const { relPath, role, label } of photos) {
      const absPath = path.join(PHOTO_DIR, relPath);
      if (!fs.existsSync(absPath)) {
        console.log(`  SKIP  ${productCode}/${role}  ← 파일 없음: ${relPath}`);
        skip++; continue;
      }
      const size = (fs.statSync(absPath).size / 1024 / 1024).toFixed(1);
      console.log(`  ${DRY_RUN ? 'FOUND' : 'UPLOAD'} ${productCode}/${role}  (${size}MB)  ← ${path.basename(relPath)}`);
      if (!DRY_RUN) {
        try {
          const url = await uploadProductPhoto(productCode, absPath, role, label, token);
          console.log(`         → ${url}`);
          ok++;
          await new Promise((r) => setTimeout(r, 300));
        } catch (e: unknown) {
          const err = e as any;
          const msg = err?.response?.data ? JSON.stringify(err.response.data) : String(e);
          console.error(`         ✗ 실패: ${msg}`);
          fail++;
        }
      } else { ok++; }
    }
  }

  console.log(`\n완료: ${ok}  스킵: ${skip}  실패: ${fail}`);
}

run().catch((e) => { console.error('스크립트 오류:', e); process.exit(1); });
