import 'dotenv/config';
import { DataSource } from 'typeorm';
import { extractModelName } from './crawler/utils/model-name-extractor';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password123',
  database: process.env.DB_DATABASE || 'living_craft_dev',
  synchronize: false,
  logging: false,
});

async function updateModelNames() {
  console.log('🔄 모델명 업데이트 시작...\n');

  await dataSource.initialize();
  console.log('✅ DB 연결 완료\n');

  try {
    // product_listings 테이블에서 모든 제품 조회 (새 로직으로 전체 재처리)
    const products = await dataSource.query(`
      SELECT id, "productName", "extractedModelName"
      FROM zc.product_listings
      ORDER BY "createdAt" DESC
    `);

    console.log(`📦 총 ${products.length}개 제품 발견 (전체 재처리)\n`);

    let updatedCount = 0;
    let clearedCount = 0;
    let unchangedCount = 0;

    for (const product of products) {
      const newModelName = extractModelName(product.productName);
      const oldModelName = product.extractedModelName;

      // 변경 없으면 스킵
      if (newModelName === oldModelName) {
        unchangedCount++;
        continue;
      }

      // 모델명 업데이트 (null로 변경될 수도 있음)
      await dataSource.query(
        `UPDATE zc.product_listings
         SET "extractedModelName" = $1, "updatedAt" = NOW()
         WHERE id = $2`,
        [newModelName || null, product.id]
      );

      if (newModelName) {
        console.log(`✓ ${product.productName}`);
        console.log(`  Before: ${oldModelName || '(null)'} → After: ${newModelName}\n`);
        updatedCount++;
      } else {
        console.log(`⊘ ${product.productName}`);
        console.log(`  Before: ${oldModelName} → After: (null) - 색상/옵션으로 판단\n`);
        clearedCount++;
      }
    }

    console.log(`\n📊 완료:`);
    console.log(`  - 모델명 추출/변경: ${updatedCount}개`);
    console.log(`  - 모델명 제거(색상/옵션): ${clearedCount}개`);
    console.log(`  - 변경 없음: ${unchangedCount}개`);
  } catch (error) {
    console.error('❌ 오류:', error);
  } finally {
    await dataSource.destroy();
    console.log('\n✅ DB 연결 종료');
  }
}

updateModelNames();
