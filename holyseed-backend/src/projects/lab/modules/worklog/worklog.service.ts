import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsWhere, Repository } from 'typeorm';
import { Worklog, PayStatus, WorklogJobOption, WorklogCategoryOption } from './entities';
import {
  CreateWorklogDto,
  UpdateWorklogDto,
  SearchWorklogDto,
  QueryWorklogDto,
  CreateCategoryOptionDto,
  UpdateCategoryOptionDto,
} from './dto/request';

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
   * 실근무 = 총근무 − 휴게, 초과 = max(0, 실근무 − 임계시간)
   * 공수 = 1 + 초과/임계시간, 금액 = 공수×일급 + 초과×시급×가산율
   * 임계시간/가산율은 기록 등록 시점에 분류 설정에서 스냅샷된 값을 사용한다.
   */
  calcAmount(
    log: Pick<
      Worklog,
      | 'startTime'
      | 'endTime'
      | 'breakHours'
      | 'dailyWage'
      | 'payStatus'
      | 'overtimeThresholdHours'
      | 'overtimeExtraRate'
    >,
  ): number {
    if (log.payStatus === PayStatus.DAYOFF) return 0;
    if (!log.startTime || !log.endTime) return log.dailyWage;

    const toHours = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h + m / 60;
    };
    let total = toHours(log.endTime) - toHours(log.startTime);
    if (total < 0) total += 24; // 자정 넘김
    const threshold = log.overtimeThresholdHours ?? 8;
    const extraRate = log.overtimeExtraRate ?? 0.1;
    const worked = Math.max(0, total - (log.breakHours ?? 1));
    const overtime = Math.max(0, worked - threshold);
    const laborUnits = 1 + overtime / threshold;
    const hourlyWage = log.dailyWage / threshold;
    return Math.round(laborUnits * log.dailyWage + overtime * hourlyWage * extraRate);
  }

  private toView(log: Worklog): WorklogView {
    const halved = log.halfPay ? Math.round(log.amount / 2) : log.amount;
    const effectiveAmount = log.amountOverride ?? halved;
    const netAmount = Math.round(effectiveAmount * (1 - (log.withholdingApplied ? WITHHOLDING_RATE : 0)));
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

    return { records, summary: this.summarizeRecords(records) };
  }

  /**
   * 기간(달력 월 또는 from~to)·분류·수령여부·업무·현장명으로 유연하게 조회 (MCP 등 범용 조회용).
   * jobs/titleContains는 DB 레벨 매칭이 번거로워(jobs는 simple-array) 조회 후 JS로 추가 필터링한다.
   */
  async query(dto: QueryWorklogDto) {
    let from: string;
    let to: string;
    if (dto.from || dto.to) {
      from = dto.from ?? '0000-01-01';
      to = dto.to ?? new Date().toISOString().slice(0, 10);
    } else {
      const year = dto.year ?? new Date().getFullYear();
      const month = dto.month ?? new Date().getMonth() + 1;
      from = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
      to = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
    }

    const where: FindOptionsWhere<Worklog> = { workDate: Between(from, to) };
    if (dto.category) where.category = dto.category;
    if (dto.payStatus) where.payStatus = dto.payStatus;

    const logs = await this.worklogRepo.find({ where, order: { workDate: 'ASC', id: 'ASC' } });
    let records = logs.map((log) => this.toView(log));

    if (dto.titleContains) {
      const q = dto.titleContains.toLowerCase();
      records = records.filter((r) => r.title.toLowerCase().includes(q));
    }
    if (dto.jobs?.length) {
      records = records.filter((r) => dto.jobs!.some((j) => r.jobs.includes(j)));
    }

    const withholding = dto.withholding ?? true;
    const outputRecords = withholding ? records : records.map(({ netAmount: _netAmount, ...rest }) => rest);

    return { records: outputRecords, summary: this.summarizeRecords(records, withholding) };
  }

  /** withholding=false면 원천징수(netAmount) 파생 집계(totalNet/receivedNet/pendingNet)를 제외한다. */
  private summarizeRecords(records: WorklogView[], withholding = true) {
    const workRecords = records.filter((r) => r.payStatus !== PayStatus.DAYOFF);
    const sum = (rows: WorklogView[], pick: (r: WorklogView) => number) => rows.reduce((acc, r) => acc + pick(r), 0);

    const base = {
      workDays: workRecords.length,
      laborUnits: sum(workRecords, (r) => (r.halfPay ? 0.5 : 1)),
      totalAmount: sum(workRecords, (r) => r.effectiveAmount),
    };
    if (!withholding) return base;

    return {
      ...base,
      totalNet: sum(workRecords, (r) => r.netAmount),
      receivedNet: sum(
        workRecords.filter((r) => r.payStatus === PayStatus.RECEIVED),
        (r) => r.netAmount,
      ),
      pendingNet: sum(
        workRecords.filter((r) => r.payStatus === PayStatus.EXPECTED || r.payStatus === PayStatus.UNPAID),
        (r) => r.netAmount,
      ),
    };
  }

  async create(dto: CreateWorklogDto): Promise<WorklogView> {
    const category = dto.category ?? DEFAULT_CATEGORY;
    const categoryOption = await this.categoryOptionRepo.findOne({ where: { name: category } });
    const dailyWage = dto.dailyWage ?? categoryOption?.defaultDailyWage ?? this.getDailyWage(dto.workDate);
    const log = this.worklogRepo.create({
      ...dto,
      jobs: dto.jobs ?? [],
      photos: dto.photos ?? [],
      breakHours: dto.breakHours ?? categoryOption?.defaultBreakHours ?? 1,
      startTime: dto.startTime ?? categoryOption?.defaultStartTime ?? null,
      endTime: dto.endTime ?? categoryOption?.defaultEndTime ?? null,
      address: dto.address ?? categoryOption?.defaultAddress ?? null,
      payStatus: dto.payStatus ?? PayStatus.EXPECTED,
      category,
      dailyWage,
      amountOverride: dto.amountOverride ?? null,
      withholdingApplied: dto.withholdingApplied ?? categoryOption?.defaultWithholdingApplied ?? true,
      halfPay: dto.halfPay ?? false,
      overtimeThresholdHours: categoryOption?.overtimeThresholdHours ?? 8,
      overtimeExtraRate: categoryOption?.overtimeExtraRate ?? 0.1,
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

  /** 현장명 추천 — 최근 사용순(동률 없음, lastDate 기준) 상위 12개 */
  async getTitleSuggestions(): Promise<{ name: string; count: number }[]> {
    const rows = await this.worklogRepo.find({ select: ['title', 'workDate'], order: { workDate: 'DESC' } });
    const map = new Map<string, { count: number; lastDate: string }>();
    for (const r of rows) {
      const cur = map.get(r.title);
      if (cur) cur.count += 1;
      else map.set(r.title, { count: 1, lastDate: r.workDate });
    }
    return [...map.entries()]
      .map(([name, v]) => ({ name, count: v.count, lastDate: v.lastDate }))
      .sort((a, b) => (a.lastDate < b.lastDate ? 1 : a.lastDate > b.lastDate ? -1 : 0))
      .slice(0, 12)
      .map(({ name, count }) => ({ name, count }));
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
    return this.categoryOptionRepo.find({ order: { sortOrder: 'ASC', id: 'ASC' } });
  }

  async createCategoryOption(dto: CreateCategoryOptionDto): Promise<WorklogCategoryOption> {
    const exists = await this.categoryOptionRepo.findOne({ where: { name: dto.name } });
    if (exists) throw new BadRequestException('이미 있는 분류입니다.');
    const maxOrder = await this.categoryOptionRepo.maximum('sortOrder');
    return this.categoryOptionRepo.save(this.categoryOptionRepo.create({ ...dto, sortOrder: (maxOrder ?? -1) + 1 }));
  }

  /** 분류별 기본값(일급여/원천징수/초과수당 임계시간·가산율) 수정 — 기존 근무 기록에는 영향 없음(생성 시점에 스냅샷됨) */
  async updateCategoryOption(dto: UpdateCategoryOptionDto): Promise<WorklogCategoryOption> {
    const option = await this.categoryOptionRepo.findOne({ where: { id: dto.id } });
    if (!option) throw new NotFoundException('분류를 찾을 수 없습니다.');
    const { id: _id, ...rest } = dto;
    Object.assign(option, rest);
    return this.categoryOptionRepo.save(option);
  }

  /** 분류 순서 재배치 — 전달된 id 배열의 인덱스를 sortOrder로 일괄 반영 */
  async reorderCategoryOptions(ids: number[]): Promise<WorklogCategoryOption[]> {
    const options = await this.categoryOptionRepo.find();
    if (ids.length !== options.length || !options.every((o) => ids.includes(o.id))) {
      throw new BadRequestException('전달된 분류 목록이 현재 분류 전체와 일치하지 않습니다.');
    }
    await Promise.all(ids.map((id, index) => this.categoryOptionRepo.update({ id }, { sortOrder: index })));
    return this.getCategoryOptions();
  }
}
