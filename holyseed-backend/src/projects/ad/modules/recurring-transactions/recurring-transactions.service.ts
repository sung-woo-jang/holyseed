import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
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

/** KST 기준 YYYY-MM-DD — toISOString()은 UTC라 KST 오전 9시 이전엔 하루 전 날짜가 됨 */
function kstDate(d: Date = new Date()): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(d);
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

  /**
   * "오늘 = dayOfMonth"인 순간에만 실행되는 단발성 체크 대신, 가구별로 아직 실거래가 안 생긴
   * 지난 예정일을 전부 찾아(findMissed) 원래 예정일 그대로 자동 반영한다(applyMissed 재사용).
   * 크론이 하루 못 돌아도 다음 실행에서 자동으로 따라잡아, 사용자가 "미반영" 상태를 직접
   * 확인·승인할 필요가 없어짐(2026-09 정기지출 개선).
   */
  async runDailyAll(): Promise<void> {
    const rows = await this.recurringRepo
      .createQueryBuilder('r')
      .select('DISTINCT r.household_id', 'householdId')
      .where('r.active = :active', { active: true })
      .getRawMany<{ householdId: string }>();

    for (const { householdId } of rows) {
      try {
        const missed = await this.findMissed(Number(householdId));
        if (missed.length === 0) continue;
        await this.applyMissed(
          Number(householdId),
          missed.map((m) => ({ recurringId: m.recurringId, date: m.date })),
        );
      } catch {
        // 가구 단위 실패가 다른 가구 처리를 막지 않도록
      }
    }
  }

  async findMissed(householdId: number, fromDate?: string): Promise<MissedOccurrence[]> {
    const today = kstDate();
    const actives = await this.recurringRepo.find({ where: { householdId, active: true } });
    if (actives.length === 0) return [];

    const existing = await this.txRepo.find({
      where: { recurringTemplateId: In(actives.map((r) => r.id)) },
      select: ['recurringTemplateId', 'date'],
    });
    const existingKeys = new Set(existing.map((t) => `${t.recurringTemplateId}:${t.date}`));

    // 정기거래 화면을 거치지 않고 직접 입력한 거래(recurringTemplateId가 안 붙음)도
    // 같은 날짜·카테고리·수입/지출 타입이면 "이미 반영됨"으로 인정 (카테고리 없는 정기거래는 오탐 방지를 위해 제외)
    const minStartDate = actives.reduce((min, r) => (r.startDate < min ? r.startDate : min), actives[0].startDate);
    const lowerBound = fromDate && fromDate > minStartDate ? fromDate : minStartDate;
    const householdTxs = await this.txRepo.find({
      where: { householdId, date: Between(lowerBound, today) },
      select: ['date', 'categoryId', 'type'],
    });
    const looseKeys = new Set(
      householdTxs.filter((t) => t.categoryId != null).map((t) => `${t.date}:${t.categoryId}:${t.type}`),
    );

    const missed: MissedOccurrence[] = [];
    for (const r of actives) {
      for (const date of this.computeDueDates(r, fromDate, today)) {
        if (existingKeys.has(`${r.id}:${date}`)) continue;
        if (r.categoryId != null && looseKeys.has(`${date}:${r.categoryId}:${r.type}`)) continue;
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
    const today = kstDate();

    let created = 0;
    const seen = new Set<string>();
    for (const item of items) {
      const key = `${item.recurringId}:${item.date}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const m = missedByKey.get(key);
      if (!m) continue;

      try {
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
      } catch {
        // 개별 항목 실패가 나머지 항목 반영을 막지 않도록(크론이 매일 재시도함)
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
      const isDue = r.frequency === RecurringFrequency.MONTHLY ? true : r.monthOfYear === m;
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
}
