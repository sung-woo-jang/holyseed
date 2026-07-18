import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asset } from '../assets/entities/asset.entity';

@Injectable()
export class ComparisonService {
  constructor(
    @InjectRepository(Asset)
    private readonly assetRepo: Repository<Asset>,
  ) {}

  async getYearlyComparison(householdId: number) {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - 4 + i);

    const yearlyData = await Promise.all(
      years.map(async (year) => {
        const yearEnd = `${year}-12-31`;
        const rows: { category: string; total_krw: string }[] = await this.assetRepo.manager.query(
          `SELECT a.category,
                  COALESCE(SUM(latest.value_krw), 0) AS total_krw
           FROM ad.assets a
           LEFT JOIN LATERAL (
             SELECT value_krw
             FROM ad.asset_snapshots s
             WHERE s.asset_id = a.id
               AND s.date <= $2
             ORDER BY s.date DESC
             LIMIT 1
           ) latest ON true
           WHERE a.household_id = $1
             AND (a.archived_at IS NULL OR a.archived_at > $2::date)
           GROUP BY a.category`,
          [householdId, yearEnd],
        );

        const netWorth = rows.reduce((sum, r) => sum + Number(r.total_krw), 0);
        const byCategory = rows.map((r) => ({ category: r.category, valueKRW: Number(r.total_krw) }));
        return { year, netWorth, byCategory };
      }),
    );

    return yearlyData.map((r, i) => {
      const prev = i > 0 ? yearlyData[i - 1] : null;
      const change = prev !== null ? r.netWorth - prev.netWorth : null;
      const changeRate =
        prev && prev.netWorth !== 0
          ? Number((((r.netWorth - prev.netWorth) / Math.abs(prev.netWorth)) * 100).toFixed(1))
          : null;
      return { ...r, change, changeRate };
    });
  }
}
