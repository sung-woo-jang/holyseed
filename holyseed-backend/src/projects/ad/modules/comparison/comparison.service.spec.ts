process.env.TZ = 'Asia/Seoul';

import { AssetCategory } from '../assets/entities/asset.entity';
import { TransactionType } from '../transactions/entities/transaction.entity';
import { computeYearly, daysBetween, growthRate } from './comparison.service';

function asset(id: number, category = AssetCategory.CASH, opts: { isLiability?: boolean; archivedAt?: Date } = {}) {
  return {
    id,
    name: `자산${id}`,
    category,
    isLiability: !!opts.isLiability,
    archivedAt: opts.archivedAt ?? (null as unknown as Date),
  };
}
function snap(assetId: number, date: string, valueKRW: number) {
  return { assetId, date, valueKRW };
}
const byYear = (rows: ReturnType<typeof computeYearly>) => Object.fromEntries(rows.map((r) => [r.year, r]));

describe('computeYearly', () => {
  it('helpers', () => {
    expect(daysBetween('2025-12-01', '2025-12-31')).toBe(30);
    expect(growthRate(1_000, 187)).toBe(18.7);
    expect(growthRate(0, 100)).toBeNull();
    expect(growthRate(-500, 100)).toBeNull();
  });

  it('스냅샷이 없으면 빈 배열', () => {
    expect(computeYearly([asset(1)], [], [], '2026-10-07')).toEqual([]);
  });

  it('기록 시작 연도부터만 내보내고, 첫해는 비교값이 없다', () => {
    const rows = computeYearly([asset(1)], [snap(1, '2025-03-01', 100), snap(1, '2026-01-10', 150)], [], '2026-10-07');
    expect(rows.map((r) => r.year)).toEqual([2025, 2026]);
    expect(rows[0].change).toBeNull();
    expect(rows[0].growthRate).toBeNull();
    expect(rows[1].prevNetWorth).toBe(100);
    expect(rows[1].growthRate).toBe(50);
  });

  it('최대 5년만 내보낸다', () => {
    const rows = computeYearly([asset(1)], [snap(1, '2019-02-26', 100)], [], '2026-10-07');
    expect(rows.map((r) => r.year)).toEqual([2022, 2023, 2024, 2025, 2026]);
    expect(rows[0].prevNetWorth).toBe(100); // 2021년 말 기록이 있으니 2022년도 비교 가능
  });

  it('그해 처음 기록한 자산은 신규 편입으로 떼고 증가율에서 뺀다 (2026 증권계좌 사례)', () => {
    const assets = [asset(1), asset(9, AssetCategory.INVESTMENT)];
    const snaps = [
      snap(1, '2025-12-29', 1_058_328),
      snap(1, '2026-10-01', 1_255_897),
      snap(9, '2026-07-28', 6_641_277),
      snap(9, '2026-10-03', 17_410_457),
    ];

    const r = byYear(computeYearly(assets, snaps, [], '2026-10-07'))[2026];

    expect(r.asOf).toBe('2026-10-07');
    expect(r.isCurrentYear).toBe(true);
    expect(r.netWorth).toBe(18_666_354);
    expect(r.change).toBe(18_666_354 - 1_058_328);
    expect(r.newAssetsKRW).toBe(17_410_457);
    expect(r.newAssets).toEqual([{ assetId: 9, name: '자산9', valueKRW: 17_410_457, firstSnapshotDate: '2026-07-28' }]);
    expect(r.growth).toBe(197_569);
    expect(r.growthRate).toBe(18.7);
    // 자산군별 기여에는 신규 편입이 빠지고, 기여 합 + 신규 = 전체 변화
    expect(r.contributions).toEqual([{ category: 'CASH', valueKRW: 197_569 }]);
    expect(r.contributions.reduce((s, c) => s + c.valueKRW, 0) + r.newAssetsKRW).toBe(r.change);
  });

  it('부채는 순자산에서 빼고, 잔액이 줄면 +로 기여한다', () => {
    const assets = [asset(1), asset(2, AssetCategory.DEBT, { isLiability: true })];
    const snaps = [
      snap(1, '2025-12-31', 1000),
      snap(2, '2025-12-31', 400),
      snap(1, '2026-10-01', 1000),
      snap(2, '2026-10-01', 300),
    ];

    const r = byYear(computeYearly(assets, snaps, [], '2026-10-07'))[2026];

    expect(r.prevNetWorth).toBe(600);
    expect(r.netWorth).toBe(700);
    expect(r.contributions).toEqual([{ category: 'DEBT', valueKRW: 100 }]);
  });

  it('보관한 자산은 보관 전 연도에는 들어가고, 이후엔 빠진다 (판 돈은 현금 증가로만 남음)', () => {
    const assets = [asset(1), asset(2, AssetCategory.INVESTMENT, { archivedAt: new Date(2026, 2, 15, 10) })];
    const snaps = [snap(1, '2025-12-31', 100), snap(2, '2025-12-31', 1000), snap(1, '2026-03-15', 1100)];

    const r = byYear(computeYearly(assets, snaps, [], '2026-10-07'))[2026];

    expect(r.prevNetWorth).toBe(1100);
    expect(r.netWorth).toBe(1100);
    expect(r.change).toBe(0);
    expect(r.newAssetsKRW).toBe(0);
    expect(r.contributions).toEqual([
      { category: 'CASH', valueKRW: 1000 },
      { category: 'INVESTMENT', valueKRW: -1000 },
    ]);
  });

  it('기준일보다 31일 넘게 오래된 스냅샷은 staleAssets로 알려준다', () => {
    const assets = [asset(1), asset(2)];
    const snaps = [snap(1, '2025-12-01', 100), snap(2, '2025-10-15', 100)];

    const r = byYear(computeYearly(assets, snaps, [], '2026-10-07'))[2025];

    expect(r.staleAssets).toEqual([{ assetId: 2, name: '자산2', snapshotDate: '2025-10-15', daysBefore: 77 }]);
  });

  it('올해 값은 오늘 이후 날짜의 스냅샷을 쓰지 않는다', () => {
    const rows = computeYearly([asset(1)], [snap(1, '2025-12-31', 100), snap(1, '2026-12-31', 999)], [], '2026-10-07');
    expect(byYear(rows)[2026].netWorth).toBe(100);
  });

  describe('수입·지출 분해', () => {
    const assets = [asset(1)];
    const snaps = [snap(1, '2025-12-31', 1000), snap(1, '2026-10-01', 1500)];

    it('가계부가 작년 말 이전부터 있으면 모은 돈과 나머지로 나눈다', () => {
      const txs = [
        { date: '2025-12-20', type: TransactionType.INCOME, amount: 999 },
        { date: '2026-01-25', type: TransactionType.INCOME, amount: 400 },
        { date: '2026-02-01', type: TransactionType.EXPENSE, amount: 100 },
        { date: '2026-11-01', type: TransactionType.INCOME, amount: 999 }, // 아직 오지 않은 예정 거래
      ];
      const r = byYear(computeYearly(assets, snaps, txs, '2026-10-07'))[2026];
      expect(r.flows).toEqual({ income: 400, expense: 100, saved: 300, other: 200 });
    });

    it('가계부가 올해부터 시작했으면 분해하지 않는다', () => {
      const txs = [{ date: '2026-01-25', type: TransactionType.INCOME, amount: 400 }];
      expect(byYear(computeYearly(assets, snaps, txs, '2026-10-07'))[2026].flows).toBeNull();
    });
  });
});
