import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SavingRecord } from './entities';
import { CreateRecordDto, UpdateRecordDto } from './dto/request';

const GOAL = 100_000_000; // 1억
/** 51%+매년 10만 증액 구간의 기준 연도 */
const BASE_YEAR = 2026;
const MAN = 10_000;

@Injectable()
export class SavingService {
  constructor(
    @InjectRepository(SavingRecord)
    private readonly recordRepo: Repository<SavingRecord>,
  ) {}

  /**
   * 소득구간별 저축 계획 (docs/labs/저축 프로젝트.md)
   * 400만↑ 60% / 300~400만 60% / 250~300만 51% / 200~250만 54% / 180~200만 51%+연 10만 증액
   */
  computePlan(income: number, yearMonth?: string) {
    const man = income / MAN; // 만원 단위
    let rate: number;
    let extra = 0;

    if (man >= 300) {
      rate = 60;
    } else if (man >= 250) {
      rate = 51;
    } else if (man >= 200) {
      rate = 54;
    } else {
      rate = 51;
      const year = yearMonth ? parseInt(yearMonth.slice(0, 4), 10) : BASE_YEAR;
      extra = Math.max(0, year - BASE_YEAR) * 10 * MAN; // 매년 10만 원 증액
    }

    const savingTarget = Math.round((income * rate) / 100) + extra;
    return {
      rate,
      savingTarget,
      spendingLimit: income - savingTarget,
    };
  }

  async findAll(): Promise<SavingRecord[]> {
    return this.recordRepo.find({ order: { yearMonth: 'DESC' } });
  }

  async getSummary() {
    const records = await this.recordRepo.find({ order: { yearMonth: 'ASC' } });
    const totalSaved = records.reduce((acc, r) => acc + (r.actualSaving ?? r.savingTarget), 0);
    const avgMonthly = records.length > 0 ? Math.round(totalSaved / records.length) : 0;

    let expectedDoneAt: string | null = null;
    if (avgMonthly > 0 && totalSaved < GOAL) {
      const monthsLeft = Math.ceil((GOAL - totalSaved) / avgMonthly);
      const now = new Date();
      const done = new Date(now.getFullYear(), now.getMonth() + monthsLeft, 1);
      expectedDoneAt = `${done.getFullYear()}-${String(done.getMonth() + 1).padStart(2, '0')}`;
    }

    return {
      goal: GOAL,
      totalSaved,
      progressPct: Math.round((totalSaved / GOAL) * 10000) / 100,
      avgMonthly,
      monthCount: records.length,
      expectedDoneAt,
    };
  }

  /** yearMonth upsert — 수입 변경 시 계획 스냅샷 재계산 */
  async createOrUpdate(dto: CreateRecordDto): Promise<SavingRecord> {
    const plan = this.computePlan(dto.income, dto.yearMonth);
    let record = await this.recordRepo.findOne({ where: { yearMonth: dto.yearMonth } });

    if (record) {
      Object.assign(record, dto);
    } else {
      record = this.recordRepo.create({ ...dto, actualSaving: dto.actualSaving ?? null });
    }
    record.savingRate = plan.rate;
    record.savingTarget = plan.savingTarget;
    record.spendingLimit = plan.spendingLimit;
    return this.recordRepo.save(record);
  }

  async update(id: number, dto: UpdateRecordDto): Promise<SavingRecord> {
    const record = await this.recordRepo.findOne({ where: { id } });
    if (!record) throw new NotFoundException('저축 기록을 찾을 수 없습니다.');

    Object.assign(record, dto);
    if (dto.income !== undefined) {
      const plan = this.computePlan(record.income, record.yearMonth);
      record.savingRate = plan.rate;
      record.savingTarget = plan.savingTarget;
      record.spendingLimit = plan.spendingLimit;
    }
    return this.recordRepo.save(record);
  }

  async delete(id: number): Promise<void> {
    const record = await this.recordRepo.findOne({ where: { id } });
    if (!record) throw new NotFoundException('저축 기록을 찾을 수 없습니다.');
    await this.recordRepo.remove(record);
  }
}
