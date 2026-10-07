// 운영 서버(한국시간)에서만 드러나던 월말 기준일 오프바이원을 테스트에서도 재현하기 위해 타임존을 고정한다
process.env.TZ = 'Asia/Seoul';

import { Repository } from 'typeorm';
import { Asset } from '../assets/entities/asset.entity';
import { AssetSnapshot } from '../asset-snapshots/entities/asset-snapshot.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { TimeseriesRange } from './dto/request/timeseries-range.dto';
import { DashboardService, signedValue, ymd } from './dashboard.service';

function snap(assetId: number, date: string, valueKRW: number) {
  return { assetId, date, valueKRW };
}

describe('DashboardService', () => {
  let query: jest.Mock;
  let assetFind: jest.Mock;
  let snapshots: ReturnType<typeof snap>[];
  let service: DashboardService;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-10-02T09:00:00+09:00'));
    query = jest.fn();
    assetFind = jest.fn();
    snapshots = [];
    const qb: Record<string, jest.Mock> = {};
    qb.select = jest.fn(() => qb);
    qb.where = jest.fn(() => qb);
    qb.orderBy = jest.fn(() => qb);
    qb.getMany = jest.fn(() => Promise.resolve(snapshots));
    service = new DashboardService(
      { find: assetFind, manager: { query } } as unknown as Repository<Asset>,
      { createQueryBuilder: jest.fn(() => qb) } as unknown as Repository<AssetSnapshot>,
      { find: jest.fn().mockResolvedValue([]) } as unknown as Repository<Transaction>,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('helpers', () => {
    it('ymd는 UTC 변환 없이 로컬 날짜를 만든다', () => {
      expect(ymd(new Date(2026, 8, 30))).toBe('2026-09-30');
      expect(ymd(new Date(2026, 0, 1))).toBe('2026-01-01');
    });

    it('부채는 순자산에서 차감한다', () => {
      expect(signedValue(false, 100)).toBe(100);
      expect(signedValue(true, 100)).toBe(-100);
    });
  });

  describe('월별 순자산 시계열', () => {
    it('말일에 입력한 스냅샷은 그 달 값으로 집계한다 (30일 달의 30일, 31일 달의 31일)', async () => {
      assetFind.mockResolvedValue([{ id: 1, isLiability: false }]);
      snapshots = [snap(1, '2026-06-30', 433_920), snap(1, '2026-07-31', 7_563_964), snap(1, '2026-08-31', 19_986_093)];

      const ts = await service.getTimeseriesRange(1, TimeseriesRange.ONE_YEAR);

      const byMonth = Object.fromEntries(ts.map((t) => [t.month, t.netWorth]));
      expect(byMonth['2026-06']).toBe(433_920);
      expect(byMonth['2026-07']).toBe(7_563_964);
      expect(byMonth['2026-08']).toBe(19_986_093);
    });

    it('부채 자산은 순자산에서 뺀다', async () => {
      assetFind.mockResolvedValue([
        { id: 1, isLiability: false },
        { id: 2, isLiability: true },
      ]);
      snapshots = [snap(1, '2026-08-31', 1000), snap(2, '2026-08-31', 300), snap(1, '2026-09-30', 1200)];

      const ts = await service.getTimeseriesRange(1, TimeseriesRange.ONE_YEAR);

      const byMonth = Object.fromEntries(ts.map((t) => [t.month, t.netWorth]));
      expect(byMonth['2026-08']).toBe(700);
      expect(byMonth['2026-09']).toBe(900);
      expect(byMonth['2026-10']).toBe(900);
    });

    it('전체 범위는 가장 오래된 스냅샷의 달부터 시작한다', async () => {
      assetFind.mockResolvedValue([{ id: 1, isLiability: false }]);
      snapshots = [snap(1, '2019-02-26', 100), snap(1, '2026-09-30', 200)];

      const ts = await service.getTimeseriesRange(1, TimeseriesRange.ALL);

      expect(ts[0]).toEqual({ month: '2019-02', netWorth: 100 });
      expect(ts[ts.length - 1]).toEqual({ month: '2026-10', netWorth: 200 });
      expect(ts).toHaveLength(93);
    });

    it('보관한 자산은 보관한 달부터 빠지고, 그 전 달까지는 들어간다', async () => {
      assetFind.mockResolvedValue([
        { id: 1, isLiability: false, archivedAt: null },
        { id: 2, isLiability: false, archivedAt: new Date(2026, 8, 10, 15) },
      ]);
      snapshots = [snap(1, '2026-07-31', 100), snap(2, '2026-07-31', 1000), snap(1, '2026-09-10', 1100)];

      const ts = await service.getTimeseriesRange(1, TimeseriesRange.ONE_YEAR);

      const byMonth = Object.fromEntries(ts.map((t) => [t.month, t.netWorth]));
      expect(byMonth['2026-08']).toBe(1100);
      expect(byMonth['2026-09']).toBe(1100);
    });

    it('자산이 없으면 빈 배열', async () => {
      assetFind.mockResolvedValue([]);
      expect(await service.getTimeseriesRange(1, TimeseriesRange.ONE_YEAR)).toEqual([]);
    });
  });

  describe('getNetWorthAt', () => {
    it('부채를 차감한 순자산과 자산군별 합계를 돌려준다', async () => {
      query.mockResolvedValue([
        {
          id: 1,
          name: '월급통장',
          category: 'CASH',
          is_liability: false,
          value_krw: '1000',
          snapshot_date: '2026-09-30',
        },
        { id: 2, name: '적금', category: 'CASH', is_liability: false, value_krw: '500', snapshot_date: '2026-09-29' },
        { id: 3, name: '대출', category: 'DEBT', is_liability: true, value_krw: '300', snapshot_date: '2026-09-01' },
        { id: 4, name: '신규', category: 'INVESTMENT', is_liability: false, value_krw: null, snapshot_date: null },
      ]);

      const r = await service.getNetWorthAt(1, '2026-10-02');

      expect(r.netWorth).toBe(1200);
      expect(r.byCategory).toEqual([
        { category: 'CASH', isLiability: false, valueKRW: 1500 },
        { category: 'DEBT', isLiability: true, valueKRW: 300 },
        { category: 'INVESTMENT', isLiability: false, valueKRW: 0 },
      ]);
    });
  });

  describe('getPeriods', () => {
    it('30일 전 · 작년 말 · 1년 전 세 시점을 조회한다', async () => {
      query.mockResolvedValue([
        { id: 1, name: 'a', category: 'CASH', is_liability: false, value_krw: '100', snapshot_date: '2026-01-01' },
      ]);

      const periods = await service.getPeriods(1, new Date(2026, 9, 2));

      expect(periods.asOf).toBe('2026-10-02');
      expect(periods.d30.date).toBe('2026-09-02');
      expect(periods.ytd.date).toBe('2025-12-31');
      expect(periods.y1.date).toBe('2025-10-02');
      expect(periods.d30.byAsset).toEqual([{ assetId: 1, isLiability: false, valueKRW: 100 }]);
      expect(periods.d30.netWorth).toBe(100);
    });
  });

  describe('getDashboard', () => {
    it('순자산은 부채를 차감하고, 도넛에는 부채 여부를 그대로 담는다', async () => {
      assetFind.mockResolvedValue([]);
      query
        .mockResolvedValueOnce([
          { category: 'CASH', is_liability: false, total_krw: '1000' },
          { category: 'DEBT', is_liability: true, total_krw: '300' },
        ])
        .mockResolvedValue([]);

      const d = await service.getDashboard(1);

      expect(d.netWorth).toBe(700);
      expect(d.donut).toEqual([
        { category: 'CASH', isLiability: false, valueKRW: 1000 },
        { category: 'DEBT', isLiability: true, valueKRW: 300 },
      ]);
      expect(d.periods.asOf).toBe('2026-10-02');
    });
  });
});
