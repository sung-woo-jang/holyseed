import { Repository } from 'typeorm';
import { PayStatus, Worklog, WorklogCategoryOption, WorklogJobOption, WorklogTitleOption } from './entities';
import { WorklogService } from './worklog.service';

describe('WorklogService.preview', () => {
  let categoryFind: jest.Mock;
  let service: WorklogService;

  beforeEach(() => {
    categoryFind = jest.fn().mockResolvedValue(null);
    service = new WorklogService(
      { create: (v: unknown) => ({ ...(v as object) }) } as unknown as Repository<Worklog>,
      {} as unknown as Repository<WorklogJobOption>,
      { findOne: categoryFind } as unknown as Repository<WorklogCategoryOption>,
      {} as unknown as Repository<WorklogTitleOption>,
    );
  });

  it('정시 근무는 일급 그대로, 원천징수 3.3%를 뺀 실수령액을 돌려준다', async () => {
    const r = await service.preview({
      workDate: '2026-10-02',
      startTime: '08:00',
      endTime: '17:00',
      breakHours: 1,
      dailyWage: 150000,
    });

    expect(r.workedHours).toBe(8);
    expect(r.overtimeHours).toBe(0);
    expect(r.amount).toBe(150000);
    expect(r.netAmount).toBe(145050);
  });

  it('초과 근무는 공수와 가산 수당이 붙는다', async () => {
    const r = await service.preview({
      workDate: '2026-10-02',
      startTime: '07:00',
      endTime: '20:00',
      breakHours: 1,
      dailyWage: 150000,
      withholdingApplied: false,
    });

    expect(r.workedHours).toBe(12);
    expect(r.overtimeHours).toBe(4);
    // 1.5공수 225,000 + 초과 4h × 시급 18,750 × 0.1
    expect(r.amount).toBe(232500);
    expect(r.netAmount).toBe(232500);
  });

  it('자정을 넘기는 근무는 다음 날 종료로 계산한다', async () => {
    const r = await service.preview({
      workDate: '2026-10-02',
      startTime: '22:00',
      endTime: '06:00',
      breakHours: 0,
      dailyWage: 100000,
    });

    expect(r.workedHours).toBe(8);
    expect(r.amount).toBe(100000);
  });

  it('시간이 없으면 일급 × 공수 배율, 직접 입력한 금액이 있으면 그 금액이 우선이다', async () => {
    const half = await service.preview({
      workDate: '2026-10-02',
      dailyWage: 150000,
      payMultiplier: 0.5,
      withholdingApplied: false,
    });
    expect(half.workedHours).toBeNull();
    expect(half.effectiveAmount).toBe(75000);

    const override = await service.preview({
      workDate: '2026-10-02',
      dailyWage: 150000,
      amountOverride: 120000,
      withholdingApplied: false,
    });
    expect(override.effectiveAmount).toBe(120000);
  });

  it('휴무는 0원이다', async () => {
    const r = await service.preview({
      workDate: '2026-10-02',
      payStatus: PayStatus.DAYOFF,
      startTime: '08:00',
      endTime: '17:00',
    });

    expect(r.amount).toBe(0);
    expect(r.workedHours).toBeNull();
  });

  it('분류 기본값(일급·시간·원천징수)을 적용한다', async () => {
    categoryFind.mockResolvedValue({
      defaultDailyWage: 160000,
      defaultStartTime: '09:00',
      defaultEndTime: '18:00',
      defaultBreakHours: 1,
      defaultWithholdingApplied: false,
      overtimeThresholdHours: 8,
      overtimeExtraRate: 0.1,
    });

    const r = await service.preview({ workDate: '2026-10-02', category: '쿠팡' });

    expect(r.dailyWage).toBe(160000);
    expect(r.amount).toBe(160000);
    expect(r.netAmount).toBe(160000);
  });
});
