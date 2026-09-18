import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TossClientService } from '@shared/toss/toss-client.service';
import { LaofusAccountSnapshot } from '@/projects/laofus/entities/account-snapshot.entity';
import { VrFill, VrFillKind } from '../entities/vr-fill.entity';
import { BenchmarkPrice } from '../entities/benchmark-price.entity';

export interface WealthHistoryPoint {
  date: string;
  tqqqValue: number;
  cumulativePrincipal: number;
}

export interface BenchmarkComparisonPoint {
  date: string;
  tqqqPct: number;
  benchmarks: Record<string, number>;
}

const SYMBOL = 'TQQQ';
/** VOO(S&P500) · QQQM(나스닥100) · QLD(나스닥100 2배) — TQQQ(3배)와 레버리지 단계별로 비교 */
export const BENCHMARK_SYMBOLS = ['VOO', 'QQQM', 'QLD'] as const;

/** VR 누적 성과(평가금/투자원금 추이, 벤치마크 비교) 조립 — 별도 신규 데이터 수집 없이 기존 스냅샷/체결에서 파생. */
@Injectable()
export class VrPerformanceService {
  private readonly logger = new Logger('VrPerformance');

  constructor(
    private readonly toss: TossClientService,
    @InjectRepository(LaofusAccountSnapshot) private readonly snapshotRepo: Repository<LaofusAccountSnapshot>,
    @InjectRepository(VrFill) private readonly fillRepo: Repository<VrFill>,
    @InjectRepository(BenchmarkPrice) private readonly benchmarkRepo: Repository<BenchmarkPrice>,
  ) {}

  /** 매일 06:10 KST — 벤치마크 종목들의 최근 30거래일 종가를 upsert(자체 치유형: 놓친 날도 다음 실행에서 채워짐). */
  async syncBenchmarkPrices(): Promise<number> {
    let total = 0;
    for (const symbol of BENCHMARK_SYMBOLS) {
      try {
        const { candles } = await this.toss.getCandles(symbol, '1d', 30);
        const rows = candles.map((c) => ({ symbol, date: c.timestamp.slice(0, 10), closePrice: Number(c.closePrice) }));
        if (rows.length === 0) continue;
        await this.benchmarkRepo.upsert(rows, ['symbol', 'date']);
        total += rows.length;
        this.logger.log(`${symbol} 가격 동기화: ${rows.length}건 (최신 ${rows[rows.length - 1].date})`);
      } catch (e) {
        this.logger.error(`${symbol} 가격 동기화 실패: ${e instanceof Error ? e.message : e}`);
      }
    }
    return total;
  }

  /** laofus.account_snapshots(전체 계좌, 종목별 holdings_json 포함)에서 TQQQ 몫만 뽑아 일별 평가금 계열을 만든다. */
  private async getTqqqValueSeries(): Promise<{ date: string; value: number }[]> {
    const snapshots = await this.snapshotRepo.find({ order: { date: 'ASC' } });
    return snapshots
      .map((s) => {
        const holding = s.holdingsJson?.find((h) => h.symbol === SYMBOL);
        return { date: s.date, value: holding?.marketValueUsd ?? 0 };
      })
      .filter((r) => r.value > 0);
  }

  /** 날짜별 Pool 잔액 asOf 조회 — 그 날짜 이하 중 가장 최근 체결의 poolAfter(모든 체결 종류 포함). */
  private async getPoolAsOfLookup(): Promise<(date: string) => number | null> {
    const fills = await this.fillRepo.find({ order: { fillDate: 'ASC', id: 'ASC' } });
    const series = fills.map((f) => ({ date: f.fillDate, pool: f.poolAfter }));
    return (date) => {
      let result: number | null = null;
      for (const p of series) {
        if (p.date > date) break;
        result = p.pool;
      }
      return result;
    };
  }

  /** INITIAL_BUY·DEPOSIT 체결 원본(날짜·금액) — 실제 입금 스케줄. 벤치마크 DCA 시뮬레이션에도 그대로 재사용. */
  private async getContributions(): Promise<{ date: string; amount: number }[]> {
    const fills = await this.fillRepo.find({
      where: [{ kind: VrFillKind.INITIAL_BUY }, { kind: VrFillKind.DEPOSIT }],
      order: { fillDate: 'ASC', id: 'ASC' },
    });
    return fills.map((f) => ({ date: f.fillDate, amount: f.amount }));
  }

  /** INITIAL_BUY·DEPOSIT 체결 합 = 실제로 이 계좌에 투입한 누적 원금(별도 설정값 없이 체결 이력에서 그대로 산출). */
  private async getCumulativePrincipalSeries(): Promise<{ date: string; cumulative: number }[]> {
    const contributions = await this.getContributions();
    let running = 0;
    return contributions.map((c) => {
      running += c.amount;
      return { date: c.date, cumulative: Math.round(running * 100) / 100 };
    });
  }

  async getWealthHistory(): Promise<WealthHistoryPoint[]> {
    const [tqqqSeries, principalSeries] = await Promise.all([
      this.getTqqqValueSeries(),
      this.getCumulativePrincipalSeries(),
    ]);
    if (tqqqSeries.length === 0) return [];

    return tqqqSeries.map(({ date, value }) => {
      // 그 날짜 이전(또는 당일)까지 발생한 입금·초기매수 누적 중 가장 최근 값을 원금으로 사용
      let principal = 0;
      for (const p of principalSeries) {
        if (p.date > date) break;
        principal = p.cumulative;
      }
      return { date, tqqqValue: value, cumulativePrincipal: principal };
    });
  }

  /** 심볼별 종가를 "그 날짜 이하 중 가장 최근"으로 찾아준다(주말·휴장일에도 값이 비지 않도록). */
  private buildAsOfLookup(rows: BenchmarkPrice[]): (symbol: string, date: string) => number | null {
    const bySymbol = new Map<string, { date: string; price: number }[]>();
    for (const symbol of BENCHMARK_SYMBOLS) bySymbol.set(symbol, []);
    for (const row of rows) bySymbol.get(row.symbol)?.push({ date: row.date, price: row.closePrice });
    return (symbol, date) => {
      const series = bySymbol.get(symbol) ?? [];
      let result: number | null = null;
      for (const p of series) {
        if (p.date > date) break;
        result = p.price;
      }
      return result;
    };
  }

  /**
   * TQQQ(보유분 평가금 + Pool = 계좌총액) vs VOO·QQQM·QLD를 "투입 원금 대비 수익률(%)"로 비교.
   * TQQQ는 사이클마다 적립금이 들어오며 평가금이 늘어나므로, 단순 가격 정규화(첫날=0%)로 비교하면
   * 새로 들어온 원금이 수익처럼 보이는 착시가 생김 — 그래서 두 쪽 다 "그 시점까지 투입된 원금 대비
   * 지금 값이 얼마나 불었는가"로 맞춘다. 벤치마크 쪽은 TQQQ와 완전히 같은 입금 스케줄(초기매수+
   * 적립금 날짜·금액)로 그날 종가에 그대로 매수했다고 가정한 DCA 시뮬레이션.
   * TQQQ 쪽은 Pool(아직 주식으로 안 바뀐 현금)도 투자자 자산이므로 포함 — 안 그러면 매수 대기 중인
   * Pool이 많은 시기에 "돈을 잃은 것"처럼 왜곡되어 100% 즉시매수하는 벤치마크와 불공정 비교가 됨.
   */
  async getBenchmarkComparison(): Promise<BenchmarkComparisonPoint[]> {
    const [tqqqSeries, benchmarkRows, contributions, poolAsOf] = await Promise.all([
      this.getTqqqValueSeries(),
      this.benchmarkRepo.find({ order: { date: 'ASC' } }),
      this.getContributions(),
      this.getPoolAsOfLookup(),
    ]);
    const asOf = this.buildAsOfLookup(benchmarkRows);

    // 비교 시작일 = TQQQ 스냅샷과 세 벤치마크 가격이 전부 존재하는 첫 날짜
    const startPoint = tqqqSeries.find((t) => BENCHMARK_SYMBOLS.every((s) => asOf(s, t.date) !== null));
    if (!startPoint) return [];
    const startDate = startPoint.date;

    // 시작일까지 투입된 원금을 그날 일시불로 넣었다고 가정 — 그 이후 입금분만 실제 날짜에 순차 반영
    const basePrincipal = Math.round(contributions.filter((c) => c.date <= startDate).reduce((s, c) => s + c.amount, 0) * 100) / 100;
    if (basePrincipal <= 0) return [];

    const shares: Record<string, number> = {};
    for (const symbol of BENCHMARK_SYMBOLS) shares[symbol] = basePrincipal / (asOf(symbol, startDate) as number);

    const points: BenchmarkComparisonPoint[] = [];
    let contributed = basePrincipal;
    let cursor = startDate;

    for (const t of tqqqSeries) {
      if (t.date < startDate) continue;

      for (const c of contributions) {
        if (c.date > cursor && c.date <= t.date) {
          contributed = Math.round((contributed + c.amount) * 100) / 100;
          for (const symbol of BENCHMARK_SYMBOLS) {
            const p = asOf(symbol, c.date);
            if (p) shares[symbol] += c.amount / p;
          }
        }
      }
      cursor = t.date;

      const benchmarks: Record<string, number> = {};
      let missingPrice = false;
      for (const symbol of BENCHMARK_SYMBOLS) {
        const p = asOf(symbol, t.date);
        if (p == null) {
          missingPrice = true;
          break;
        }
        benchmarks[symbol] = Math.round(((shares[symbol] * p - contributed) / contributed) * 100 * 100) / 100;
      }
      if (missingPrice) continue;

      const accountValue = t.value + (poolAsOf(t.date) ?? 0);
      points.push({
        date: t.date,
        tqqqPct: Math.round(((accountValue - contributed) / contributed) * 100 * 100) / 100,
        benchmarks,
      });
    }

    return points;
  }
}
