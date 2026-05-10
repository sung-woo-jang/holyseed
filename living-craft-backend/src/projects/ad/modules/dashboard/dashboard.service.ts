import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Asset } from '../assets/entities/asset.entity';
import { AssetSnapshot } from '../asset-snapshots/entities/asset-snapshot.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { TimeseriesRange } from './dto/request/timeseries-range.dto';

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
    const [donutRaw, timeseries, recentTx] = await Promise.all([
      this.getLatestNetWorthByCategory(householdId),
      this.getTimeseries(householdId, 60),
      this.txRepo.find({
        where: { householdId },
        order: { date: 'DESC', createdAt: 'DESC' },
        take: 3,
      }),
    ]);

    const netWorth = donutRaw.reduce((sum, r) => sum + Number(r.total_krw), 0);
    const donut = donutRaw.map((r) => ({
      category: r.category,
      isLiability: r.is_liability,
      valueKRW: Number(r.total_krw),
    }));

    return { netWorth, donut, timeseries, recentTx };
  }

  async getTimeseriesRange(householdId: number, range: TimeseriesRange) {
    const months =
      range === TimeseriesRange.ONE_YEAR ? 12
      : range === TimeseriesRange.THREE_YEAR ? 36
      : range === TimeseriesRange.FIVE_YEAR ? 60
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
    const assets = await this.assetRepo.find({
      where: { householdId, archivedAt: IsNull() },
      select: ['id'],
    });
    if (!assets.length) return [];

    const assetIds = assets.map((a) => a.id);
    const snapshots = await this.snapshotRepo
      .createQueryBuilder('s')
      .select(['s.assetId', 's.date', 's.valueKRW'])
      .where('s.assetId IN (:...ids)', { ids: assetIds })
      .orderBy('s.date', 'ASC')
      .getMany();

    return this.computeMonthly(assetIds, snapshots, months);
  }

  private computeMonthly(
    assetIds: number[],
    snapshots: Pick<AssetSnapshot, 'assetId' | 'date' | 'valueKRW'>[],
    months: number | null,
  ) {
    // 자산별 스냅샷 배열 (날짜 ASC 정렬 유지)
    const byAsset = new Map<number, { date: string; valueKRW: number }[]>();
    for (const id of assetIds) byAsset.set(id, []);
    for (const s of snapshots) byAsset.get(s.assetId)?.push({ date: s.date, valueKRW: Number(s.valueKRW) });

    const now = new Date();
    let startDate: Date;
    if (months) {
      startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
    } else if (snapshots.length > 0) {
      const earliest = snapshots[0].date;
      startDate = new Date(earliest.slice(0, 7) + '-01');
    } else {
      return [];
    }

    const result: { month: string; netWorth: number }[] = [];
    const cur = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

    while (cur.getTime() <= new Date(now.getFullYear(), now.getMonth(), 1).getTime()) {
      const yr = cur.getFullYear();
      const mo = cur.getMonth();
      const monthEnd = new Date(yr, mo + 1, 0).toISOString().split('T')[0];

      let netWorth = 0;
      for (const [, snaps] of byAsset) {
        // 이분탐색 없이 끝에서부터 찾기 (배열 정렬 ASC)
        for (let i = snaps.length - 1; i >= 0; i--) {
          if (snaps[i].date <= monthEnd) {
            netWorth += snaps[i].valueKRW;
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
