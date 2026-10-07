import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asset } from '../assets/entities/asset.entity';
import { AssetSnapshot } from '../asset-snapshots/entities/asset-snapshot.entity';
import { Transaction, TransactionType } from '../transactions/entities/transaction.entity';
import { isHeldOn, signedValue, ymd } from '../dashboard/dashboard.service';

/** 연도별 비교에 보여주는 최대 연도 수 (기록 시작 연도 이전은 애초에 내보내지 않는다) */
const MAX_YEARS = 5;

/** 연말과 이 일수보다 더 떨어진 스냅샷은 연말 값으로 믿기 어렵다 — 월 1회만 기록해도 넘지 않는 간격 */
export const STALE_DAYS = 31;

type AssetRow = Pick<Asset, 'id' | 'name' | 'category' | 'isLiability' | 'archivedAt'>;
type SnapRow = { assetId: number; date: string; valueKRW: number };
type TxRow = { date: string; type: TransactionType; amount: number };

export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

/** 기준 순자산 대비 증가율(%) — 기준이 0 이하면 비율이 의미 없어 null */
export function growthRate(base: number, growth: number): number | null {
  if (base <= 0) return null;
  return Number(((growth / base) * 100).toFixed(1));
}

/** 날짜 ASC로 정렬된 스냅샷 중 그 날짜 이하의 마지막 것 */
function latestOnOrBefore(snaps: SnapRow[], date: string): SnapRow | null {
  for (let i = snaps.length - 1; i >= 0; i--) {
    if (snaps[i].date <= date) return snaps[i];
  }
  return null;
}

/**
 * 연도별 순자산 비교.
 *
 * - 각 연도의 순자산 = 그해 말(올해는 오늘) 기준, 그때 보유 중이던 자산별 마지막 스냅샷 합 (부채는 차감)
 * - 작년 말엔 기록이 없던 자산(그해 처음 기록한 자산)은 '신규 편입'으로 따로 떼고, 증가율에서 뺀다.
 *   기록을 늦게 시작한 계좌의 잔액 전체가 그해 증가로 잡혀 증가율이 수십 배로 부풀던 문제 대응
 * - 증가율의 유일한 계산처 — 앱·MCP 모두 이 값을 그대로 쓴다
 */
export function computeYearly(assets: AssetRow[], snapshots: SnapRow[], txs: TxRow[], today: string) {
  if (!snapshots.length) return [];

  const snapsByAsset = new Map<number, SnapRow[]>();
  for (const a of assets) snapsByAsset.set(a.id, []);
  const sorted = [...snapshots].sort((x, y) => x.date.localeCompare(y.date));
  for (const s of sorted) snapsByAsset.get(s.assetId)?.push(s);

  const earliestYear = Number(sorted[0].date.slice(0, 4));
  const currentYear = Number(today.slice(0, 4));
  const firstYear = Math.max(earliestYear, currentYear - MAX_YEARS + 1);

  // 그 날짜 기준 자산별 값 — 보유 중이 아니거나 기록이 없으면 null
  const positionsAt = (date: string) =>
    assets.map((asset) => {
      const snap = isHeldOn(asset, date) ? latestOnOrBefore(snapsByAsset.get(asset.id) ?? [], date) : null;
      return { asset, snap, value: snap ? signedValue(asset.isLiability, snap.valueKRW) : null };
    });
  const sumValues = (ps: ReturnType<typeof positionsAt>) => ps.reduce((s, p) => s + (p.value ?? 0), 0);

  const sortedTxs = [...txs].sort((x, y) => x.date.localeCompare(y.date));
  const earliestTx = sortedTxs[0]?.date ?? null;

  const rows = [];
  for (let year = firstYear; year <= currentYear; year++) {
    const isCurrentYear = year === currentYear;
    const asOf = isCurrentYear ? today : `${year}-12-31`;
    const prevDate = `${year - 1}-12-31`;
    const cur = positionsAt(asOf);
    const netWorth = sumValues(cur);

    const byCategoryMap = new Map<string, number>();
    for (const p of cur) {
      if (p.value == null) continue;
      byCategoryMap.set(p.asset.category, (byCategoryMap.get(p.asset.category) ?? 0) + p.value);
    }
    const byCategory = [...byCategoryMap].map(([category, valueKRW]) => ({ category, valueKRW }));

    const staleAssets = cur
      .filter((p) => p.snap && daysBetween(p.snap.date, asOf) > STALE_DAYS)
      .map((p) => ({
        assetId: p.asset.id,
        name: p.asset.name,
        snapshotDate: p.snap!.date,
        daysBefore: daysBetween(p.snap!.date, asOf),
      }))
      .sort((x, y) => y.daysBefore - x.daysBefore);

    const base = { year, asOf, isCurrentYear, netWorth, byCategory, staleAssets };

    // 기록 시작 연도는 비교할 작년 말이 없다
    if (year - 1 < earliestYear) {
      rows.push({
        ...base,
        prevNetWorth: null,
        change: null,
        newAssetsKRW: 0,
        newAssets: [],
        growth: null,
        growthRate: null,
        contributions: [],
        flows: null,
      });
      continue;
    }

    const prev = positionsAt(prevDate);
    const prevNetWorth = sumValues(prev);
    const change = netWorth - prevNetWorth;

    const newAssets: { assetId: number; name: string; valueKRW: number; firstSnapshotDate: string }[] = [];
    const contribMap = new Map<string, number>();
    cur.forEach((c, i) => {
      const p = prev[i];
      if (p.value == null && c.value == null) return;
      if (p.value == null) {
        newAssets.push({
          assetId: c.asset.id,
          name: c.asset.name,
          valueKRW: c.value!,
          firstSnapshotDate: snapsByAsset.get(c.asset.id)![0].date,
        });
        return;
      }
      const delta = (c.value ?? 0) - p.value;
      contribMap.set(c.asset.category, (contribMap.get(c.asset.category) ?? 0) + delta);
    });
    const newAssetsKRW = newAssets.reduce((s, a) => s + a.valueKRW, 0);
    const growth = change - newAssetsKRW;
    const contributions = [...contribMap]
      .filter(([, v]) => Math.abs(v) >= 1)
      .map(([category, valueKRW]) => ({ category, valueKRW }))
      .sort((x, y) => Math.abs(y.valueKRW) - Math.abs(x.valueKRW));

    // 가계부가 작년 말 이전부터 있어야 그해 수입·지출 합계를 믿을 수 있다 (홈의 hasFlowCoverage와 같은 기준)
    let flows: { income: number; expense: number; saved: number; other: number } | null = null;
    if (earliestTx && earliestTx <= prevDate) {
      let income = 0;
      let expense = 0;
      for (const t of sortedTxs) {
        if (t.date <= prevDate || t.date > asOf) continue;
        if (t.type === TransactionType.INCOME) income += t.amount;
        else expense += t.amount;
      }
      const saved = income - expense;
      flows = { income, expense, saved, other: growth - saved };
    }

    rows.push({
      ...base,
      prevNetWorth,
      change,
      newAssetsKRW,
      newAssets: newAssets.sort((x, y) => Math.abs(y.valueKRW) - Math.abs(x.valueKRW)),
      growth,
      growthRate: growthRate(prevNetWorth, growth),
      contributions,
      flows,
    });
  }
  return rows;
}

@Injectable()
export class ComparisonService {
  constructor(
    @InjectRepository(Asset)
    private readonly assetRepo: Repository<Asset>,
    @InjectRepository(AssetSnapshot)
    private readonly snapshotRepo: Repository<AssetSnapshot>,
    @InjectRepository(Transaction)
    private readonly txRepo: Repository<Transaction>,
  ) {}

  async getYearlyComparison(householdId: number, now: Date = new Date()) {
    // 보관한 자산도 보관 전 연도에는 들어가야 해서 전부 가져온다
    const assets = await this.assetRepo.find({
      where: { householdId },
      select: ['id', 'name', 'category', 'isLiability', 'archivedAt'],
    });
    if (!assets.length) return [];

    const [snapshots, txs] = await Promise.all([
      this.snapshotRepo
        .createQueryBuilder('s')
        .select(['s.assetId', 's.date', 's.valueKRW'])
        .where('s.assetId IN (:...ids)', { ids: assets.map((a) => a.id) })
        .getMany(),
      this.txRepo.find({ where: { householdId }, select: ['date', 'type', 'amount'] }),
    ]);

    return computeYearly(
      assets,
      snapshots.map((s) => ({ assetId: s.assetId, date: s.date, valueKRW: Number(s.valueKRW) })),
      txs.map((t) => ({ date: t.date, type: t.type, amount: Number(t.amount) })),
      ymd(now),
    );
  }
}
