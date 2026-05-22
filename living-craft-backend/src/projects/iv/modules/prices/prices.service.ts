import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import YahooFinance from 'yahoo-finance2'
import { IvPrice } from '../../entities/iv-price.entity'
import { IvState } from '../../entities/iv-state.entity'

const yf = new YahooFinance()

const TICKERS = ['TQQQ', 'SOXL']

@Injectable()
export class PricesService {
  private readonly logger = new Logger(PricesService.name)

  constructor(
    @InjectRepository(IvPrice)
    private readonly priceRepo: Repository<IvPrice>,
    @InjectRepository(IvState)
    private readonly stateRepo: Repository<IvState>,
  ) {}

  /** 평일 ET 16:30 (장 마감 30분 후) 자동 fetch */
  @Cron('30 16 * * 1-5', { timeZone: 'America/New_York' })
  async cronFetchAll() {
    this.logger.log('시세 자동 갱신 시작')
    for (const ticker of TICKERS) {
      try {
        await this.fetchAndSave(ticker)
      } catch (e) {
        this.logger.error(`${ticker} 시세 갱신 실패: ${e.message}`)
      }
    }
  }

  async fetchAndSave(ticker: string): Promise<IvPrice> {
    // 과거 60거래일 히스토리 bulk seed
    await this.seedHistory(ticker)

    const result = await yf.quote(ticker)
    const closePrice: number = result.regularMarketPrice ?? result.regularMarketPreviousClose
    const priceDate = new Date().toISOString().slice(0, 10)

    await this.priceRepo.upsert(
      { ticker, priceDate, closePrice, fetchedAt: new Date() },
      { conflictPaths: ['ticker', 'priceDate'] },
    )

    // recent_closes 갱신 (직전 5거래일)
    const recent = await this.priceRepo.find({
      where: { ticker },
      order: { priceDate: 'DESC' },
      take: 5,
    })
    const recentCloses = recent.map((r) => r.closePrice).reverse()

    await this.stateRepo.createQueryBuilder()
      .update(IvState)
      .set({ lastClose: closePrice, recentCloses })
      .where('strategy_id IN (SELECT id FROM iv.strategies WHERE ticker = :ticker)', { ticker })
      .execute()

    this.logger.log(`${ticker} 종가 갱신: $${closePrice} (${priceDate})`)

    const saved = await this.priceRepo.findOne({ where: { ticker, priceDate } })
    return saved!
  }

  /** Yahoo chart API로 과거 3년 종가 bulk upsert */
  private async seedHistory(ticker: string): Promise<void> {
    try {
      const period1 = new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000)
      const chart = await yf.chart(ticker, { period1, interval: '1d' })
      const quotes = chart.quotes ?? []

      const rows = quotes
        .filter((q) => q.close != null && q.date != null)
        .map((q) => ({
          ticker,
          priceDate: q.date.toISOString().slice(0, 10),
          closePrice: q.close as number,
          fetchedAt: new Date(),
        }))

      if (rows.length > 0) {
        await this.priceRepo.upsert(rows, { conflictPaths: ['ticker', 'priceDate'] })
        this.logger.log(`${ticker} 히스토리 ${rows.length}개 upsert`)
      }
    } catch (e) {
      this.logger.warn(`${ticker} 히스토리 seed 실패: ${e.message}`)
    }
  }

  async getLatest(ticker: string): Promise<IvPrice | null> {
    return this.priceRepo.findOne({ where: { ticker }, order: { priceDate: 'DESC' } })
  }

  async getHistory(ticker: string, days = 800): Promise<IvPrice[]> {
    return this.priceRepo.find({
      where: { ticker },
      order: { priceDate: 'DESC' },
      take: days,
    })
  }
}
