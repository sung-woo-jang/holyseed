import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VrSetting, VrCycle, VrFill, VrFillKind } from './entities';
import { CreateFillDto, CreateCycleDto, RolloverCycleDto, UpdateSettingsDto } from './dto/request';

const round2 = (n: number) => Math.round(n * 100) / 100;
const round4 = (n: number) => Math.round(n * 10000) / 10000;

@Injectable()
export class VrService {
  constructor(
    @InjectRepository(VrSetting)
    private readonly settingRepo: Repository<VrSetting>,
    @InjectRepository(VrCycle)
    private readonly cycleRepo: Repository<VrCycle>,
    @InjectRepository(VrFill)
    private readonly fillRepo: Repository<VrFill>,
  ) {}

  // ==================== Settings ====================

  async getSettings(): Promise<VrSetting> {
    let settings = await this.settingRepo.findOne({ where: {}, order: { id: 'ASC' } });
    if (!settings) {
      settings = await this.settingRepo.save(this.settingRepo.create({}));
    }
    return settings;
  }

  async updateSettings(dto: UpdateSettingsDto): Promise<VrSetting> {
    const settings = await this.getSettings();
    Object.assign(settings, dto);
    return this.settingRepo.save(settings);
  }

  // ==================== State ====================

  async getState() {
    const settings = await this.getSettings();
    const currentCycle = await this.cycleRepo.findOne({
      where: { isClosed: false },
      order: { cycleNo: 'DESC' },
    });
    const lastFill = await this.fillRepo
      .createQueryBuilder('f')
      .orderBy('f.fill_date', 'DESC')
      .addOrderBy('f.id', 'DESC')
      .getOne();

    const pool = lastFill?.poolAfter ?? currentCycle?.poolStart ?? 0;
    const quantity = lastFill?.qtyAfter ?? 0;
    const avgPrice = lastFill?.avgPriceAfter ?? 0;

    const v = currentCycle?.vValue ?? 0;
    const bandRatio = settings.bandPct / 100;

    return {
      settings,
      cycle: currentCycle,
      nextRenewalDate: currentCycle ? this.nextMonday(currentCycle.endDate) : null,
      pool: round2(pool),
      quantity,
      avgPrice: round4(avgPrice),
      vValue: v,
      minBand: round2(v * (1 - bandRatio)),
      maxBand: round2(v * (1 + bandRatio)),
      usablePool: round2(pool * (settings.poolLimitPct / 100)),
      v2Preview: currentCycle ? round2(v + pool / settings.gFactor + settings.depositAmount) : null,
    };
  }

  /** 종료일 다음 월요일 */
  private nextMonday(dateStr: string): string {
    const d = new Date(`${dateStr}T00:00:00Z`);
    const day = d.getUTCDay();
    const add = ((8 - day) % 7) || 7;
    d.setUTCDate(d.getUTCDate() + add);
    return d.toISOString().slice(0, 10);
  }

  // ==================== Fills ====================

  async findAllFills(): Promise<VrFill[]> {
    return this.fillRepo
      .createQueryBuilder('f')
      .orderBy('f.fill_date', 'DESC')
      .addOrderBy('f.id', 'DESC')
      .getMany();
  }

  async createFill(dto: CreateFillDto): Promise<VrFill> {
    const currentCycle = await this.cycleRepo.findOne({ where: { isClosed: false }, order: { cycleNo: 'DESC' } });
    if (!currentCycle) {
      throw new BadRequestException('진행 중인 사이클이 없습니다. 사이클을 먼저 등록하세요.');
    }

    const lastFill = await this.fillRepo
      .createQueryBuilder('f')
      .orderBy('f.fill_date', 'DESC')
      .addOrderBy('f.id', 'DESC')
      .getOne();

    const snapshot = this.applyFill(
      {
        pool: lastFill?.poolAfter ?? currentCycle.poolStart,
        quantity: lastFill?.qtyAfter ?? 0,
        avgPrice: lastFill?.avgPriceAfter ?? 0,
      },
      dto,
    );

    const fill = this.fillRepo.create({
      fillDate: dto.fillDate,
      kind: dto.kind,
      price: dto.price,
      quantity: dto.quantity,
      note: dto.note ?? null,
      cycleNo: currentCycle.cycleNo,
      ...snapshot,
    });
    return this.fillRepo.save(fill);
  }

  private applyFill(
    prev: { pool: number; quantity: number; avgPrice: number },
    fill: { kind: VrFillKind; price: number; quantity: number },
  ) {
    // 적립금: Pool만 증가, 수량/평단 유지
    if (fill.kind === VrFillKind.DEPOSIT) {
      const deposit = round2(fill.price);
      return {
        amount: deposit,
        poolChange: deposit,
        poolAfter: round2(prev.pool + deposit),
        qtyAfter: prev.quantity,
        avgPriceAfter: prev.avgPrice,
      };
    }

    if (fill.quantity < 1) {
      throw new BadRequestException('매수/매도 수량은 1 이상이어야 합니다.');
    }

    const amount = round2(fill.price * fill.quantity);
    const isSell = fill.kind === VrFillKind.SELL;

    if (isSell && fill.quantity > prev.quantity) {
      throw new BadRequestException(`보유수량(${prev.quantity})보다 많이 매도할 수 없습니다.`);
    }

    const poolChange = isSell ? amount : -amount;
    const qtyAfter = isSell ? prev.quantity - fill.quantity : prev.quantity + fill.quantity;

    // 평단: 매수 시 가중평균, 매도 시 유지 (전량 매도 시 0)
    let avgPriceAfter = prev.avgPrice;
    if (!isSell) {
      avgPriceAfter = round4((prev.avgPrice * prev.quantity + amount) / qtyAfter);
    } else if (qtyAfter === 0) {
      avgPriceAfter = 0;
    }

    return {
      amount,
      poolChange: round2(poolChange),
      poolAfter: round2(prev.pool + poolChange),
      qtyAfter,
      avgPriceAfter,
    };
  }

  async deleteFill(id: number): Promise<void> {
    const fill = await this.fillRepo.findOne({ where: { id } });
    if (!fill) throw new NotFoundException('체결을 찾을 수 없습니다.');
    await this.fillRepo.remove(fill);
    await this.recalcSnapshots();
  }

  /** 전체 체결을 날짜순 재적용해 스냅샷 재계산 */
  private async recalcSnapshots(): Promise<void> {
    const fills = await this.fillRepo
      .createQueryBuilder('f')
      .orderBy('f.fill_date', 'ASC')
      .addOrderBy('f.id', 'ASC')
      .getMany();

    const firstCycle = await this.cycleRepo.findOne({ where: {}, order: { cycleNo: 'ASC' } });
    let state = { pool: firstCycle?.poolStart ?? 0, quantity: 0, avgPrice: 0 };

    for (const fill of fills) {
      const snapshot = this.applyFill(state, fill);
      Object.assign(fill, snapshot);
      state = { pool: snapshot.poolAfter, quantity: snapshot.qtyAfter, avgPrice: snapshot.avgPriceAfter };
    }
    await this.fillRepo.save(fills);
  }

  // ==================== Cycles ====================

  async findAllCycles(): Promise<VrCycle[]> {
    return this.cycleRepo.find({ order: { cycleNo: 'DESC' } });
  }

  async createCycle(dto: CreateCycleDto): Promise<VrCycle> {
    const existing = await this.cycleRepo.findOne({ where: { cycleNo: dto.cycleNo } });
    if (existing) throw new BadRequestException('이미 존재하는 사이클 번호입니다.');

    const settings = await this.getSettings();
    // 새 사이클 등록 시 기존 열린 사이클은 닫음
    await this.cycleRepo.update({ isClosed: false }, { isClosed: true });

    const cycle = this.cycleRepo.create({
      ...dto,
      depositAmount: dto.depositAmount ?? settings.depositAmount,
      isClosed: false,
    });
    return this.cycleRepo.save(cycle);
  }

  /** V 갱신일 처리: 현 사이클 종료 → V₂ 계산 → 새 사이클 시작 */
  async rollover(dto: RolloverCycleDto) {
    const current = await this.cycleRepo.findOne({ where: { isClosed: false }, order: { cycleNo: 'DESC' } });
    if (!current) throw new BadRequestException('진행 중인 사이클이 없습니다.');

    const settings = await this.getSettings();
    const state = await this.getState();
    const deposit = dto.deposit ?? settings.depositAmount;

    const v2 = round2(current.vValue + state.pool / settings.gFactor + deposit);

    current.poolEnd = state.pool;
    current.isClosed = true;
    await this.cycleRepo.save(current);

    const startDate = dto.newStartDate ?? this.nextMonday(current.endDate);
    const newCycle = this.cycleRepo.create({
      cycleNo: current.cycleNo + 1,
      startDate,
      endDate: this.fridayAfterTwoWeeks(startDate),
      vValue: v2,
      poolStart: round2(state.pool + deposit),
      depositAmount: deposit,
      isClosed: false,
    });
    const saved = await this.cycleRepo.save(newCycle);

    // 적립금을 DEPOSIT 체결로 기록 — Pool 스냅샷 흐름에 반영
    if (deposit > 0) {
      await this.createFill({
        fillDate: startDate,
        kind: VrFillKind.DEPOSIT,
        price: deposit,
        quantity: 0,
        note: `${saved.cycleNo}사이클 V갱신 적립금`,
      });
    }

    return { closedCycle: current, newCycle: saved };
  }

  /** 시작일로부터 2주차 금요일 */
  private fridayAfterTwoWeeks(startDateStr: string): string {
    const d = new Date(`${startDateStr}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + 7); // 다음 주로
    const day = d.getUTCDay();
    const toFriday = (5 - day + 7) % 7;
    d.setUTCDate(d.getUTCDate() + toFriday);
    return d.toISOString().slice(0, 10);
  }
}
