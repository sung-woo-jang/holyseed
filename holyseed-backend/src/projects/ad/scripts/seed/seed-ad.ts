import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { Category, CategoryType } from '../../modules/categories/entities/category.entity';
import { AdUser } from '../../modules/users/entities/ad-user.entity';
import { Household } from '../../modules/households/entities/household.entity';
import { Membership, MemberRole } from '../../modules/memberships/entities/membership.entity';
import { Asset, AssetCategory } from '../../modules/assets/entities/asset.entity';
import { AssetSnapshot } from '../../modules/asset-snapshots/entities/asset-snapshot.entity';
import { Transaction, TransactionType } from '../../modules/transactions/entities/transaction.entity';
import { RecurringTransaction, RecurringFrequency } from '../../modules/recurring-transactions/entities/recurring-transaction.entity';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const CATEGORY_DEFS: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'householdId' | 'isBuiltin'>[] = [
  { type: CategoryType.INCOME, name: '급여', icon: '💼', color: '#34C759', sortOrder: 1 },
  { type: CategoryType.INCOME, name: '사업소득', icon: '🏢', color: '#34C759', sortOrder: 2 },
  { type: CategoryType.INCOME, name: '투자수익', icon: '📈', color: '#34C759', sortOrder: 3 },
  { type: CategoryType.INCOME, name: '부수입', icon: '💰', color: '#34C759', sortOrder: 4 },
  { type: CategoryType.EXPENSE, name: '식비', icon: '🍽️', color: '#FF6D35', sortOrder: 10 },
  { type: CategoryType.EXPENSE, name: '교통비', icon: '🚇', color: '#FF6D35', sortOrder: 11 },
  { type: CategoryType.EXPENSE, name: '주거비', icon: '🏠', color: '#FF6D35', sortOrder: 12 },
  { type: CategoryType.EXPENSE, name: '의료비', icon: '🏥', color: '#FF6D35', sortOrder: 13 },
  { type: CategoryType.EXPENSE, name: '문화/여가', icon: '🎬', color: '#FF6D35', sortOrder: 14 },
  { type: CategoryType.EXPENSE, name: '의류', icon: '👗', color: '#FF6D35', sortOrder: 15 },
  { type: CategoryType.EXPENSE, name: '교육', icon: '📚', color: '#FF6D35', sortOrder: 16 },
  { type: CategoryType.EXPENSE, name: '보험료', icon: '🛡️', color: '#FF6D35', sortOrder: 17 },
  { type: CategoryType.EXPENSE, name: '기타지출', icon: '📦', color: '#FF6D35', sortOrder: 18 },
];

function dateStr(monthsAgo: number, day = 1): string {
  const d = new Date();
  d.setDate(day);
  d.setMonth(d.getMonth() - monthsAgo);
  return d.toISOString().split('T')[0];
}

async function seedBuiltinCategories(ds: DataSource) {
  const repo = ds.getRepository(Category);
  console.log('빌트인 카테고리 시드...');
  for (const def of CATEGORY_DEFS) {
    const existing = await repo.findOne({ where: { isBuiltin: true, name: def.name, type: def.type } });
    if (!existing) {
      await repo.save(repo.create({ ...def, isBuiltin: true, householdId: null }));
      console.log(`  ✅ ${def.type} - ${def.name}`);
    } else {
      console.log(`  ⏭️  ${def.name} (기존)`);
    }
  }
}

async function seedDemoUserAndHousehold(ds: DataSource) {
  console.log('\n데모 데이터 시드 (couple30 페르소나)...');

  const userRepo = ds.getRepository(AdUser);
  const householdRepo = ds.getRepository(Household);
  const memberRepo = ds.getRepository(Membership);
  const assetRepo = ds.getRepository(Asset);
  const snapshotRepo = ds.getRepository(AssetSnapshot);
  const txRepo = ds.getRepository(Transaction);
  const recurringRepo = ds.getRepository(RecurringTransaction);
  const catRepo = ds.getRepository(Category);

  // 기존 데모 유저 확인
  let user = await userRepo.findOne({ where: { tossUserKey: 'demo-user-couple30' } });
  if (user) {
    console.log('  ⏭️  데모 유저 이미 존재, 건너뜀');
    return;
  }

  // 유저 생성
  user = await userRepo.save(userRepo.create({
    tossUserKey: 'demo-user-couple30',
    name: '김토스',
    initial: '김',
    avatarColor: '#3182F6',
    preferredCurrency: 'KRW',
  }));
  console.log('  ✅ 유저 생성:', user.name);

  // 가구 생성
  const household = await householdRepo.save(householdRepo.create({
    name: '우리 가계',
    icon: '🏠',
    ownerUserId: user.id,
    baseCurrency: 'KRW',
  }));
  console.log('  ✅ 가구 생성:', household.name);

  // 멤버십
  await memberRepo.save(memberRepo.create({ householdId: household.id, userId: user.id, role: MemberRole.OWNER }));

  // 카테고리 조회
  const cats = await catRepo.find({ where: { isBuiltin: true } });
  const catMap = Object.fromEntries(cats.map((c) => [c.name, c.id]));

  // 자산 10개
  const assetDefs = [
    { name: '국민은행 입출금', category: AssetCategory.CASH, currency: 'KRW', sortOrder: 1 },
    { name: '카카오뱅크 저축', category: AssetCategory.CASH, currency: 'KRW', sortOrder: 2 },
    { name: '삼성전자 주식', category: AssetCategory.INVESTMENT, currency: 'KRW', sortOrder: 3 },
    { name: 'S&P500 ETF', category: AssetCategory.INVESTMENT, currency: 'USD', sortOrder: 4 },
    { name: '비트코인', category: AssetCategory.CRYPTO, currency: 'BTC', sortOrder: 5 },
    { name: '서울 아파트', category: AssetCategory.REAL_ASSET, currency: 'KRW', sortOrder: 6 },
    { name: '국민연금', category: AssetCategory.PENSION, currency: 'KRW', sortOrder: 7 },
    { name: '실손보험', category: AssetCategory.PENSION, currency: 'KRW', sortOrder: 8 },
    { name: '신용카드 대출', category: AssetCategory.DEBT, currency: 'KRW', isLiability: true, sortOrder: 9 },
    { name: '전세 대출', category: AssetCategory.DEBT, currency: 'KRW', isLiability: true, sortOrder: 10 },
  ];
  const assets: Asset[] = [];
  for (const def of assetDefs) {
    const a = await assetRepo.save(assetRepo.create({ ...def, householdId: household.id }));
    assets.push(a);
  }
  console.log(`  ✅ 자산 ${assets.length}개 생성`);

  // 기준 잔액 (원화 기준 현재값)
  const baseValues: Record<number, number> = {
    0: 8000000, 1: 15000000, 2: 12000000, 3: 25000000,
    4: 5000000, 5: 650000000, 6: 18000000, 7: 3000000,
    8: -2000000, 9: -150000000,
  };
  // USD/BTC 환율
  const fxMap: Record<number, { rate: number }> = { 3: { rate: 1380 }, 4: { rate: 80000000 } };

  // 스냅샷 60개월
  let snapCount = 0;
  for (let mo = 59; mo >= 0; mo--) {
    for (let i = 0; i < assets.length; i++) {
      const a = assets[i];
      const base = baseValues[i] ?? 0;
      const trend = 1 + (0.005 * (59 - mo)) + (Math.random() * 0.02 - 0.01);
      const value = Math.round(Math.abs(base) * trend) * (base < 0 ? -1 : 1);
      const fx = fxMap[i];
      const fxRate = fx ? fx.rate : 1;
      const rawValue = fx ? Math.round(value / fxRate * 100) / 100 : value;
      await snapshotRepo.save(snapshotRepo.create({
        assetId: a.id,
        date: dateStr(mo, 28),
        value: rawValue,
        fxRateToKRW: fxRate,
        valueKRW: value,
        createdByUserId: user.id,
      }));
      snapCount++;
    }
  }
  console.log(`  ✅ 스냅샷 ${snapCount}개 생성`);

  // 거래 80개 (최근 6개월)
  const txDefs = [
    { type: TransactionType.INCOME, catName: '급여', amount: 3500000, title: '월급' },
    { type: TransactionType.INCOME, catName: '급여', amount: 3200000, title: '배우자 월급' },
    { type: TransactionType.EXPENSE, catName: '식비', amount: 120000, title: '마트 장보기' },
    { type: TransactionType.EXPENSE, catName: '식비', amount: 45000, title: '외식' },
    { type: TransactionType.EXPENSE, catName: '교통비', amount: 60000, title: '대중교통' },
    { type: TransactionType.EXPENSE, catName: '주거비', amount: 800000, title: '월세' },
    { type: TransactionType.EXPENSE, catName: '의료비', amount: 30000, title: '병원' },
    { type: TransactionType.EXPENSE, catName: '문화/여가', amount: 50000, title: '영화/카페' },
    { type: TransactionType.EXPENSE, catName: '교육', amount: 200000, title: '학원비' },
    { type: TransactionType.EXPENSE, catName: '보험료', amount: 150000, title: '생명보험' },
    { type: TransactionType.EXPENSE, catName: '기타지출', amount: 80000, title: '기타' },
    { type: TransactionType.EXPENSE, catName: '의류', amount: 120000, title: '옷 구매' },
  ];
  let txCount = 0;
  for (let mo = 5; mo >= 0; mo--) {
    for (const def of txDefs) {
      if (Math.random() < 0.85) {
        const fromIdx = def.type === TransactionType.EXPENSE ? 0 : undefined;
        const toIdx = def.type === TransactionType.INCOME ? 0 : undefined;
        await txRepo.save(txRepo.create({
          householdId: household.id,
          date: dateStr(mo, Math.ceil(Math.random() * 28)),
          type: def.type,
          amount: Math.round(def.amount * (0.9 + Math.random() * 0.2)),
          categoryId: catMap[def.catName],
          fromAssetId: fromIdx !== undefined ? assets[fromIdx].id : undefined,
          toAssetId: toIdx !== undefined ? assets[toIdx].id : undefined,
          title: def.title,
          autoGenerated: false,
          createdByUserId: user.id,
        }));
        txCount++;
      }
    }
  }
  console.log(`  ✅ 거래 ${txCount}개 생성`);

  // 정기거래 8개
  const recurringDefs = [
    { type: TransactionType.INCOME, catName: '급여', amount: 3500000, title: '월급 자동이체', dayOfMonth: 25 },
    { type: TransactionType.INCOME, catName: '급여', amount: 3200000, title: '배우자 월급', dayOfMonth: 25 },
    { type: TransactionType.EXPENSE, catName: '주거비', amount: 800000, title: '월세', dayOfMonth: 1 },
    { type: TransactionType.EXPENSE, catName: '보험료', amount: 150000, title: '생명보험료', dayOfMonth: 10 },
    { type: TransactionType.EXPENSE, catName: '교육', amount: 200000, title: '학원비', dayOfMonth: 15 },
    { type: TransactionType.EXPENSE, catName: '교통비', amount: 60000, title: '교통카드 충전', dayOfMonth: 5 },
    { type: TransactionType.EXPENSE, catName: '보험료', amount: 200000, title: '자동차보험', frequency: RecurringFrequency.YEARLY, dayOfMonth: 1, monthOfYear: 3 },
  ];
  for (const def of recurringDefs) {
    const fromIdx = def.type === TransactionType.EXPENSE ? 0 : undefined;
    const toIdx = def.type === TransactionType.INCOME ? 0 : undefined;
    await recurringRepo.save(recurringRepo.create({
      householdId: household.id,
      type: def.type,
      amount: def.amount,
      categoryId: catMap[def.catName],
      fromAssetId: fromIdx !== undefined ? assets[fromIdx].id : undefined,
      toAssetId: toIdx !== undefined ? assets[toIdx].id : undefined,
      title: def.title,
      frequency: (def as any).frequency ?? RecurringFrequency.MONTHLY,
      dayOfMonth: def.dayOfMonth,
      monthOfYear: (def as any).monthOfYear ?? null,
      startDate: dateStr(6),
      active: true,
    }));
  }
  console.log(`  ✅ 정기거래 ${recurringDefs.length}개 생성`);
  console.log('\n데모 데이터 시드 완료!');
}

async function seed() {
  const entities = [Category, AdUser, Household, Membership, Asset, AssetSnapshot, Transaction, RecurringTransaction];
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password123',
    database: process.env.DB_DATABASE || 'holyseed',
    schema: 'ad',
    entities,
    synchronize: false,
  });

  await dataSource.initialize();

  await seedBuiltinCategories(dataSource);
  await seedDemoUserAndHousehold(dataSource);

  console.log('\n전체 시드 완료!');
  await dataSource.destroy();
}

seed().catch((err) => {
  console.error('시드 실패:', err);
  process.exit(1);
});
