import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import YahooFinance from 'yahoo-finance2'
import { IvPrice } from '../../entities/iv-price.entity'
import { IvState } from '../../entities/iv-state.entity'
import { IvStrategy } from '../../entities/iv-strategy.entity'
import { PlansService } from '../plans/plans.service'

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
    @InjectRepository(IvStrategy)
    private readonly strategyRepo: Repository<IvStrategy>,
    private readonly plansService: PlansService,
  ) {}

  /** 평일 ET 16:30 (장 마감 30분 후) 자동 fetch — TQQQ/SOXL 병렬 */
  @Cron('30 16 * * 1-5', { timeZone: 'America/New_York' })
  async cronFetchAll() {
    this.logger.log('시세 자동 갱신 시작')
    await Promise.all(
      TICKERS.map(async (ticker) => {
        try {
          await this.fetchAndSave(ticker)
        } catch (e) {
          this.logger.error(`${ticker} 시세 갱신 실패: ${e.message}`)
        }
      }),
    )
  }

  async fetchAndSave(ticker: string): Promise<IvPrice> {
    // 증분 히스토리 fetch (DB 최신 날짜 이후만)
    await this.seedHistory(ticker)

    const result = await yf.quote(ticker)
    const closePrice: number = result.regularMarketPrice ?? result.regularMarketPreviousClose
    const highPrice: number | null = result.regularMarketDayHigh ?? null
    const priceDate = new Date().toISOString().slice(0, 10)

    await this.priceRepo.upsert(
      { ticker, priceDate, closePrice, highPrice, fetchedAt: new Date() },
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

    // 해당 ticker 전략의 오늘 plan 즉시 재생성
    const strategies = await this.strategyRepo.find({ where: { ticker } })
    await Promise.all(strategies.map((s) => this.plansService.upsertPlan(s.id, priceDate)))

    const saved = await this.priceRepo.findOne({ where: { ticker, priceDate } })
    return saved!
  }

  /** Yahoo chart API로 증분 종가 upsert (DB 최신 날짜 다음 날부터만 fetch) */
  private async seedHistory(ticker: string): Promise<void> {
    try {
      const latest = await this.priceRepo.findOne({
        where: { ticker },
        order: { priceDate: 'DESC' },
      })

      const period1 = latest
        ? (() => { const d = new Date(latest.priceDate); d.setDate(d.getDate() + 1); return d })()
        : new Date('2010-01-01')

      const today = new Date()
      if (period1 > today) {
        this.logger.log(`${ticker} 히스토리 이미 최신 (${latest?.priceDate})`)
        return
      }

      const chart = await yf.chart(ticker, { period1, interval: '1d' })
      const quotes = chart.quotes ?? []

      const rows = quotes
        .filter((q) => q.close != null && q.date != null)
        .map((q) => ({
          ticker,
          priceDate: q.date.toISOString().slice(0, 10),
          closePrice: q.close as number,
          highPrice: q.high ?? null,
          fetchedAt: new Date(),
        }))

      if (rows.length > 0) {
        await this.priceRepo.upsert(rows, { conflictPaths: ['ticker', 'priceDate'] })
        this.logger.log(`${ticker} 히스토리 ${rows.length}개 upsert (from ${period1.toISOString().slice(0, 10)})`)
      } else {
        this.logger.log(`${ticker} 히스토리 신규 데이터 없음`)
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
