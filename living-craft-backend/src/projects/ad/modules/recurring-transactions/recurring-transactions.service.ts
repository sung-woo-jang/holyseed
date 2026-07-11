import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { RecurringTransaction, RecurringFrequency } from './entities/recurring-transaction.entity';
import { Transaction, TransactionType } from '../transactions/entities/transaction.entity';
import { CreateRecurringDto } from './dto/request/create-recurring.dto';

export interface MissedOccurrence {
  recurringId: number;
  date: string;
  type: TransactionType;
  amount: number;
  title: string | null;
  memo: string | null;
  categoryId: number | null;
  fromAssetId: number | null;
  toAssetId: number | null;
}

@Injectable()
export class RecurringTransactionsService {
  constructor(
    @InjectRepository(RecurringTransaction)
    private readonly recurringRepo: Repository<RecurringTransaction>,
    @InjectRepository(Transaction)
    private readonly txRepo: Repository<Transaction>,
  ) {}

  async findByHousehold(householdId: number): Promise<RecurringTransaction[]> {
    return this.recurringRepo.find({ where: { householdId }, order: { createdAt: 'ASC' } });
  }

  async findOne(id: number): Promise<RecurringTransaction> {
    const r = await this.recurringRepo.findOne({ where: { id } });
    if (!r) throw new NotFoundException('정기거래를 찾을 수 없습니다.');
    return r;
  }

  async create(householdId: number, dto: CreateRecurringDto): Promise<RecurringTransaction> {
    const r = this.recurringRepo.create({ ...dto, householdId, active: true });
    return this.recurringRepo.save(r);
  }

  async update(id: number, dto: Partial<CreateRecurringDto>): Promise<RecurringTransaction> {
    const r = await this.findOne(id);
    Object.assign(r, dto);
    return this.recurringRepo.save(r);
  }

  async toggle(id: number): Promise<RecurringTransaction> {
    const r = await this.findOne(id);
    r.active = !r.active;
    return this.recurringRepo.save(r);
  }

  async delete(id: number): Promise<void> {
    const r = await this.findOne(id);
    await this.recurringRepo.remove(r);
  }

  async runDailyAll(): Promise<void> {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const todayDay = today.getDate();
    const todayMonth = today.getMonth() + 1;

    const actives = await this.recurringRepo.find({ where: { active: true } });

    for (const r of actives) {
      try {
        if (r.lastRunDate === todayStr) continue;
        if (r.endDate && r.endDate < todayStr) continue;
        if (r.startDate > todayStr) continue;

        const shouldRun =
          r.frequency === RecurringFrequency.MONTHLY
            ? r.dayOfMonth === todayDay
            : r.dayOfMonth === todayDay && r.monthOfYear === todayMonth;

        if (!shouldRun) continue;

        await this.generateTransaction(r);
        r.lastRunDate = todayStr;
        await this.recurringRepo.save(r);
      } catch (_) {
        // 개별 실패가 전체 cron 중단 방지
      }
    }
  }

  async findMissed(householdId: number, fromDate?: string): Promise<MissedOccurrence[]> {
    const today = new Date().toISOString().split('T')[0];
    const actives = await this.recurringRepo.find({ where: { householdId, active: true } });
    if (actives.length === 0) return [];

    const existing = await this.txRepo.find({
      where: { recurringTemplateId: In(actives.map((r) => r.id)) },
      select: ['recurringTemplateId', 'date'],
    });
    const existingKeys = new Set(existing.map((t) => `${t.recurringTemplateId}:${t.date}`));

    const missed: MissedOccurrence[] = [];
    for (const r of actives) {
      for (const date of this.computeDueDates(r, fromDate, today)) {
        if (existingKeys.has(`${r.id}:${date}`)) continue;
        missed.push({
          recurringId: r.id,
          date,
          type: r.type,
          amount: Number(r.amount),
          title: r.title ?? null,
          memo: r.memo ?? null,
          categoryId: r.categoryId ?? null,
          fromAssetId: r.fromAssetId ?? null,
          toAssetId: r.toAssetId ?? null,
        });
      }
    }
    return missed.sort((a, b) => a.date.localeCompare(b.date) || a.recurringId - b.recurringId);
  }

  async applyMissed(householdId: number, items: { recurringId: number; date: string }[]): Promise<number> {
    const missed = await this.findMissed(householdId);
    const missedByKey = new Map(missed.map((m) => [`${m.recurringId}:${m.date}`, m]));
    const today = new Date().toISOString().split('T')[0];

    let created = 0;
    const seen = new Set<string>();
    for (const item of items) {
      const key = `${item.recurringId}:${item.date}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const m = missedByKey.get(key);
      if (!m) continue;

      const tx = this.txRepo.create({
        householdId,
        date: m.date,
        type: m.type,
        amount: m.amount,
        categoryId: m.categoryId ?? undefined,
        fromAssetId: m.fromAssetId ?? undefined,
        toAssetId: m.toAssetId ?? undefined,
        title: m.title ?? undefined,
        memo: m.memo ?? undefined,
        recurringTemplateId: m.recurringId,
        autoGenerated: true,
      });
      await this.txRepo.save(tx);
      created++;

      if (m.date === today) {
        await this.recurringRepo.update(m.recurringId, { lastRunDate: today });
      }
    }
    return created;
  }

  private computeDueDates(r: RecurringTransaction, fromDate: string | undefined, today: string): string[] {
    const lower = fromDate && fromDate > r.startDate ? fromDate : r.startDate;
    const upper = r.endDate && r.endDate < today ? r.endDate : today;
    if (lower > upper) return [];

    const pad = (n: number) => String(n).padStart(2, '0');
    const [uy, um] = upper.split('-').map(Number);
    let [y, m] = lower.split('-').map(Number);

    const dates: string[] = [];
    while (y < uy || (y === uy && m <= um)) {
      const isDue =
        r.frequency === RecurringFrequency.MONTHLY ? true : r.monthOfYear === m;
      // 해당 월에 없는 일자(예: 2월 31일)는 기존 cron과 동일하게 스킵
      const daysInMonth = new Date(y, m, 0).getDate();
      if (isDue && r.dayOfMonth <= daysInMonth) {
        const date = `${y}-${pad(m)}-${pad(r.dayOfMonth)}`;
        if (date >= lower && date <= upper) dates.push(date);
      }
      if (m === 12) {
        y += 1;
        m = 1;
      } else {
        m += 1;
      }
    }
    return dates;
  }

  private async generateTransaction(r: RecurringTransaction): Promise<Transaction> {
    const today = new Date().toISOString().split('T')[0];
    const tx = this.txRepo.create({
      householdId: r.householdId,
      date: today,
      type: r.type,
      amount: r.amount,
      categoryId: r.categoryId,
      fromAssetId: r.fromAssetId,
      toAssetId: r.toAssetId,
      title: r.title,
      memo: r.memo,
      recurringTemplateId: r.id,
      autoGenerated: true,
    });
    return this.txRepo.save(tx);
  }
}
