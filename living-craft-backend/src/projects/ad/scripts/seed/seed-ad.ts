import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { Category, CategoryType } from '../../modules/categories/entities/category.entity';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const CATEGORY_DEFS: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'householdId' | 'isBuiltin'>[] = [
  // 수입
  { type: CategoryType.INCOME, name: '급여', icon: '💼', color: '#34C759', sortOrder: 1 },
  { type: CategoryType.INCOME, name: '사업소득', icon: '🏢', color: '#34C759', sortOrder: 2 },
  { type: CategoryType.INCOME, name: '투자수익', icon: '📈', color: '#34C759', sortOrder: 3 },
  { type: CategoryType.INCOME, name: '부수입', icon: '💰', color: '#34C759', sortOrder: 4 },
  // 지출
  { type: CategoryType.EXPENSE, name: '식비', icon: '🍽️', color: '#FF6D35', sortOrder: 10 },
  { type: CategoryType.EXPENSE, name: '교통비', icon: '🚇', color: '#FF6D35', sortOrder: 11 },
  { type: CategoryType.EXPENSE, name: '주거비', icon: '🏠', color: '#FF6D35', sortOrder: 12 },
  { type: CategoryType.EXPENSE, name: '의료비', icon: '🏥', color: '#FF6D35', sortOrder: 13 },
  { type: CategoryType.EXPENSE, name: '문화/여가', icon: '🎬', color: '#FF6D35', sortOrder: 14 },
  { type: CategoryType.EXPENSE, name: '의류', icon: '👗', color: '#FF6D35', sortOrder: 15 },
  { type: CategoryType.EXPENSE, name: '교육', icon: '📚', color: '#FF6D35', sortOrder: 16 },
  { type: CategoryType.EXPENSE, name: '보험료', icon: '🛡️', color: '#FF6D35', sortOrder: 17 },
  { type: CategoryType.EXPENSE, name: '기타지출', icon: '📦', color: '#FF6D35', sortOrder: 18 },
  // 이체
  { type: CategoryType.TRANSFER, name: '자산 이동', icon: '🔄', color: '#3182F6', sortOrder: 20 },
];

async function seed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password123',
    database: process.env.DB_DATABASE || 'living_craft_dev',
    schema: 'ad',
    entities: [Category],
    synchronize: false,
  });

  await dataSource.initialize();
  const categoryRepo = dataSource.getRepository(Category);

  console.log('빌트인 카테고리 시드 시작...');

  for (const def of CATEGORY_DEFS) {
    const existing = await categoryRepo.findOne({
      where: { isBuiltin: true, name: def.name, type: def.type },
    });
    if (!existing) {
      await categoryRepo.save(categoryRepo.create({ ...def, isBuiltin: true, householdId: null }));
      console.log(`  ✅ ${def.type} - ${def.name}`);
    } else {
      console.log(`  ⏭️  ${def.type} - ${def.name} (이미 존재)`);
    }
  }

  console.log('시드 완료');
  await dataSource.destroy();
}

seed().catch((err) => {
  console.error('시드 실패:', err);
  process.exit(1);
});
