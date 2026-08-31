import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { TossClientService } from '@shared/toss/toss-client.service';
import { BacktestPrice } from './entities';
import type { BacktestSymbol } from './dto/request';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function sinceDateFor(years: number): string {
  const d = new Date();
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

  /** 캐시에 부족한 구간이 있으면 토스 API로 채운 뒤, 요청 기간의 일봉 종가를 오름차순으로 반환 */
  async getPrices(symbol: BacktestSymbol, years: number): Promise<Array<{ date: string; close: number }>> {
    const sinceDate = sinceDateFor(years);

    const earliest = await this.priceRepo.findOne({ where: { symbol }, order: { date: 'ASC' } });
    if (!earliest || earliest.date > sinceDate) {
      await this.backfill(symbol, sinceDate);
    }

    const rows = await this.priceRepo.find({
      where: { symbol, date: MoreThanOrEqual(sinceDate) },
      order: { date: 'ASC' },
    });
    return rows.map((r) => ({ date: r.date, close: r.close }));
  }

  /** 토스 캔들 API를 nextBefore 커서로 페이지네이션해 sinceDate까지 수집 후 upsert */
  private async backfill(symbol: string, sinceDate: string): Promise<void> {
    const collected = new Map<string, number>();
    let before: string | undefined;

    for (let page = 0; page < 30; page++) {
      const { candles, nextBefore } = await this.toss.getCandles(symbol, '1d', 200, before);
      if (!candles.length) break;
      for (const c of candles) {
        collected.set(c.timestamp.slice(0, 10), Number(c.closePrice));
      }
      const oldest = candles[candles.length - 1];
      if (oldest.timestamp.slice(0, 10) <= sinceDate || !nextBefore) break;
      before = nextBefore;
      await sleep(300);
    }

    if (collected.size === 0) return;
    const entities = [...collected.entries()].map(([date, close]) => this.priceRepo.create({ symbol, date, close }));
    await this.priceRepo.upsert(entities, ['symbol', 'date']);
    this.logger.log(`백필 완료: ${symbol} ${entities.length}개 (${sinceDate} 이후)`);
  }
}
