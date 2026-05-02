/**
 * 1회성 백필 스크립트 — v2 가격 필드 마이그레이션
 *
 * 실행 방법:
 *   npx ts-node -r tsconfig-paths/register src/projects/zc/scripts/migrations/backfill-v2-pricing.ts
 *
 * 변경 내용:
 *   1. product_models.materialCost = costPrice (기존 원가를 자재가로 복사)
 *   2. product_listings.isManual = false (기존 row는 모두 크롤링 데이터)
 *   3. quote_items.materialPrice = unitPrice, laborPrice = 0 (기존 항목은 자재가로 간주)
 */

import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

async function run() {
  const ds = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password123',
    database: process.env.DB_DATABASE || 'living_craft_dev',
    synchronize: false,
  });

  await ds.initialize();
  console.log('DB 연결 완료');

  try {
    // 1. product_models: costPrice → materialCost
    const r1 = await ds.query(`
      UPDATE zc.product_models
         SET "materialCost" = "costPrice"
       WHERE "materialCost" IS NULL AND "costPrice" IS NOT NULL
    `);
    console.log('product_models 백필 완료:', r1);

    // 2. product_listings: isManual = false (기존 row)
    const r2 = await ds.query(`
      UPDATE zc.product_listings
         SET "isManual" = false
       WHERE "isManual" IS NULL
    `);
    console.log('product_listings isManual 백필 완료:', r2);

    // 3. quote_items: unitPrice → materialPrice (기존 단가는 자재가로)
    const r3 = await ds.query(`
      UPDATE zc.quote_items
         SET "materialPrice" = "unitPrice",
             "laborPrice"    = 0
       WHERE "materialPrice" IS NULL
    `);
    console.log('quote_items 백필 완료:', r3);

    // 검증
    const [{ cnt: nullMaterial }] = await ds.query(
      `SELECT count(*) as cnt FROM zc.product_models WHERE "materialCost" IS NULL AND "costPrice" IS NOT NULL`,
    );
    const [{ cnt: nullManual }] = await ds.query(
      `SELECT count(*) as cnt FROM zc.product_listings WHERE "isManual" IS NULL`,
    );
    const [{ cnt: nullItemPrice }] = await ds.query(
      `SELECT count(*) as cnt FROM zc.quote_items WHERE "materialPrice" IS NULL`,
    );

    console.log('\n--- 검증 결과 ---');
    console.log('백필 누락 product_models:', nullMaterial, '(0이어야 함)');
    console.log('백필 누락 product_listings:', nullManual, '(0이어야 함)');
    console.log('백필 누락 quote_items:', nullItemPrice, '(0이어야 함)');

    if (Number(nullMaterial) === 0 && Number(nullManual) === 0 && Number(nullItemPrice) === 0) {
      console.log('\n✅ 백필 완료');
    } else {
      console.warn('\n⚠️  일부 백필 누락. 위 결과 확인 필요');
    }
  } finally {
    await ds.destroy();
  }
}

run().catch(console.error);
