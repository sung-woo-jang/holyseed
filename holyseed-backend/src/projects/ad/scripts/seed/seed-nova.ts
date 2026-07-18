import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { Category } from '../../modules/categories/entities/category.entity';
import { AdUser } from '../../modules/users/entities/ad-user.entity';
import { Household } from '../../modules/households/entities/household.entity';
import { Membership } from '../../modules/memberships/entities/membership.entity';
import { Asset, AssetCategory } from '../../modules/assets/entities/asset.entity';
import { AssetSnapshot } from '../../modules/asset-snapshots/entities/asset-snapshot.entity';
import { Transaction, TransactionType } from '../../modules/transactions/entities/transaction.entity';
import {
  RecurringTransaction,
  RecurringFrequency,
} from '../../modules/recurring-transactions/entities/recurring-transaction.entity';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

// 대상 가구: 노바체 (dev-user-001)
const HID = 3;
const USER_ID = 4;

/** monthsAgo개월 전, 지정 일(day) 날짜 문자열 */
function dateStr(monthsAgo: number, day = 1): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - monthsAgo, day);
  return d.toISOString().split('T')[0];
}

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}
function jitter(base: number, pct = 0.15): number {
  return Math.round(base * (1 + rand(-pct, pct)));
}

async function seedNova(ds: DataSource) {
  const assetRepo = ds.getRepository(Asset);
  const snapshotRepo = ds.getRepository(AssetSnapshot);
  const txRepo = ds.getRepository(Transaction);
  const recurringRepo = ds.getRepository(RecurringTransaction);
  const catRepo = ds.getRepository(Category);
  const userRepo = ds.getRepository(AdUser);
  const householdRepo = ds.getRepository(Household);
  const memberRepo = ds.getRepository(Membership);

  // 가구/유저 확인
  const household = await householdRepo.findOne({ where: { id: HID } });
  if (!household) throw new Error(`household_id=${HID} 가구가 없습니다.`);
  const user = await userRepo.findOne({ where: { id: USER_ID } });
  if (!user) throw new Error(`user_id=${USER_ID} 유저가 없습니다.`);
  const member = await memberRepo.findOne({ where: { householdId: HID, userId: USER_ID } });
  if (!member) throw new Error(`멤버십(가구 ${HID}, 유저 ${USER_ID})이 없습니다.`);
  console.log(`대상 가구: ${household.name} (id=${HID}), owner=${user.name}`);

  // ── 1. 기존 가구 데이터 삭제 (FK 순서) ──────────────────────────────
  const qr = ds.createQueryRunner();
  await qr.connect();
  await qr.startTransaction();
  try {
    const assetRows: { id: number }[] = await qr.query(`SELECT id FROM ad.assets WHERE household_id = $1`, [HID]);
    const assetIds = assetRows.map((r) => r.id);
    await qr.query(`DELETE FROM ad.transactions WHERE household_id = $1`, [HID]);
    await qr.query(`DELETE FROM ad.recurring_transactions WHERE household_id = $1`, [HID]);
    if (assetIds.length > 0) {
      await qr.query(`DELETE FROM ad.asset_snapshots WHERE asset_id = ANY($1)`, [assetIds]);
    }
    await qr.query(`DELETE FROM ad.assets WHERE household_id = $1`, [HID]);
    await qr.commitTransaction();
    console.log(`  🗑️  기존 데이터 삭제 (자산 ${assetIds.length}개 및 연관)`);
  } catch (e) {
    await qr.rollbackTransaction();
    throw e;
  } finally {
    await qr.release();
  }

  // ── 2. 카테고리 맵 (빌트인 조회) ────────────────────────────────────
  const cats = await catRepo.find({ where: { isBuiltin: true } });
  const catMap = Object.fromEntries(cats.map((c) => [c.name, c.id]));
  const cat = (name: string): number | undefined => catMap[name];

  // ── 3. 자산 ~7개 (전부 KRW, 새내기 20대) ────────────────────────────
  // base = 최신(현재) 평가액. 순자산 ≈ 500+800+1200+1000+300+700 − 500 ≈ 4,000만
  const assetDefs: { name: string; category: AssetCategory; base: number; isLiability?: boolean; sortOrder: number }[] =
    [
      { name: '카카오뱅크 입출금', category: AssetCategory.CASH, base: 5_000_000, sortOrder: 1 },
      { name: '토스 비상금 파킹', category: AssetCategory.CASH, base: 8_000_000, sortOrder: 2 },
      { name: '청년적금', category: AssetCategory.CASH, base: 12_000_000, sortOrder: 3 },
      { name: '키움 주식계좌', category: AssetCategory.INVESTMENT, base: 10_000_000, sortOrder: 4 },
      { name: '업비트 코인', category: AssetCategory.CRYPTO, base: 3_000_000, sortOrder: 5 },
      { name: '연금저축펀드', category: AssetCategory.PENSION, base: 7_000_000, sortOrder: 6 },
      { name: '학자금 대출', category: AssetCategory.DEBT, base: 5_000_000, isLiability: true, sortOrder: 7 },
    ];

  const assets: { entity: Asset; base: number; isLiability: boolean }[] = [];
  for (const def of assetDefs) {
    const a = await assetRepo.save(
      assetRepo.create({
        householdId: HID,
        name: def.name,
        category: def.category,
        currency: 'KRW',
        isLiability: !!def.isLiability,
        sortOrder: def.sortOrder,
      }),
    );
    assets.push({ entity: a, base: def.base, isLiability: !!def.isLiability });
  }
  console.log(`  ✅ 자산 ${assets.length}개`);

  // ── 4. 스냅샷 60개월 (역방향 성장: 5년 전 소액 → 현재) ──────────────
  let snapCount = 0;
  for (let mo = 59; mo >= 0; mo--) {
    const progress = (59 - mo) / 59; // 0(5년 전) → 1(현재)
    for (const a of assets) {
      // 부채는 점차 상환(과거에 더 컸다가 줄어듦), 자산은 우상향
      let factor: number;
      if (a.isLiability) {
        // 5년 전 1.6배 → 현재 1.0배 (상환 진행)
        factor = 1.6 - 0.6 * progress;
      } else {
        // 5년 전 ~8% → 현재 100% (가파른 축적)
        factor = 0.08 + 0.92 * progress;
      }
      const value = Math.max(0, jitter(Math.round(a.base * factor), 0.06));
      await snapshotRepo.save(
        snapshotRepo.create({
          assetId: a.entity.id,
          date: dateStr(mo, 28),
          value,
          fxRateToKRW: 1,
          valueKRW: value,
          createdByUserId: USER_ID,
        }),
      );
      snapCount++;
    }
  }
  console.log(`  ✅ 스냅샷 ${snapCount}개 (자산 ${assets.length} × 60개월)`);

  const checking = assets[0].entity; // 입출금통장
  const stock = assets[3].entity; // 주식계좌

  // ── 5. 거래 60개월 (월 5~8건) ──────────────────────────────────────
  type TxDef = { type: TransactionType; catName: string; amount: number; title: string; prob: number };
  const txDefs: TxDef[] = [
    { type: TransactionType.INCOME, catName: '급여', amount: 2_500_000, title: '월급', prob: 1.0 },
    { type: TransactionType.INCOME, catName: '부수입', amount: 200_000, title: '용돈/부수입', prob: 0.25 },
    { type: TransactionType.INCOME, catName: '투자수익', amount: 150_000, title: '배당금', prob: 0.2 },
    { type: TransactionType.EXPENSE, catName: '식비', amount: 35_000, title: '마트/장보기', prob: 0.9 },
    { type: TransactionType.EXPENSE, catName: '식비', amount: 18_000, title: '외식/배달', prob: 0.85 },
    { type: TransactionType.EXPENSE, catName: '교통비', amount: 55_000, title: '교통카드 충전', prob: 0.8 },
    { type: TransactionType.EXPENSE, catName: '문화/여가', amount: 40_000, title: '영화/카페', prob: 0.6 },
    { type: TransactionType.EXPENSE, catName: '의류', amount: 70_000, title: '옷/신발', prob: 0.35 },
    { type: TransactionType.EXPENSE, catName: '의료비', amount: 25_000, title: '병원/약국', prob: 0.25 },
    { type: TransactionType.EXPENSE, catName: '교육', amount: 90_000, title: '강의/도서', prob: 0.2 },
    { type: TransactionType.EXPENSE, catName: '기타지출', amount: 30_000, title: '생활용품', prob: 0.5 },
  ];

  let txCount = 0;
  for (let mo = 59; mo >= 0; mo--) {
    for (const def of txDefs) {
      if (Math.random() > def.prob) continue;
      const isIncome = def.type === TransactionType.INCOME;
      const day = isIncome && def.title === '월급' ? 25 : Math.ceil(rand(1, 28));
      await txRepo.save(
        txRepo.create({
          householdId: HID,
          date: dateStr(mo, day),
          type: def.type,
          amount: jitter(def.amount, isIncome ? 0.05 : 0.3),
          categoryId: cat(def.catName),
          fromAssetId: isIncome ? undefined : checking.id,
          toAssetId: isIncome ? checking.id : undefined,
          title: def.title,
          autoGenerated: false,
          createdByUserId: USER_ID,
        }),
      );
      txCount++;
    }
  }
  console.log(`  ✅ 거래 ${txCount}개 (5년치, 월 평균 ${Math.round(txCount / 60)}건)`);

  // ── 6. 정기항목 9개 (전부 active, 고정금액) ────────────────────────
  const startDate = dateStr(59, 1);
  type RecDef = { type: TransactionType; catName: string; amount: number; title: string; day: number };
  const recDefs: RecDef[] = [
    { type: TransactionType.INCOME, catName: '급여', amount: 2_500_000, title: '월급', day: 25 },
    { type: TransactionType.EXPENSE, catName: '주거비', amount: 500_000, title: '월세', day: 1 },
    { type: TransactionType.EXPENSE, catName: '기타지출', amount: 55_000, title: '통신비', day: 15 },
    { type: TransactionType.EXPENSE, catName: '기타지출', amount: 13_500, title: '넷플릭스', day: 17 },
    { type: TransactionType.EXPENSE, catName: '문화/여가', amount: 10_900, title: '스포티파이', day: 3 },
    { type: TransactionType.EXPENSE, catName: '문화/여가', amount: 14_900, title: '유튜브 프리미엄', day: 8 },
    { type: TransactionType.EXPENSE, catName: '보험료', amount: 35_000, title: '실손보험', day: 5 },
    { type: TransactionType.EXPENSE, catName: '주거비', amount: 350_000, title: '청년적금 자동납입', day: 26 },
    { type: TransactionType.EXPENSE, catName: '문화/여가', amount: 59_000, title: '헬스장 회비', day: 1 },
  ];
  for (const def of recDefs) {
    const isIncome = def.type === TransactionType.INCOME;
    await recurringRepo.save(
      recurringRepo.create({
        householdId: HID,
        type: def.type,
        amount: def.amount,
        categoryId: cat(def.catName),
        fromAssetId: isIncome ? undefined : checking.id,
        toAssetId: isIncome ? checking.id : undefined,
        title: def.title,
        frequency: RecurringFrequency.MONTHLY,
        dayOfMonth: def.day,
        startDate,
        active: true,
      }),
    );
  }
  console.log(`  ✅ 정기항목 ${recDefs.length}개`);
  console.log('\n노바체 5년치 더미 시드 완료!');
  void stock;
}

async function main() {
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
  await seedNova(dataSource);
  await dataSource.destroy();
}

main().catch((err) => {
  console.error('시드 실패:', err);
  process.exit(1);
});
