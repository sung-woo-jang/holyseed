import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asset } from '../assets/entities/asset.entity';
import { AssetSnapshot } from '../asset-snapshots/entities/asset-snapshot.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { TimeseriesRange } from './dto/request/timeseries-range.dto';

const pad2 = (n: number) => String(n).padStart(2, '0');

/** 로컬 날짜 YYYY-MM-DD — toISOString()은 UTC로 바뀌어 한국시간 서버에서 하루 앞당겨지므로 쓰지 않는다 */
export function ymd(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** 순자산 합계에서 부채는 차감한다 (스냅샷에는 부채 잔액이 양수로 저장됨) */
export function signedValue(isLiability: boolean, value: number): number {
  return isLiability ? -value : value;
}

/**
 * 그 날짜에 보유 중이던 자산인지 — 보관(archived)한 날부터 빠진다.
 * 보관 자산을 과거 시점에서도 빼버리면 과거 순자산이 소급해서 줄고, 판 돈이 옮겨간 현금만 늘어난 것처럼 보인다.
 */
export function isHeldOn(asset: { archivedAt?: Date | null }, date: string): boolean {
  return !asset.archivedAt || ymd(new Date(asset.archivedAt)) > date;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Asset)
    private readonly assetRepo: Repository<Asset>,
    @InjectRepository(AssetSnapshot)
    private readonly snapshotRepo: Repository<AssetSnapshot>,
    @InjectRepository(Transaction)
    private readonly txRepo: Repository<Transaction>,
  ) {}

  async getDashboard(householdId: number) {
    const [donutRaw, timeseries, periods, recentTx] = await Promise.all([
      this.getLatestNetWorthByCategory(householdId),
      this.getTimeseries(householdId, null),
      this.getPeriods(householdId),
      this.txRepo.find({
        where: { householdId },
        order: { date: 'DESC', createdAt: 'DESC' },
        take: 3,
      }),
    ]);

    const netWorth = donutRaw.reduce((sum, r) => sum + signedValue(r.is_liability, Number(r.total_krw)), 0);
    const donut = donutRaw.map((r) => ({
      category: r.category,
      isLiability: r.is_liability,
      valueKRW: Number(r.total_krw),
    }));

    return { netWorth, donut, timeseries, periods, recentTx };
  }

  /** 기준 날짜(이하) 최신 스냅샷 기준으로 그 날짜 시점의 가구 총자산을 조회 */
  async getNetWorthAt(householdId: number, date: string) {
    const rows: {
      id: number;
      name: string;
      category: string;
      is_liability: boolean;
      value_krw: string | null;
      snapshot_date: string | null;
    }[] = await this.assetRepo.manager.query(
      `SELECT a.id, a.name, a.category, a.is_liability,
              latest.value_krw AS value_krw,
              latest.date AS snapshot_date
       FROM ad.assets a
       LEFT JOIN LATERAL (
         SELECT value_krw, date
         FROM ad.asset_snapshots s
         WHERE s.asset_id = a.id AND s.date <= $2
         ORDER BY s.date DESC
         LIMIT 1
       ) latest ON true
       WHERE a.household_id = $1
         -- 그 날짜 이후에 보관한 자산은 그 시점엔 갖고 있던 자산이다 (isHeldOn과 같은 기준)
         AND (a.archived_at IS NULL OR a.archived_at >= $2::date + 1)
       ORDER BY a.category, a.name`,
      [householdId, date],
    );

    const byAsset = rows.map((r) => ({
      assetId: r.id,
      name: r.name,
      category: r.category,
      isLiability: r.is_liability,
      valueKRW: r.value_krw !== null ? Number(r.value_krw) : null,
      // 기준일 이전 최신 스냅샷 날짜 (기준일에 정확히 입력이 없으면 그 전 값을 그대로 사용)
      snapshotDate: r.snapshot_date,
    }));

    const netWorth = byAsset.reduce((sum, a) => sum + signedValue(a.isLiability, a.valueKRW ?? 0), 0);

    const categoryMap = new Map<string, { category: string; isLiability: boolean; valueKRW: number }>();
    for (const a of byAsset) {
      const key = `${a.category}|${a.isLiability}`;
      const entry = categoryMap.get(key) ?? { category: a.category, isLiability: a.isLiability, valueKRW: 0 };
      entry.valueKRW += a.valueKRW ?? 0;
      categoryMap.set(key, entry);
    }

    return { date, netWorth, byAsset, byCategory: [...categoryMap.values()] };
  }

  /**
   * 기간별 비교 기준 시점의 순자산 — 30일 전 / 작년 말(올해 시작) / 1년 전.
   * 앱이 현재 값과의 차이로 기간별 증감과 자산군별 기여를 계산한다.
   */
  async getPeriods(householdId: number, now: Date = new Date()) {
    const d30 = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
    const y1 = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    const dates = { d30: ymd(d30), ytd: `${now.getFullYear() - 1}-12-31`, y1: ymd(y1) };

    const [a, b, c] = await Promise.all([
      this.getNetWorthAt(householdId, dates.d30),
      this.getNetWorthAt(householdId, dates.ytd),
      this.getNetWorthAt(householdId, dates.y1),
    ]);
    const slim = (r: Awaited<ReturnType<DashboardService['getNetWorthAt']>>) => ({
      date: r.date,
      netWorth: r.netWorth,
      byCategory: r.byCategory,
      byAsset: r.byAsset.map((x) => ({ assetId: x.assetId, isLiability: x.isLiability, valueKRW: x.valueKRW })),
    });
    return { asOf: ymd(now), d30: slim(a), ytd: slim(b), y1: slim(c) };
  }

  async getTimeseriesRange(householdId: number, range: TimeseriesRange) {
    const months =
      range === TimeseriesRange.ONE_YEAR
        ? 12
        : range === TimeseriesRange.THREE_YEAR
          ? 36
          : range === TimeseriesRange.FIVE_YEAR
            ? 60
            : null;
    return this.getTimeseries(householdId, months);
  }

  // LATERAL JOIN으로 자산별 최신 스냅샷 집계
  private async getLatestNetWorthByCategory(householdId: number) {
    return this.assetRepo.manager.query(
      `SELECT a.category,
              a.is_liability,
              COALESCE(SUM(latest.value_krw), 0) AS total_krw
       FROM ad.assets a
       LEFT JOIN LATERAL (
         SELECT value_krw
         FROM ad.asset_snapshots s
         WHERE s.asset_id = a.id
         ORDER BY s.date DESC
         LIMIT 1
       ) latest ON true
       WHERE a.household_id = $1
         AND a.archived_at IS NULL
       GROUP BY a.category, a.is_liability`,
      [householdId],
    );
  }

  private async getTimeseries(householdId: number, months: number | null) {
    // 보관한 자산도 보관 전 달까지는 순자산에 들어가야 해서 전부 가져온다
    const assets = await this.assetRepo.find({
      where: { householdId },
      select: ['id', 'isLiability', 'archivedAt'],
    });
    if (!assets.length) return [];

    const snapshots = await this.snapshotRepo
      .createQueryBuilder('s')
      .select(['s.assetId', 's.date', 's.valueKRW'])
      .where('s.assetId IN (:...ids)', { ids: assets.map((a) => a.id) })
      .orderBy('s.date', 'ASC')
      .getMany();

    return this.computeMonthly(assets, snapshots, months);
  }

  private computeMonthly(
    assets: Pick<Asset, 'id' | 'isLiability' | 'archivedAt'>[],
    snapshots: Pick<AssetSnapshot, 'assetId' | 'date' | 'valueKRW'>[],
    months: number | null,
  ) {
    // 자산별 스냅샷 배열 (날짜 ASC 정렬 유지)
    const byAsset = new Map<number, { date: string; valueKRW: number }[]>();
    for (const a of assets) byAsset.set(a.id, []);
    for (const s of snapshots) byAsset.get(s.assetId)?.push({ date: s.date, valueKRW: Number(s.valueKRW) });
    const assetById = new Map(assets.map((a) => [a.id, a]));

    const now = new Date();
    let startDate: Date;
    if (months) {
      startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
    } else if (snapshots.length > 0) {
      const earliest = snapshots[0].date;
      startDate = new Date(Number(earliest.slice(0, 4)), Number(earliest.slice(5, 7)) - 1, 1);
    } else {
      return [];
    }

    const result: { month: string; netWorth: number }[] = [];
    const cur = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

    while (cur.getTime() <= new Date(now.getFullYear(), now.getMonth(), 1).getTime()) {
      const yr = cur.getFullYear();
      const mo = cur.getMonth();
      const monthEnd = `${yr}-${pad2(mo + 1)}-${pad2(new Date(yr, mo + 1, 0).getDate())}`;

      let netWorth = 0;
      for (const [assetId, snaps] of byAsset) {
        const asset = assetById.get(assetId)!;
        if (!isHeldOn(asset, monthEnd)) continue;
        // 이분탐색 없이 끝에서부터 찾기 (배열 정렬 ASC)
        for (let i = snaps.length - 1; i >= 0; i--) {
          if (snaps[i].date <= monthEnd) {
            netWorth += signedValue(asset.isLiability, snaps[i].valueKRW);
            break;
          }
        }
      }

      result.push({ month: `${yr}-${String(mo + 1).padStart(2, '0')}`, netWorth });
      cur.setMonth(cur.getMonth() + 1);
    }

    return result;
  }
}
