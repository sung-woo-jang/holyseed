import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TossClientService } from '@shared/toss/toss-client.service';
import { SpacexEntry, SpacexState } from './entities';
import { CreateSpacexEntryDto } from './dto/request';

const SYMBOL = 'SPCX';

function kstDate(d: Date = new Date()): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(d);
}

@Injectable()
export class SpacexService {
  private readonly logger = new Logger('Spacex');
  private priceCache: { price: number; at: number } | null = null;

  constructor(
    @InjectRepository(SpacexEntry) private readonly entryRepo: Repository<SpacexEntry>,
    @InjectRepository(SpacexState) private readonly stateRepo: Repository<SpacexState>,
    private readonly toss: TossClientService,
  ) {}

  /** 실시간 시세 — 60초 캐시로 rate limit 보호(다른 lab 모듈과 동일 패턴) */
  private async getLivePrice(): Promise<number> {
    if (this.priceCache && Date.now() - this.priceCache.at < 60_000) return this.priceCache.price;
    const p = await this.toss.getPrice(SYMBOL);
    this.priceCache = { price: Number(p.lastPrice), at: Date.now() };
    return this.priceCache.price;
  }

  /**
   * 토스에서 SPCX(스페이스X) 체결 내역을 가져와 아직 기록 안 된 것만 채워 넣는다.
   * orderId로 중복을 막기 때문에 몇 번을 돌려도, 스케줄러가 겹쳐 돌아도 안전.
   */
  async syncFromToss(): Promise<{ synced: number }> {
    const { orders } = await this.toss.getOrders('CLOSED', { symbol: SYMBOL, limit: 100 });
    const filled = orders.filter((o) => o.status === 'FILLED' && o.execution.filledAt);
    const existingIds = new Set(
      (await this.entryRepo.find({ where: {}, select: ['orderId'] }))
        .map((e) => e.orderId)
        .filter((id): id is string => id !== null),
    );

    let synced = 0;
    for (const order of filled) {
      if (existingIds.has(order.orderId)) continue;
      await this.entryRepo.save(
        this.entryRepo.create({
          date: kstDate(new Date(order.execution.filledAt as string)),
          amount: Number(order.execution.filledAmount),
          price: order.execution.averageFilledPrice !== null ? Number(order.execution.averageFilledPrice) : null,
          quantity: Number(order.execution.filledQuantity),
          isRebalance: false,
          note: null,
          orderId: order.orderId,
        }),
      );
      synced++;
    }
    if (synced > 0) this.logger.log(`토스 SPCX 체결 ${synced}건 동기화`);
    return { synced };
  }

  private async getOrCreateState(): Promise<SpacexState> {
    const [existing] = await this.stateRepo.find({ take: 1 });
    if (existing) return existing;
    return this.stateRepo.save(this.stateRepo.create({ closedAt: null }));
  }

  async createEntry(dto: CreateSpacexEntryDto): Promise<SpacexEntry> {
    const quantity = dto.quantity ?? (dto.price ? dto.amount / dto.price : null);
    return this.entryRepo.save(
      this.entryRepo.create({
        date: dto.date,
        amount: dto.amount,
        price: dto.price ?? null,
        quantity,
        isRebalance: dto.isRebalance ?? false,
        note: dto.note ?? null,
      }),
    );
  }

  async close(date?: string): Promise<SpacexState> {
    const state = await this.getOrCreateState();
    state.closedAt = date ?? new Date().toISOString().slice(0, 10);
    return this.stateRepo.save(state);
  }

  async getStatus() {
    const [entries, state] = await Promise.all([
      this.entryRepo.find({ order: { date: 'ASC', id: 'ASC' } }),
      this.getOrCreateState(),
    ]);

    const startDate = entries.length > 0 ? entries[0].date : null;
    const totalPrincipal = entries.reduce((sum, e) => sum + Number(e.amount), 0);
    const daysCount = new Set(entries.map((e) => e.date)).size;

    const priced = entries.filter((e) => e.price !== null && e.quantity !== null && Number(e.quantity) > 0);
    const qtySum = priced.reduce((sum, e) => sum + Number(e.quantity), 0);
    const avgPrice =
      qtySum > 0 ? priced.reduce((sum, e) => sum + Number(e.price) * Number(e.quantity), 0) / qtySum : null;

    const lastPriced = [...entries].reverse().find((e) => e.price !== null);
    const lastPrice = lastPriced ? Number(lastPriced.price) : null;
    const profitPct = avgPrice !== null && lastPrice !== null ? (lastPrice / avgPrice - 1) * 100 : null;

    // 총 매수원금(넣은 돈) vs 현재 평가금액(지금 팔면 얼마) — 시세 조회 실패해도 나머지 상태는 정상 반환
    let currentPrice: number | null = null;
    let currentValue: number | null = null;
    try {
      currentPrice = await this.getLivePrice();
      currentValue = qtySum > 0 ? qtySum * currentPrice : null;
    } catch (e) {
      this.logger.warn(`실시간 시세 조회 실패: ${(e as Error).message}`);
    }

    return {
      startDate,
      closedAt: state.closedAt,
      totalPrincipal,
      daysCount,
      avgPrice,
      lastPrice,
      profitPct,
      currentPrice,
      currentValue,
      entries: [...entries].reverse(),
    };
  }
}
