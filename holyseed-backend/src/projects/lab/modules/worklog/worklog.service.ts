import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Worklog, PayStatus, WorklogJobOption, WorklogCategoryOption } from './entities';
import { CreateWorklogDto, UpdateWorklogDto, SearchWorklogDto } from './dto/request';

/** 일당 기준 이력 — 변경 시 여기에 구간 추가 */
const DAILY_WAGE_HISTORY: { from: string; wage: number }[] = [
  { from: '0000-01-01', wage: 130000 },
  { from: '2026-06-17', wage: 140000 },
];

const WITHHOLDING_RATE = 0.033; // 원천징수 3.3%

const DEFAULT_CATEGORY = '인테리어';

/** "업무" 체크박스 팔레트 초기값 — worklog_job_options 테이블이 비어 있을 때만 1회 시딩 (인테리어 소속) */
const DEFAULT_JOB_OPTIONS = ['도배', '필름', '퍼티', '철거', '페인트', '세팅'];

/** "분류" 팔레트 초기값 — worklog_category_options 테이블이 비어 있을 때만 1회 시딩 */
const DEFAULT_CATEGORY_OPTIONS = ['인테리어', '쿠팡'];

export interface WorklogView extends Worklog {
  /** 유효 금액 (오버라이드 우선) */
  effectiveAmount: number;
  /** 실수령액 (3.3% 공제) */
  netAmount: number;
}

@Injectable()
export class WorklogService {
  constructor(
    @InjectRepository(Worklog)
    private readonly worklogRepo: Repository<Worklog>,
    @InjectRepository(WorklogJobOption)
    private readonly jobOptionRepo: Repository<WorklogJobOption>,
    @InjectRepository(WorklogCategoryOption)
    private readonly categoryOptionRepo: Repository<WorklogCategoryOption>,
  ) {}

  getDailyWage(date: string): number {
    let wage = DAILY_WAGE_HISTORY[0].wage;
    for (const entry of DAILY_WAGE_HISTORY) {
      if (date >= entry.from) wage = entry.wage;
    }
    return wage;
  }

  /**
   * 급여 계산 (대표님 방식):
   * 실근무 = 총근무 − 휴게, 초과 = max(0, 실근무 − 8)
   * 공수 = 1 + 초과/8, 금액 = 공수×일급 + 초과×시급×0.1
   */
  calcAmount(
    log: Pick<Worklog, 'startTime' | 'endTime' | 'breakHours' | 'dailyWage' | 'payStatus'>,
  ): number {
    if (log.payStatus === PayStatus.DAYOFF) return 0;
    if (!log.startTime || !log.endTime) return log.dailyWage;

    const toHours = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h + m / 60;
    };
    let total = toHours(log.endTime) - toHours(log.startTime);
    if (total < 0) total += 24; // 자정 넘김
    const worked = Math.max(0, total - (log.breakHours ?? 1));
    const overtime = Math.max(0, worked - 8);
    const laborUnits = 1 + overtime / 8;
    const hourlyWage = log.dailyWage / 8;
    return Math.round(laborUnits * log.dailyWage + overtime * hourlyWage * 0.1);
  }

  private toView(log: Worklog): WorklogView {
    const effectiveAmount = log.amountOverride ?? log.amount;
    const netAmount = Math.round(effectiveAmount * (1 - WITHHOLDING_RATE));
    return { ...log, effectiveAmount, netAmount };
  }

  async findAll(): Promise<WorklogView[]> {
    const logs = await this.worklogRepo.find({ order: { workDate: 'DESC', id: 'DESC' } });
    return logs.map((log) => this.toView(log));
  }

  async search(dto: SearchWorklogDto) {
    const from = `${dto.year}-${String(dto.month).padStart(2, '0')}-01`;
    const lastDay = new Date(Date.UTC(dto.year, dto.month, 0)).getUTCDate();
    const to = `${dto.year}-${String(dto.month).padStart(2, '0')}-${lastDay}`;

    const logs = await this.worklogRepo.find({
      where: { workDate: Between(from, to) },
      order: { workDate: 'ASC', id: 'ASC' },
    });
    const records = logs.map((log) => this.toView(log));

    const workRecords = records.filter((r) => r.payStatus !== PayStatus.DAYOFF);
    const sum = (rows: WorklogView[], pick: (r: WorklogView) => number) => rows.reduce((acc, r) => acc + pick(r), 0);

    return {
      records,
      summary: {
        workDays: workRecords.length,
        totalAmount: sum(workRecords, (r) => r.effectiveAmount),
        totalNet: sum(workRecords, (r) => r.netAmount),
        receivedNet: sum(
          workRecords.filter((r) => r.payStatus === PayStatus.RECEIVED),
          (r) => r.netAmount,
        ),
        pendingNet: sum(
          workRecords.filter((r) => r.payStatus === PayStatus.EXPECTED || r.payStatus === PayStatus.UNPAID),
          (r) => r.netAmount,
        ),
      },
    };
  }

  async create(dto: CreateWorklogDto): Promise<WorklogView> {
    const dailyWage = dto.dailyWage ?? this.getDailyWage(dto.workDate);
    const log = this.worklogRepo.create({
      ...dto,
      jobs: dto.jobs ?? [],
      photos: dto.photos ?? [],
      breakHours: dto.breakHours ?? 1,
      payStatus: dto.payStatus ?? PayStatus.EXPECTED,
      category: dto.category ?? DEFAULT_CATEGORY,
      dailyWage,
      amountOverride: dto.amountOverride ?? null,
    });
    log.amount = this.calcAmount(log);
    return this.toView(await this.worklogRepo.save(log));
  }

  async update(id: number, dto: UpdateWorklogDto): Promise<WorklogView> {
    const log = await this.worklogRepo.findOne({ where: { id } });
    if (!log) throw new NotFoundException('근무 기록을 찾을 수 없습니다.');

    const hasOverrideKey = 'amountOverride' in dto;
    const { amountOverride, ...rest } = dto;
    Object.assign(log, rest);
    if (hasOverrideKey) log.amountOverride = amountOverride ?? null;

    log.amount = this.calcAmount(log);
    return this.toView(await this.worklogRepo.save(log));
  }

  async delete(id: number): Promise<void> {
    const log = await this.worklogRepo.findOne({ where: { id } });
    if (!log) throw new NotFoundException('근무 기록을 찾을 수 없습니다.');
    await this.worklogRepo.remove(log);
  }

  /** 업무 팔레트 조회 — 최초 호출 시(테이블이 비어있으면) 기본 6개(인테리어 소속) 자동 시딩 */
  async getJobOptions(): Promise<WorklogJobOption[]> {
    const count = await this.jobOptionRepo.count();
    if (count === 0) {
      await this.jobOptionRepo.save(
        DEFAULT_JOB_OPTIONS.map((name) => this.jobOptionRepo.create({ name, category: DEFAULT_CATEGORY })),
      );
    }
    return this.jobOptionRepo.find({ order: { id: 'ASC' } });
  }

  async createJobOption(name: string, category: string): Promise<WorklogJobOption> {
    const exists = await this.jobOptionRepo.findOne({ where: { name, category } });
    if (exists) throw new BadRequestException('이미 있는 업무입니다.');
    return this.jobOptionRepo.save(this.jobOptionRepo.create({ name, category }));
  }

  async deleteJobOption(id: number): Promise<void> {
    const option = await this.jobOptionRepo.findOne({ where: { id } });
    if (!option) throw new NotFoundException('업무 항목을 찾을 수 없습니다.');
    await this.jobOptionRepo.remove(option);
  }

  /**
   * 분류 팔레트 조회 — 최초 호출 시(테이블이 비어있으면) 기본 2개 자동 시딩 + 레거시 enum 값
   * ('INTERIOR'/'COUPANG') → 새 분류명('인테리어'/'쿠팡') 1회 백필. 이미 변환된 경우 매칭 0건이라 안전.
   */
  async getCategoryOptions(): Promise<WorklogCategoryOption[]> {
    const count = await this.categoryOptionRepo.count();
    if (count === 0) {
      await this.categoryOptionRepo.save(
        DEFAULT_CATEGORY_OPTIONS.map((name) => this.categoryOptionRepo.create({ name })),
      );
      await this.worklogRepo.update({ category: 'INTERIOR' }, { category: '인테리어' });
      await this.worklogRepo.update({ category: 'COUPANG' }, { category: '쿠팡' });
    }
    return this.categoryOptionRepo.find({ order: { id: 'ASC' } });
  }

  async createCategoryOption(name: string): Promise<WorklogCategoryOption> {
    const exists = await this.categoryOptionRepo.findOne({ where: { name } });
    if (exists) throw new BadRequestException('이미 있는 분류입니다.');
    return this.categoryOptionRepo.save(this.categoryOptionRepo.create({ name }));
  }
}
