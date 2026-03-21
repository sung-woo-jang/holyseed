import * as path from 'path';
import { AppDataSource } from './data-source';
import { Icon } from '@modules/icons/entities/icon.entity';
import { parseAllIcons } from './utils/icon-parser';

/**
 * 아이콘 마스터 데이터 생성
 * - 프론트엔드 docs에서 3,245개 아이콘 파싱
 * - FILL (749개), MONO (815개), COLOR (1,681개)
 */
export async function createIcons() {
  console.log('🎨 Starting icons seed...');

  const iconRepository = AppDataSource.getRepository(Icon);

  // 기존 데이터 확인
  const existingCount = await iconRepository.count();
  if (existingCount > 0) {
    console.log(
      `ℹ️  Icons already exist (${existingCount} icons). Skipping...`,
    );
    return;
  }

  // 프론트엔드 docs 경로 (모노레포 구조)
  const frontendDocsPath = path.resolve(
    __dirname,
    '../../../..',
    'living-craft-front/docs',
  );

  console.log(`📂 Parsing icons from: ${frontendDocsPath}`);

  // 아이콘 파싱
  const parsedIcons = parseAllIcons(frontendDocsPath);

  if (parsedIcons.length === 0) {
    console.error('❌ No icons found in frontend docs');
    return;
  }

  // Bulk Insert (500개씩 배치)
  console.log(`\n📦 Inserting ${parsedIcons.length} icons in batches...`);

  let totalInserted = 0;
  const batchSize = 500;

  for (let i = 0; i < parsedIcons.length; i += batchSize) {
    const batch = parsedIcons.slice(i, i + batchSize);

    const icons = batch.map((icon) =>
      iconRepository.create({
        name: icon.name,
        type: icon.type,
      }),
    );

    await iconRepository.save(icons);
    totalInserted += icons.length;

    console.log(
      `   ✓ Batch ${Math.floor(i / batchSize) + 1}: ${icons.length} icons inserted`,
    );
  }

  console.log('\n✅ Icons created successfully!');
  console.log(`   - Total: ${totalInserted}개`);
  console.log(
    `   - FILL: ${parsedIcons.filter((i) => i.type === 'FILL').length}개`,
  );
  console.log(
    `   - MONO: ${parsedIcons.filter((i) => i.type === 'MONO').length}개`,
  );
  console.log(
    `   - COLOR: ${parsedIcons.filter((i) => i.type === 'COLOR').length}개\n`,
  );
}
