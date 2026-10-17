import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TossClientService } from '@shared/toss/toss-client.service';
import { LaofusLedgerEntry } from '../entities/ledger-entry.entity';
import { computeLedgerSummary, LedgerQuote, LedgerRowInput, LedgerSummary } from '../core/ledger';

const CACHE_TTL_MS = 30_000;

const toNum = (v: string | null): number | null => (v === null || v === undefined ? null : Number(v));

/** 토스증권 원장 기반 "넣은 돈 / 평가액 / 총손익" 조회 (읽기 전용 — 현재가·환율만 토스에서 가져옴) */
@Injectable()
export class LaofusLedgerService {
  private readonly logger = new Logger(LaofusLedgerService.name);
  private cache: { at: number; data: LedgerSummary } | null = null;

  constructor(
    @InjectRepository(LaofusLedgerEntry) private readonly repo: Repository<LaofusLedgerEntry>,
    private readonly toss: TossClientService,
  ) {}

  async getSummary(): Promise<LedgerSummary> {
    if (this.cache && Date.now() - this.cache.at < CACHE_TTL_MS) return this.cache.data;

    const entries = await this.repo.find({ order: { occurredAt: 'ASC', id: 'ASC' } });
    const rows: LedgerRowInput[] = entries.map((e) => ({
      ledgerId: e.ledgerId,
      occurredAt: e.occurredAt,
      currency: e.currency,
      category: e.category,
      stockName: e.stockName,
      stockCode: e.stockCode,
      quantityDelta: toNum(e.quantityDelta),
      cashDelta: toNum(e.cashDelta),
      status: e.status,
    }));

    const quotes = new Map<string, LedgerQuote>();
    try {
      const holdings = await this.toss.getHoldingsAll();
      for (const h of holdings.items) quotes.set(h.name, { symbol: h.symbol, price: Number(h.lastPrice) });
    } catch (e) {
      this.logger.warn(`원장 평가용 보유 시세 조회 실패 — 원가로 평가: ${(e as Error).message}`);
    }

    let fxMid = 0;
    let fxRate = 0;
    try {
      const fx = await this.toss.getExchangeRate();
      fxMid = Number(fx.midRate);
      fxRate = Number(fx.rate);
    } catch (e) {
      this.logger.warn(`원장 평가용 환율 조회 실패: ${(e as Error).message}`);
    }
    if (!(fxMid > 0)) throw new Error('환율을 가져오지 못해 평가액을 계산할 수 없습니다');

    const data = computeLedgerSummary({ rows, quotes, fxMid, fxRate, now: new Date() });
    this.cache = { at: Date.now(), data };
    return data;
  }
}
