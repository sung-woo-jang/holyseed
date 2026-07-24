/**
 * 수입·지출 노션 DB("🏦 수입·지출 관리", collection://66229c50-9e52-4042-b00e-68b4a9e974c2)
 * 2025-11-27~2026-07-16 마이그레이션 데이터.
 *
 * 실행: yarn lab:expense:seed  (backend 디렉터리)
 */
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../../../app.module';
import { Expense, ExpenseKind, ExpenseType } from '../modules/expense/entities';

interface SeedRow {
  date: string;
  title: string;
  kind: ExpenseKind;
  category: string;
  expenseType: ExpenseType | null;
  amount: number;
  memo: string | null;
}

const EXP = ExpenseKind.EXPENSE;
const INC = ExpenseKind.INCOME;
const SAME = ExpenseType.FIXED_SAME;
const VAR = ExpenseType.FIXED_VARIABLE;
const IRR = ExpenseType.IRREGULAR;

const rows: SeedRow[] = [
  { date: '2025-11-27', title: '월세', kind: EXP, category: '주거', expenseType: SAME, amount: 500000, memo: null },
  { date: '2025-12-27', title: '월세', kind: EXP, category: '주거', expenseType: SAME, amount: 500000, memo: null },
  {
    date: '2026-01-01',
    title: '클로드 구독료',
    kind: EXP,
    category: '구독서비스',
    expenseType: VAR,
    amount: 32775,
    memo: null,
  },
  {
    date: '2026-01-01',
    title: '쿠팡 와우 구독',
    kind: EXP,
    category: '구독서비스',
    expenseType: SAME,
    amount: 7890,
    memo: null,
  },
  {
    date: '2026-01-20',
    title: '휴대폰 요금',
    kind: EXP,
    category: '통신',
    expenseType: SAME,
    amount: 40000,
    memo: null,
  },
  { date: '2026-01-27', title: '월세', kind: EXP, category: '주거', expenseType: SAME, amount: 500000, memo: null },
  {
    date: '2026-02-01',
    title: '클로드 구독료',
    kind: EXP,
    category: '구독서비스',
    expenseType: VAR,
    amount: 32929,
    memo: null,
  },
  {
    date: '2026-02-01',
    title: '쿠팡 와우 구독',
    kind: EXP,
    category: '구독서비스',
    expenseType: SAME,
    amount: 7890,
    memo: null,
  },
  {
    date: '2026-02-20',
    title: '휴대폰 요금',
    kind: EXP,
    category: '통신',
    expenseType: SAME,
    amount: 40000,
    memo: null,
  },
  { date: '2026-02-27', title: '월세', kind: EXP, category: '주거', expenseType: SAME, amount: 500000, memo: null },
  {
    date: '2026-03-01',
    title: '클로드 구독료',
    kind: EXP,
    category: '구독서비스',
    expenseType: VAR,
    amount: 34597,
    memo: null,
  },
  {
    date: '2026-03-01',
    title: '쿠팡 와우 구독',
    kind: EXP,
    category: '구독서비스',
    expenseType: SAME,
    amount: 7890,
    memo: null,
  },
  {
    date: '2026-03-20',
    title: '휴대폰 요금',
    kind: EXP,
    category: '통신',
    expenseType: SAME,
    amount: 40000,
    memo: null,
  },
  { date: '2026-03-27', title: '월세', kind: EXP, category: '주거', expenseType: SAME, amount: 500000, memo: null },
  {
    date: '2026-04-01',
    title: '쿠팡 와우 구독',
    kind: EXP,
    category: '구독서비스',
    expenseType: SAME,
    amount: 7890,
    memo: null,
  },
  {
    date: '2026-04-01',
    title: '클로드 구독료',
    kind: EXP,
    category: '구독서비스',
    expenseType: VAR,
    amount: 33799,
    memo: null,
  },
  {
    date: '2026-04-20',
    title: '휴대폰 요금',
    kind: EXP,
    category: '통신',
    expenseType: SAME,
    amount: 40000,
    memo: null,
  },
  { date: '2026-04-27', title: '월세', kind: EXP, category: '주거', expenseType: SAME, amount: 500000, memo: null },
  {
    date: '2026-05-01',
    title: '클로드 구독료',
    kind: EXP,
    category: '구독서비스',
    expenseType: VAR,
    amount: 34545,
    memo: null,
  },
  {
    date: '2026-05-01',
    title: '쿠팡 와우 구독',
    kind: EXP,
    category: '구독서비스',
    expenseType: SAME,
    amount: 7890,
    memo: null,
  },
  { date: '2026-05-06', title: '가스요금', kind: EXP, category: '공과금', expenseType: VAR, amount: 33740, memo: null },
  {
    date: '2026-05-20',
    title: '휴대폰 요금',
    kind: EXP,
    category: '통신',
    expenseType: SAME,
    amount: 40000,
    memo: null,
  },
  { date: '2026-05-27', title: '관리비', kind: EXP, category: '주거', expenseType: VAR, amount: 127100, memo: null },
  { date: '2026-05-27', title: '월세', kind: EXP, category: '주거', expenseType: SAME, amount: 500000, memo: null },
  {
    date: '2026-05-28',
    title: '클로드 AI 구독료',
    kind: EXP,
    category: '구독서비스',
    expenseType: SAME,
    amount: 34565,
    memo: null,
  },
  {
    date: '2026-05-30',
    title: '주유비',
    kind: EXP,
    category: '차량/유류비',
    expenseType: IRR,
    amount: 50000,
    memo: null,
  },
  {
    date: '2026-06-01',
    title: '헬스장 등록 (4개월)',
    kind: EXP,
    category: '기타지출',
    expenseType: VAR,
    amount: 198000,
    memo: null,
  },
  {
    date: '2026-06-01',
    title: '쿠팡 와우 구독',
    kind: EXP,
    category: '구독서비스',
    expenseType: SAME,
    amount: 7890,
    memo: null,
  },
  {
    date: '2026-06-04',
    title: '주유비',
    kind: EXP,
    category: '차량/유류비',
    expenseType: IRR,
    amount: 50000,
    memo: null,
  },
  {
    date: '2026-06-05',
    title: '주유비',
    kind: EXP,
    category: '차량/유류비',
    expenseType: IRR,
    amount: 80000,
    memo: null,
  },
  {
    date: '2026-06-10',
    title: '주유비',
    kind: EXP,
    category: '차량/유류비',
    expenseType: IRR,
    amount: 110000,
    memo: null,
  },
  { date: '2026-06-10', title: '일당', kind: INC, category: '급여', expenseType: null, amount: 250000, memo: null },
  {
    date: '2026-06-19',
    title: '주유비',
    kind: EXP,
    category: '차량/유류비',
    expenseType: IRR,
    amount: 106000,
    memo: null,
  },
  { date: '2026-06-20', title: '주급', kind: INC, category: '급여', expenseType: null, amount: 894203, memo: null },
  {
    date: '2026-06-20',
    title: '휴대폰 요금',
    kind: EXP,
    category: '통신',
    expenseType: SAME,
    amount: 40000,
    memo: null,
  },
  { date: '2026-06-25', title: '관리비', kind: EXP, category: '주거', expenseType: VAR, amount: 129360, memo: null },
  {
    date: '2026-06-26',
    title: '주유비',
    kind: EXP,
    category: '차량/유류비',
    expenseType: VAR,
    amount: 91000,
    memo: null,
  },
  { date: '2026-06-27', title: '월세', kind: EXP, category: '주거', expenseType: SAME, amount: 500000, memo: null },
  {
    date: '2026-07-01',
    title: '엔진오일 교체',
    kind: EXP,
    category: '차량/유류비',
    expenseType: IRR,
    amount: 24000,
    memo: '주행거리 125,660km',
  },
  {
    date: '2026-07-02',
    title: '도시가스 요금 (2026년 7월 청구분)',
    kind: EXP,
    category: '공과금',
    expenseType: VAR,
    amount: 13990,
    memo: '당월분 8,430원 + 전월 미납분 5,560원(6/20 납기) 포함. 사용량 7㎥',
  },
  {
    date: '2026-07-04',
    title: '주유비',
    kind: EXP,
    category: '차량/유류비',
    expenseType: IRR,
    amount: 82000,
    memo: '리터당 1,813원, 45.229리터 주유',
  },
  { date: '2026-07-05', title: '급여', kind: INC, category: '급여', expenseType: null, amount: 1310968, memo: null },
  {
    date: '2026-07-09',
    title: '주유비',
    kind: EXP,
    category: '차량/유류비',
    expenseType: null,
    amount: 96000,
    memo: '리터당 1,809원',
  },
  {
    date: '2026-07-16',
    title: '코스트코 장보기',
    kind: EXP,
    category: '생활',
    expenseType: IRR,
    amount: 112000,
    memo:
      'CADINA 감자스틱 18,990 / CADINA SUMMER IRC 4,500(쿠폰) / 플레인 사워도우번 9,990 / KS M. 쇼비뇽블랑 11,290 / ' +
      '신라면 120gx30 19,790 / 에센뽀득 900G 14,990 / 서울무가당플레인 6,990 / 락토프리소화우유 5,590 / ' +
      '로티세리치킨 7,490 / 양상추 국내산 3,890 / 하바티 슬라이스 17,490 (쿠폰할인 4,500 적용, 총 112,000원)',
  },
];

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  const ds = app.get(DataSource);
  const expenseRepo = ds.getRepository(Expense);

  await expenseRepo.createQueryBuilder().delete().execute();

  for (const row of rows) {
    await expenseRepo.save(
      expenseRepo.create({
        title: row.title,
        date: row.date,
        kind: row.kind,
        category: row.category,
        expenseType: row.expenseType,
        amount: row.amount,
        memo: row.memo,
      }),
    );
  }

  console.log(`수입·지출 노션 마이그레이션 완료: ${rows.length}건 삽입`);
  await app.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
