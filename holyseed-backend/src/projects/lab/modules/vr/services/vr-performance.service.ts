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

  /** INITIAL_BUY·DEPOSIT 체결 합 = 실제로 이 계좌에 투입한 누적 원금(별도 설정값 없이 체결 이력에서 그대로 산출). */
  private async getCumulativePrincipalSeries(): Promise<{ date: string; cumulative: number }[]> {
    const fills = await this.fillRepo.find({
      where: [{ kind: VrFillKind.INITIAL_BUY }, { kind: VrFillKind.DEPOSIT }],
      order: { fillDate: 'ASC', id: 'ASC' },
    });
    let running = 0;
    return fills.map((f) => {
      running += f.amount;
      return { date: f.fillDate, cumulative: Math.round(running * 100) / 100 };
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

  /**
   * TQQQ 평가금 vs VOO·QQQM·QLD, 전부 데이터가 겹치는 첫 날짜를 0%로 정규화해 비교.
   * ⚠️ Pool(현금)은 하루 단위로 기록되지 않아 포함하지 않음 — 순수 "보유 주식 평가금" 변화율 비교다
   * (VR 전략 전체 수익률과는 다름 — 그건 Pool까지 포함한 '계좌총액' 기준이라 이 수치보다 방어적으로 나옴).
   */
  async getBenchmarkComparison(): Promise<BenchmarkComparisonPoint[]> {
    const [tqqqSeries, benchmarkRows] = await Promise.all([
      this.getTqqqValueSeries(),
      this.benchmarkRepo.find({ order: { date: 'ASC' } }),
    ]);

    const bySymbolDate = new Map<string, Map<string, number>>();
    for (const symbol of BENCHMARK_SYMBOLS) bySymbolDate.set(symbol, new Map());
    for (const row of benchmarkRows) {
      bySymbolDate.get(row.symbol)?.set(row.date, row.closePrice);
    }

    const merged = tqqqSeries
      .map((t) => {
        const prices: Record<string, number> = {};
        for (const symbol of BENCHMARK_SYMBOLS) {
          const p = bySymbolDate.get(symbol)?.get(t.date);
          if (p == null) return null;
          prices[symbol] = p;
        }
        return { date: t.date, tqqq: t.value, prices };
      })
      .filter((r): r is { date: string; tqqq: number; prices: Record<string, number> } => r !== null);
    if (merged.length === 0) return [];

    const base = merged[0];
    return merged.map((r) => {
      const benchmarks: Record<string, number> = {};
      for (const symbol of BENCHMARK_SYMBOLS) {
        benchmarks[symbol] = Math.round((r.prices[symbol] / base.prices[symbol] - 1) * 100 * 100) / 100;
      }
      return {
        date: r.date,
        tqqqPct: Math.round((r.tqqq / base.tqqq - 1) * 100 * 100) / 100,
        benchmarks,
      };
    });
  }
}
