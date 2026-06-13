import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { WorkLog } from './entities/work-log.entity';
import { Transaction, TransactionType } from '../transactions/entities/transaction.entity';
import { CreateWorkLogDto } from './dto/request/create-work-log.dto';
import { SettleWorkLogDto } from './dto/request/settle-work-log.dto';

@Injectable()
export class WorkLogsService {
  constructor(
    @InjectRepository(WorkLog)
    private readonly workLogRepo: Repository<WorkLog>,
    @InjectRepository(Transaction)
    private readonly txRepo: Repository<Transaction>,
  ) {}

  /** 월(YYYY-MM) 단위 근무 기록 조회 */
  async findByHouseholdMonth(householdId: number, month?: string): Promise<WorkLog[]> {
    if (month) {
      return this.workLogRepo.find({
        where: { householdId, date: Between(`${month}-01`, `${month}-31`) },
        order: { date: 'ASC', createdAt: 'ASC' },
      });
    }
    return this.workLogRepo.find({ where: { householdId }, order: { date: 'ASC' } });
  }

  async findOne(id: number): Promise<WorkLog> {
    const w = await this.workLogRepo.findOne({ where: { id } });
    if (!w) throw new NotFoundException('근무 기록을 찾을 수 없습니다.');
    return w;
  }

  async create(householdId: number, dto: CreateWorkLogDto, userId?: number): Promise<WorkLog> {
    const amount = this.resolveAmount(dto);
    const w = this.workLogRepo.create({
      householdId,
      date: dto.date,
      title: dto.title,
      amount,
      colorLabel: dto.colorLabel,
      workMinutes: dto.workMinutes,
      hourlyRate: dto.hourlyRate,
      toAssetId: dto.toAssetId,
      categoryId: dto.categoryId,
      memo: dto.memo,
      createdByUserId: userId,
      settled: false,
    });
    const saved = await this.workLogRepo.save(w);

    // 생성 즉시 수령 처리 → 거래 동반 생성
    if (dto.settled) {
      return this.settle(saved.id, {}, userId);
    }
    return saved;
  }

  async update(id: number, dto: Partial<CreateWorkLogDto>): Promise<WorkLog> {
    const w = await this.findOne(id);
    Object.assign(w, dto);
    if (dto.amount == null && (dto.workMinutes != null || dto.hourlyRate != null)) {
      w.amount = this.resolveAmount(w);
    }
    return this.workLogRepo.save(w);
  }

  /** 수령 처리: INCOME 거래 생성 후 연결 */
  async settle(id: number, dto: SettleWorkLogDto, userId?: number): Promise<WorkLog> {
    const w = await this.findOne(id);
    if (w.settled) return w;

    const tx = this.txRepo.create({
      householdId: w.householdId,
      date: w.date,
      type: TransactionType.INCOME,
      amount: w.amount,
      categoryId: dto.categoryId ?? w.categoryId,
      toAssetId: dto.toAssetId ?? w.toAssetId,
      title: w.title,
      memo: w.memo,
      createdByUserId: userId,
    });
    const savedTx = await this.txRepo.save(tx);

    w.settled = true;
    w.settledTransactionId = savedTx.id;
    return this.workLogRepo.save(w);
  }

  /** 수령 취소: 연결 거래 삭제 후 플래그 초기화 */
  async unsettle(id: number): Promise<WorkLog> {
    const w = await this.findOne(id);
    if (w.settledTransactionId) {
      await this.txRepo.delete(w.settledTransactionId);
    }
    w.settled = false;
    w.settledTransactionId = null;
    return this.workLogRepo.save(w);
  }

  async delete(id: number): Promise<void> {
    const w = await this.findOne(id);
    if (w.settledTransactionId) {
      await this.txRepo.delete(w.settledTransactionId);
    }
    await this.workLogRepo.remove(w);
  }

  /** 시간×시급이 있으면 금액 자동 계산, 그 외 입력 금액 사용 */
  private resolveAmount(src: { amount?: number; workMinutes?: number; hourlyRate?: number }): number {
    if (src.workMinutes != null && src.hourlyRate != null) {
      return Math.round((src.workMinutes / 60) * src.hourlyRate);
    }
    return src.amount ?? 0;
  }
}
