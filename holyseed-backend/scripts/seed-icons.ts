import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// .env 파일 로드
dotenv.config();

// 데이터베이스 연결 설정
const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password123',
  database: process.env.DB_DATABASE || 'holyseed',
});

interface IconData {
  fill: string[];
  mono: string[];
}

enum IconType {
  FILL = 'FILL',
  MONO = 'MONO',
}

async function seedIcons() {
  console.log('🚀 아이콘 데이터 시딩 시작...\n');

  try {
    // 데이터베이스 연결
    await AppDataSource.initialize();
    console.log('✅ 데이터베이스 연결 성공\n');

    // icon.json 파일 읽기
    const iconJsonPath = path.join(__dirname, '../data/icon.json');
    const iconData: IconData = JSON.parse(fs.readFileSync(iconJsonPath, 'utf-8'));

    console.log(`📊 icon.json 데이터:`);
    console.log(`  - fill: ${iconData.fill.length}개`);
    console.log(`  - mono: ${iconData.mono.length}개\n`);

    // 기존 아이콘 데이터 조회 (name만 체크, name은 unique)
    const existingIcons = await AppDataSource.query('SELECT name FROM icons');

    const existingIconSet = new Set<string>();
    existingIcons.forEach((icon: { name: string }) => {
      existingIconSet.add(icon.name);
    });

    console.log(`📦 기존 데이터베이스 아이콘: ${existingIcons.length}개\n`);

    // JSON 파일 내 중복 제거 및 추가할 아이콘 준비
    const iconsToInsert: Array<{ name: string; type: IconType }> = [];
    const processedNames = new Set<string>();

    // FILL 타입 아이콘 처리
    iconData.fill.forEach((iconName) => {
      // JSON 내 중복 및 DB 중복 체크
      if (!processedNames.has(iconName) && !existingIconSet.has(iconName)) {
        iconsToInsert.push({ name: iconName, type: IconType.FILL });
        processedNames.add(iconName);
      }
    });

    // MONO 타입 아이콘 처리
    iconData.mono.forEach((iconName) => {
      // JSON 내 중복 및 DB 중복 체크
      if (!processedNames.has(iconName) && !existingIconSet.has(iconName)) {
        iconsToInsert.push({ name: iconName, type: IconType.MONO });
        processedNames.add(iconName);
      }
    });

    console.log(`📝 추가할 아이콘: ${iconsToInsert.length}개`);
    console.log(`⏭️  중복 건너뜀: ${iconData.fill.length + iconData.mono.length - iconsToInsert.length}개\n`);

    if (iconsToInsert.length === 0) {
      console.log('✨ 추가할 새로운 아이콘이 없습니다.');
      await AppDataSource.destroy();
      return;
    }

    // 배치 삽입 (한 번에 100개씩)
    const batchSize = 100;
    let insertedCount = 0;

    for (let i = 0; i < iconsToInsert.length; i += batchSize) {
      const batch = iconsToInsert.slice(i, i + batchSize);
      const values = batch
        .map((icon) => `('${icon.name.replace(/'/g, "''")}', '${icon.type}', NOW(), NOW())`)
        .join(', ');

      await AppDataSource.query(`INSERT INTO icons (name, type, "createdAt", "updatedAt") VALUES ${values}`);

      insertedCount += batch.length;
      console.log(`  ✓ ${insertedCount}/${iconsToInsert.length} 삽입 완료...`);
    }

    console.log('\n✅ 아이콘 데이터 시딩 완료!');
    console.log(`\n📊 최종 결과:`);

    // 최종 통계
    const finalStats = await AppDataSource.query(
      'SELECT type, COUNT(*) as count FROM icons GROUP BY type ORDER BY type',
    );

    finalStats.forEach((stat: { type: string; count: string }) => {
      console.log(`  - ${stat.type}: ${stat.count}개`);
    });

    const totalCount = await AppDataSource.query('SELECT COUNT(*) as total FROM icons');
    console.log(`  - 전체: ${totalCount[0].total}개`);

    // 연결 종료
    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ 에러 발생:', error);
    await AppDataSource.destroy();
    process.exit(1);
  }
}

// 스크립트 실행
seedIcons();
