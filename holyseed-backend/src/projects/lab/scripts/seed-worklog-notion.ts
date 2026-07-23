/**
 * 근무일지 노션 DB("📅 근무일지", collection://dcd7bc57-8adc-4e91-b92b-4905f7d6f7d3)
 * 2026-06-09~2026-07-23 마이그레이션 데이터.
 * 금액은 노션에 수기 기록된 실제값을 그대로 신뢰값으로 저장한다
 * (WorklogService.calcAmount 공식과 자주 어긋남 — 업무 유형별 실제 일당이 달랐던 것으로 보임).
 *
 * 실행: yarn lab:worklog:seed  (backend 디렉터리)
 */
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../../../app.module';
import { Worklog, PayStatus } from '../modules/worklog/entities';
import { WorklogService } from '../modules/worklog/worklog.service';

interface SeedRow {
  workDate: string;
  title: string;
  address: string | null;
  jobs: string[];
  payStatus: PayStatus;
  workHours: string | null; // "07:00~17:00" 또는 null
  amount: number;
  memo: string | null;
}

const rows: SeedRow[] = [
  { workDate: '2026-06-09', title: '송도 / 학익', address: '송도동 117-37 골프장 / 학익동 풍림아이원 123동 2203호', jobs: ['도배', '필름'], payStatus: PayStatus.RECEIVED, workHours: '08:00~23:00', amount: 250000, memo: null },
  { workDate: '2026-06-10', title: '시흥', address: '미산로 105', jobs: ['퍼티'], payStatus: PayStatus.RECEIVED, workHours: '10:00~17:00', amount: 130000, memo: null },
  { workDate: '2026-06-11', title: '휴무', address: null, jobs: [], payStatus: PayStatus.DAYOFF, workHours: null, amount: 0, memo: null },
  { workDate: '2026-06-12', title: '부천 / 학익', address: '부천로 90번길 55-5 / 학익동 풍림아이원 123동 2203호', jobs: ['철거', '필름'], payStatus: PayStatus.RECEIVED, workHours: '09:00~23:59', amount: 255125, memo: '노션 원본 종료시각 24:00(자정) — 앱 형식 제약으로 23:59 표기' },
  { workDate: '2026-06-13', title: '휴무', address: null, jobs: [], payStatus: PayStatus.DAYOFF, workHours: null, amount: 0, memo: null },
  { workDate: '2026-06-14', title: '송도 / 학익', address: '송도동 117-37 골프장 / 학익동 풍림아이원 123동 2203호', jobs: ['도배', '필름'], payStatus: PayStatus.RECEIVED, workHours: '10:00~17:00', amount: 130000, memo: null },
  { workDate: '2026-06-15', title: '송도 / 학익', address: '송도동 117-37 골프장 / 학익동 풍림아이원 123동 2203호', jobs: ['도배', '필름'], payStatus: PayStatus.RECEIVED, workHours: '10:00~21:00', amount: 237250, memo: null },
  { workDate: '2026-06-16', title: '송도', address: '송도동 117-37 골프장', jobs: ['퍼티'], payStatus: PayStatus.RECEIVED, workHours: '07:30~19:00', amount: 165750, memo: null },
  { workDate: '2026-06-17', title: '부천', address: '부천로 90번길 55-5', jobs: ['철거'], payStatus: PayStatus.RECEIVED, workHours: '08:00~16:00', amount: 140000, memo: null },
  { workDate: '2026-06-18', title: '휴무', address: null, jobs: [], payStatus: PayStatus.DAYOFF, workHours: null, amount: 0, memo: null },
  { workDate: '2026-06-19', title: '휴무', address: null, jobs: [], payStatus: PayStatus.DAYOFF, workHours: null, amount: 0, memo: null },
  { workDate: '2026-06-20', title: '휴무', address: null, jobs: [], payStatus: PayStatus.DAYOFF, workHours: null, amount: 0, memo: null },
  { workDate: '2026-06-21', title: '휴무', address: null, jobs: [], payStatus: PayStatus.DAYOFF, workHours: null, amount: 0, memo: null },
  { workDate: '2026-06-22', title: '부천', address: '부천로 90번길 55-5', jobs: ['철거', '도배'], payStatus: PayStatus.RECEIVED, workHours: '08:00~22:00', amount: 236250, memo: null },
  { workDate: '2026-06-23', title: '부천', address: null, jobs: ['철거'], payStatus: PayStatus.RECEIVED, workHours: '08:00~17:00', amount: 140000, memo: null },
  { workDate: '2026-06-24', title: '간석동', address: '간석동 75-9 용정 201호', jobs: ['도배'], payStatus: PayStatus.RECEIVED, workHours: '08:00~17:00', amount: 140000, memo: null },
  { workDate: '2026-06-25', title: '시흥미산로', address: '경기 시흥시 미산로 105', jobs: ['퍼티', '세팅'], payStatus: PayStatus.RECEIVED, workHours: '08:00~17:00', amount: 140000, memo: '07:00 반장님 픽업' },
  { workDate: '2026-06-26', title: '휴무', address: null, jobs: [], payStatus: PayStatus.DAYOFF, workHours: null, amount: 0, memo: null },
  { workDate: '2026-06-27', title: '시흥 미산로', address: '경기 시흥시 미산로 105', jobs: [], payStatus: PayStatus.RECEIVED, workHours: '08:00~17:00', amount: 140000, memo: null },
  { workDate: '2026-06-28', title: '휴무', address: null, jobs: [], payStatus: PayStatus.DAYOFF, workHours: null, amount: 0, memo: null },
  { workDate: '2026-06-29', title: '용정빌라', address: null, jobs: ['도배'], payStatus: PayStatus.RECEIVED, workHours: '08:00~21:00', amount: 217000, memo: null },
  { workDate: '2026-06-30', title: '시흥', address: null, jobs: ['퍼티'], payStatus: PayStatus.RECEIVED, workHours: '08:00~17:00', amount: 140000, memo: null },
  { workDate: '2026-07-01', title: '휴무', address: null, jobs: [], payStatus: PayStatus.DAYOFF, workHours: null, amount: 0, memo: null },
  { workDate: '2026-07-02', title: '시흥', address: null, jobs: ['퍼티'], payStatus: PayStatus.RECEIVED, workHours: '08:00~17:00', amount: 140000, memo: null },
  { workDate: '2026-07-03', title: '휴무', address: null, jobs: [], payStatus: PayStatus.DAYOFF, workHours: null, amount: 0, memo: null },
  { workDate: '2026-07-04', title: '휴무', address: null, jobs: [], payStatus: PayStatus.DAYOFF, workHours: null, amount: 0, memo: null },
  // 2026-07-05: 노션 원본이 완전 빈 placeholder 행이라 제외
  { workDate: '2026-07-06', title: '시흥', address: null, jobs: ['페인트'], payStatus: PayStatus.EXPECTED, workHours: '07:00~16:00', amount: 140000, memo: null },
  { workDate: '2026-07-07', title: '시흥', address: null, jobs: ['페인트'], payStatus: PayStatus.EXPECTED, workHours: '07:00~16:00', amount: 140000, memo: null },
  { workDate: '2026-07-08', title: '송도', address: null, jobs: ['도배'], payStatus: PayStatus.EXPECTED, workHours: '08:30~19:30', amount: 178500, memo: null },
  { workDate: '2026-07-09', title: '송도', address: null, jobs: ['도배'], payStatus: PayStatus.EXPECTED, workHours: '07:30~17:30', amount: 159250, memo: null },
  { workDate: '2026-07-10', title: '송도', address: null, jobs: ['도배'], payStatus: PayStatus.EXPECTED, workHours: '07:00~21:30', amount: 245875, memo: null },
  { workDate: '2026-07-11', title: '휴무', address: null, jobs: [], payStatus: PayStatus.DAYOFF, workHours: null, amount: 0, memo: null },
  { workDate: '2026-07-12', title: '휴무', address: null, jobs: [], payStatus: PayStatus.DAYOFF, workHours: null, amount: 0, memo: null },
  { workDate: '2026-07-13', title: '부천중동', address: null, jobs: ['도배'], payStatus: PayStatus.EXPECTED, workHours: '09:00~19:30', amount: 168875, memo: null },
  { workDate: '2026-07-14', title: '송도', address: null, jobs: ['도배'], payStatus: PayStatus.EXPECTED, workHours: '07:00~17:00', amount: 159250, memo: null },
  { workDate: '2026-07-15', title: '시흥', address: null, jobs: ['페인트'], payStatus: PayStatus.EXPECTED, workHours: '09:00~17:00', amount: 140000, memo: null },
  { workDate: '2026-07-16', title: '송도', address: null, jobs: ['도배'], payStatus: PayStatus.EXPECTED, workHours: '07:00~17:30', amount: 168875, memo: null },
  { workDate: '2026-07-17', title: '휴무', address: null, jobs: [], payStatus: PayStatus.DAYOFF, workHours: null, amount: 0, memo: null },
  { workDate: '2026-07-18', title: '휴무', address: null, jobs: [], payStatus: PayStatus.DAYOFF, workHours: null, amount: 0, memo: null },
  { workDate: '2026-07-19', title: '휴무', address: null, jobs: [], payStatus: PayStatus.DAYOFF, workHours: null, amount: 0, memo: null },
  { workDate: '2026-07-20', title: '휴무', address: null, jobs: [], payStatus: PayStatus.DAYOFF, workHours: null, amount: 0, memo: null },
  { workDate: '2026-07-21', title: '송도', address: null, jobs: ['도배'], payStatus: PayStatus.EXPECTED, workHours: '14:00~18:00', amount: 70000, memo: null },
  { workDate: '2026-07-22', title: '송도', address: null, jobs: ['도배'], payStatus: PayStatus.EXPECTED, workHours: '07:00~17:00', amount: 159250, memo: null },
  { workDate: '2026-07-23', title: '송도', address: null, jobs: ['도배'], payStatus: PayStatus.EXPECTED, workHours: '07:30~17:00', amount: 149625, memo: null },
];

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d~([01]\d|2[0-3]):[0-5]\d$/;

function splitWorkHours(workHours: string | null): { startTime: string | null; endTime: string | null } {
  if (!workHours || !TIME_PATTERN.test(workHours)) return { startTime: null, endTime: null };
  const [startTime, endTime] = workHours.split('~');
  return { startTime, endTime };
}

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  const ds = app.get(DataSource);
  const worklogService = app.get(WorklogService);
  const worklogRepo = ds.getRepository(Worklog);

  let inserted = 0;
  for (const row of rows) {
    // 재실행 안전성: 같은 날짜의 기존 행이 있으면 지우고 다시 삽입
    await worklogRepo.createQueryBuilder().delete().where('work_date = :workDate', { workDate: row.workDate }).execute();

    const { startTime, endTime } = splitWorkHours(row.workHours);
    await worklogRepo.save(
      worklogRepo.create({
        title: row.title,
        workDate: row.workDate,
        startTime,
        endTime,
        breakHours: 1,
        jobs: row.jobs,
        payStatus: row.payStatus,
        dailyWage: worklogService.getDailyWage(row.workDate),
        amount: row.amount,
        amountOverride: null,
        address: row.address,
        memo: row.memo,
      }),
    );
    inserted += 1;
  }

  console.log(`근무일지 노션 마이그레이션 완료: ${inserted}건 삽입`);
  await app.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
