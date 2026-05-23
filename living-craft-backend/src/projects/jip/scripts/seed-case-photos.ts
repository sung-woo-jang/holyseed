/**
 * 시공사례(Cases) 실사진 초기 업로드 스크립트
 *
 * 사용법:
 *   npx ts-node -r tsconfig-paths/register src/projects/jip/scripts/seed-case-photos.ts
 *   npx ts-node -r tsconfig-paths/register src/projects/jip/scripts/seed-case-photos.ts --dry-run
 *
 * 백엔드 서버(localhost:8000)가 실행 중이어야 합니다.
 */

import 'reflect-metadata';
import * as fs from 'fs';
import * as path from 'path';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const FormData = require('form-data');
import axios from 'axios';

import { Case } from '../modules/cases/entities/case.entity';
import { CaseTag } from '../modules/cases/entities/case-tag.entity';
import { CasePhoto } from '../modules/cases/entities/case-photo.entity';
import { Category } from '../modules/catalog/entities/category.entity';
import { ServiceItem } from '../modules/catalog/entities/service-item.entity';
import { ProductGroup } from '../modules/catalog/entities/product-group.entity';
import { Product } from '../modules/catalog/entities/product.entity';
import { ProductFeature } from '../modules/catalog/entities/product-feature.entity';
import { ProductColor } from '../modules/catalog/entities/product-color.entity';
import { Job } from '../modules/jobs/entities/job.entity';
import { JobPhoto } from '../modules/jobs/entities/job-photo.entity';
import { TechSchedule } from '../modules/schedule/entities/tech-schedule.entity';
import { JipUser } from '../modules/auth/entities/jip-user.entity';
import { QuoteRequest } from '../modules/requests/entities/quote-request.entity';
import { QuoteRequestItem } from '../modules/requests/entities/quote-request-item.entity';
import { QuoteRequestPhoto } from '../modules/requests/entities/quote-request-photo.entity';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const BASE_URL = 'http://localhost:8000/api';
const PHOTO_DIR = path.resolve(__dirname, '../../../../../docs/집슐랭/임시용사진/집수리');
const DRY_RUN = process.argv.includes('--dry-run');

// caseId → 사진 파일 상대 경로 (PHOTO_DIR 기준)
const CASE_PHOTO_MAP: Record<number, string> = {
  1: '싱크대/20260514_기존싱크볼 교체/20260514_181316.jpg',
  2: '욕실/20260413_143002.jpg',
  3: '욕실/20260421_081952.jpg',
  5: '싱크대/1_싱크대문짝떨어진거수리업체 경첩 교체설치업체/KakaoTalk_Photo_2026-05-20-15-28-27 009.jpeg',
  6: '욕실/20260421_121342.jpg',
  7: '연마_광택/20260504/20260504_092712.jpg',
  8: '욕실/20260423_180936.jpg',
};

const ds = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password123',
  database: process.env.DB_DATABASE || 'living_craft',
  synchronize: false,
  logging: false,
  entities: [
    Category, ServiceItem, ProductGroup, Product, ProductFeature, ProductColor,
    Case, CaseTag, CasePhoto,
    Job, JobPhoto,
    TechSchedule,
    JipUser,
    QuoteRequest, QuoteRequestItem, QuoteRequestPhoto,
  ],
});

async function getToken(): Promise<string> {
  const res = await axios.post(`${BASE_URL}/jip/auth/login`, {
    username: 'admin',
    password: 'changeme123',
  });
  return res.data.data?.accessToken ?? res.data.data?.token ?? res.data.token;
}

async function uploadCasePhoto(filePath: string, token: string): Promise<string> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const form = new FormData();
      form.append('file', fs.createReadStream(filePath));

      const res = await axios.post(`${BASE_URL}/jip/uploads/case-photo`, form, {
        headers: { ...form.getHeaders(), Authorization: `Bearer ${token}` },
        timeout: 60000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });
      return res.data.data.url;
    } catch (e) {
      if (attempt < 3) {
        console.log(`         재시도 중... (${attempt}/3)`);
        await new Promise((r) => setTimeout(r, 3000 * attempt));
      } else {
        throw e;
      }
    }
  }
  throw new Error('업로드 실패');
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function run() {
  console.log(DRY_RUN ? '[DRY RUN] 실제 업로드 없이 매핑 확인만 합니다.\n' : '[UPLOAD] 실제 업로드를 시작합니다.\n');

  let token = '';
  let photoRepo: ReturnType<typeof ds.getRepository<CasePhoto>> | null = null;

  if (!DRY_RUN) {
    console.log('  로그인 중...');
    token = await getToken();
    console.log('  로그인 완료');

    console.log('  DB 연결 중...');
    await ds.initialize();
    photoRepo = ds.getRepository(CasePhoto);
    console.log('  DB 연결 완료\n');
  }

  let ok = 0;
  let skip = 0;
  let fail = 0;

  for (const [caseIdStr, relPath] of Object.entries(CASE_PHOTO_MAP)) {
    const caseId = Number(caseIdStr);
    const absPath = path.join(PHOTO_DIR, relPath);
    const exists = fs.existsSync(absPath);

    if (!exists) {
      console.log(`  SKIP  case#${caseId}  ← 파일 없음: ${relPath}`);
      skip++;
      continue;
    }

    const size = (fs.statSync(absPath).size / 1024 / 1024).toFixed(1);
    console.log(`  ${DRY_RUN ? 'FOUND' : 'UPLOAD'} case#${caseId}  (${size}MB)  ← ${relPath}`);

    if (!DRY_RUN) {
      try {
        const url = await uploadCasePhoto(absPath, token);
        console.log(`         → ${url}`);

        // 기존 cover 사진이 없을 때만 삽입
        const existing = await photoRepo!.findOne({ where: { caseId, role: 'cover' } });
        if (existing) {
          console.log(`         ⏭️  이미 cover 사진 있음 (id: ${existing.id})`);
        } else {
          const photo = photoRepo!.create({ caseId, fileUrl: url, role: 'cover', label: null, sortOrder: 0 });
          await photoRepo!.save(photo);
          console.log(`         ✅ case_photos 레코드 생성 완료`);
        }
        ok++;
        await sleep(2000);
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

  if (!DRY_RUN && ds.isInitialized) {
    await ds.destroy();
  }

  console.log('\n---');
  console.log(`완료: ${ok}개  스킵: ${skip}개  실패: ${fail}개`);
  if (DRY_RUN) console.log('(dry-run 모드 — 실제 업로드 없었음)');
}

run().catch((e) => {
  console.error('스크립트 오류:', e);
  process.exit(1);
});
