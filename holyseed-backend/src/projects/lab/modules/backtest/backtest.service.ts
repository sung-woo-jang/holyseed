import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { TossClientService } from '@shared/toss/toss-client.service';
import { BacktestPrice } from './entities';
import type { BacktestSymbol } from './dto/request';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

/** untilDate(기본 오늘) 기준으로 years년 전 날짜 계산 */
function sinceDateFor(years: number, untilDate: string): string {
  const d = new Date(`${untilDate}T00:00:00Z`);
  d.setUTCFullYear(d.getUTCFullYear() - years);
  return d.toISOString().slice(0, 10);
}

@Injectable()
export class BacktestService {
  private readonly logger = new Logger(BacktestService.name);

  constructor(
    private readonly toss: TossClientService,
    @InjectRepository(BacktestPrice)
    private readonly priceRepo: Repository<BacktestPrice>,
  ) {}

  /**
   * 캐시에 부족한 구간이 있으면 토스 API로 채운 뒤, 요청 기간의 일봉 종가를 오름차순으로 반환.
   * untilDate를 주면 "그 시점까지 투자했다면"을 시뮬레이션할 수 있도록 종료 시점을 오늘이 아닌
   * 과거로 고정 — 최근 급등장 구간을 빼고 백테스트하고 싶을 때 사용.
   */
  async getPrices(
    symbol: BacktestSymbol,
    years: number,
    untilDate?: string,
  ): Promise<Array<{ date: string; close: number }>> {
    const endDate = untilDate ?? todayStr();
    const sinceDate = sinceDateFor(years, endDate);

    // 백필(토스 API 페이지네이션)은 항상 "오늘" 기준으로 과거를 채우므로, untilDate가 과거여도
    // 캐시 자체는 오늘까지 채워둔 뒤 조회 시점에 endDate로 잘라내는 방식 — 백필 로직 자체는
    // untilDate를 몰라도 됨 (sinceDate까지만 확보되면 그 안의 어떤 구간이든 DB에서 바로 잘라줄 수 있음).
    const earliest = await this.priceRepo.findOne({ where: { symbol }, order: { date: 'ASC' } });
    // earliest가 "종목의 진짜 최초 캔들"로 확인된 경우, sinceDate보다 늦더라도 더 과거 데이터가
    // 없는 게 확정된 것(예: 상장 5년 된 QQQM에 15년치 요청)이므로 재백필을 스킵해 매번 토스 API를
    // 다시 훑는 걸 방지 — 이게 없으면 상장 이력이 짧은 종목은 캐싱돼 있어도 요청마다 느려짐.
    if (!earliest || (earliest.date > sinceDate && !earliest.isEarliest)) {
      await this.backfill(symbol, sinceDate);
    }

    const rows = await this.priceRepo.find({
      where: { symbol, date: Between(sinceDate, endDate) },
      order: { date: 'ASC' },
    });
    return rows.map((r) => ({ date: r.date, close: r.close }));
  }

  /** 토스 캔들 API를 nextBefore 커서로 페이지네이션해 sinceDate까지 수집 후 upsert */
  private async backfill(symbol: string, sinceDate: string): Promise<void> {
    const collected = new Map<string, number>();
    let before: string | undefined;
    let exhausted = false;

    for (let page = 0; page < 30; page++) {
      const { candles, nextBefore } = await this.toss.getCandles(symbol, '1d', 200, before);
      if (!candles.length) break;
      for (const c of candles) {
        collected.set(c.timestamp.slice(0, 10), Number(c.closePrice));
      }
      const oldest = candles[candles.length - 1];
      if (!nextBefore) {
        exhausted = true;
        break;
      }
      if (oldest.timestamp.slice(0, 10) <= sinceDate) break;
      before = nextBefore;
      await sleep(300);
    }

    if (collected.size === 0) return;
    const earliestDate = [...collected.keys()].sort()[0];
    const entities = [...collected.entries()].map(([date, close]) =>
      this.priceRepo.create({ symbol, date, close, isEarliest: exhausted && date === earliestDate }),
    );
    await this.priceRepo.upsert(entities, ['symbol', 'date']);
    this.logger.log(`백필 완료: ${symbol} ${entities.length}개 (${sinceDate} 이후${exhausted ? ', 최초 캔들까지 도달' : ''})`);
  }
}
