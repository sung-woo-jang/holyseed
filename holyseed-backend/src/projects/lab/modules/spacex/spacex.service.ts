import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SpacexEntry, SpacexState } from './entities';
import { CreateSpacexEntryDto } from './dto/request';

@Injectable()
export class SpacexService {
  constructor(
    @InjectRepository(SpacexEntry) private readonly entryRepo: Repository<SpacexEntry>,
    @InjectRepository(SpacexState) private readonly stateRepo: Repository<SpacexState>,
  ) {}

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

    return {
      startDate,
      closedAt: state.closedAt,
      totalPrincipal,
      daysCount,
      avgPrice,
      lastPrice,
      profitPct,
      entries: [...entries].reverse(),
    };
  }
}
