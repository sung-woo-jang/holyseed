/**
 * VR(TQQQ 밸류 리밸런싱) 전체 히스토리 시딩 — 토스 실제 주문내역(2026-06-03~07-17) +
 * 노션 "TQQQ VR" 페이지 교차검증으로 재구성. 06-03~06-12 8건 매수는 "06-03부터 시도하다
 * 06-22에 VR로 전환"한 무한매수법 잔재 실체결(합계 $617.62 = docs/laofus/VR/TQQQ_VR_상태.md의
 * "원금"과 정확히 일치). 07-17 2건도 애초 "미기록 구간"으로 추정했던 자리인데 실제 체결로 확인됨.
 * 유일한 근사치는 3사이클 진입 시점 $200 적립금의 정확한 반영 일시뿐 (금액·효과는 확실).
 *
 * 실행: DB_DATABASE=holyseed yarn workspace @holyseed/backend lab:vr:seed
 */
import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppModule } from '../../../app.module';
import { VrCycle, VrFill, VrFillKind, VrSetting } from '../modules/vr/entities';

interface SeedFill {
  date: string;
  kind: VrFillKind;
  price: number;
  quantity: number;
  cycleNo: number;
  note?: string;
  /** 노션 등에 명시된 실측값이 있으면 계산값 대신 이 값을 스냅(반올림 오차 흡수) */
  snapAvg?: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const round4 = (n: number) => Math.round(n * 10000) / 10000;

const fills: SeedFill[] = [
  // ---- 초기 구축 (06-03~06-12, 무한매수법 시도 잔재 — cycle 1에 귀속) ----
  {
    date: '2026-06-03',
    kind: VrFillKind.DEPOSIT,
    price: 5217.62,
    quantity: 0,
    cycleNo: 1,
    note: '초기 Pool 선언 (역산값 — 이후 매수 8건 후 $4,600/8주 도달하도록 역산, 토스 주문내역과 일치)',
  },
  { date: '2026-06-03', kind: VrFillKind.BUY, price: 86.56, quantity: 1, cycleNo: 1, note: '토스 실제 체결' },
  { date: '2026-06-04', kind: VrFillKind.BUY, price: 85.22, quantity: 1, cycleNo: 1, note: '토스 실제 체결' },
  { date: '2026-06-05', kind: VrFillKind.BUY, price: 73.05, quantity: 1, cycleNo: 1, note: '토스 실제 체결' },
  { date: '2026-06-08', kind: VrFillKind.BUY, price: 76.27, quantity: 1, cycleNo: 1, note: '토스 실제 체결' },
  { date: '2026-06-09', kind: VrFillKind.BUY, price: 73.72, quantity: 1, cycleNo: 1, note: '토스 실제 체결' },
  { date: '2026-06-10', kind: VrFillKind.BUY, price: 69.27, quantity: 1, cycleNo: 1, note: '토스 실제 체결' },
  { date: '2026-06-11', kind: VrFillKind.BUY, price: 76.01, quantity: 1, cycleNo: 1, note: '토스 실제 체결' },
  {
    date: '2026-06-12',
    kind: VrFillKind.BUY,
    price: 77.52,
    quantity: 1,
    cycleNo: 1,
    note: '토스 실제 체결 — 8주 합계 $617.62 (문서상 원금과 일치), 평단 $77.20 도달',
  },

  // ---- 1사이클 (2026-06-22~07-03, V=1322.96) ----
  { date: '2026-06-22', kind: VrFillKind.BUY, price: 84.43, quantity: 6, cycleNo: 1, note: '1사이클 시작 매수' },
  {
    date: '2026-07-06',
    kind: VrFillKind.BUY,
    price: 75.84,
    quantity: 2,
    cycleNo: 1,
    note: '1사이클(06.22~07.03) 밴드 미달 소급 적용 매수',
  },

  // ---- 2사이클 (2026-07-06~07-17, V=1917.13) ----
  {
    date: '2026-07-06',
    kind: VrFillKind.DEPOSIT,
    price: 200,
    quantity: 0,
    cycleNo: 2,
    note: '2사이클 적립금 입금',
  },
  {
    date: '2026-07-06',
    kind: VrFillKind.BUY,
    price: 75.47,
    quantity: 6,
    cycleNo: 2,
    note: '2사이클 V갱신 후 매수',
  },
  {
    date: '2026-07-07',
    kind: VrFillKind.BUY,
    price: 74.07,
    quantity: 1,
    cycleNo: 2,
    note: '앱 조건주문 체결분 (밴드 정식 발동 아님, 12:46 체결)',
  },
  {
    date: '2026-07-07',
    kind: VrFillKind.BUY,
    price: 70.85,
    quantity: 1,
    cycleNo: 2,
    note: '앱 조건주문 체결분 (밴드 정식 발동 아님, 23:42 체결)',
    snapAvg: 78.06,
  },
  {
    date: '2026-07-17',
    kind: VrFillKind.BUY,
    price: 67.9,
    quantity: 1,
    cycleNo: 2,
    note: '토스 실제 체결 (13:26) — 애초 "07-08~07-19 미기록 구간"으로 추정했던 자리, 실제로는 여기 있었음',
  },
  {
    date: '2026-07-17',
    kind: VrFillKind.BUY,
    price: 65.175,
    quantity: 1,
    cycleNo: 2,
    note: '토스 실제 체결 (22:42)',
    snapAvg: 77.174,
  },

  // ---- 3사이클 (2026-07-20~07-31, V=2432.71, 진행 중) ----
  {
    date: '2026-07-20',
    kind: VrFillKind.DEPOSIT,
    price: 200,
    quantity: 0,
    cycleNo: 3,
    note: '근사 — 3사이클 적립금 $200, 정확한 반영 시점 불명(사용자 확인: 늦게 반영됐을 수 있음). 금액·효과(Pool $3,610.93 도달)는 확실',
  },
];

const CYCLES = [
  { cycleNo: 1, startDate: '2026-06-22', endDate: '2026-07-03', vValue: 1322.96, poolStart: 4600, isClosed: true },
  { cycleNo: 2, startDate: '2026-07-06', endDate: '2026-07-17', vValue: 1917.13, poolStart: 4141.74, isClosed: true },
  { cycleNo: 3, startDate: '2026-07-20', endDate: '2026-07-31', vValue: 2432.71, poolStart: 3610.93, isClosed: false },
];

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  const fillRepo = app.get<Repository<VrFill>>(getRepositoryToken(VrFill));
  const cycleRepo = app.get<Repository<VrCycle>>(getRepositoryToken(VrCycle));
  const settingRepo = app.get<Repository<VrSetting>>(getRepositoryToken(VrSetting));

  await fillRepo.createQueryBuilder().delete().execute();
  await cycleRepo.createQueryBuilder().delete().execute();

  // 설정값 확인/보정 (기존 default row가 이미 있을 수 있음)
  let settings = await settingRepo.findOne({ where: {} });
  if (!settings) settings = await settingRepo.save(settingRepo.create({}));
  await settingRepo.update(
    { id: settings.id },
    { symbol: 'TQQQ', gFactor: 10, bandPct: 15, depositAmount: 200, poolLimitPct: 75 },
  );

  for (const c of CYCLES) {
    await cycleRepo.save(
      cycleRepo.create({
        cycleNo: c.cycleNo,
        startDate: c.startDate,
        endDate: c.endDate,
        vValue: c.vValue,
        poolStart: c.poolStart,
        depositAmount: 200,
        isClosed: c.isClosed,
      }),
    );
  }

  let pool = 0;
  let quantity = 0;
  let avgPrice = 0;

  for (const f of fills) {
    if (f.kind === VrFillKind.DEPOSIT) {
      const deposit = round2(f.price);
      pool = round2(pool + deposit);
      await fillRepo.save(
        fillRepo.create({
          fillDate: f.date,
          kind: f.kind,
          price: f.price,
          quantity: 0,
          amount: deposit,
          poolChange: deposit,
          poolAfter: pool,
          qtyAfter: quantity,
          avgPriceAfter: avgPrice,
          cycleNo: f.cycleNo,
          note: f.note ?? null,
        }),
      );
      continue;
    }

    const amount = round2(f.price * f.quantity);
    quantity += f.quantity;
    avgPrice = f.snapAvg ?? round4((avgPrice * (quantity - f.quantity) + amount) / quantity);
    pool = round2(pool - amount);

    await fillRepo.save(
      fillRepo.create({
        fillDate: f.date,
        kind: f.kind,
        price: f.price,
        quantity: f.quantity,
        amount,
        poolChange: round2(-amount),
        poolAfter: pool,
        qtyAfter: quantity,
        avgPriceAfter: avgPrice,
        cycleNo: f.cycleNo,
        note: f.note ?? null,
      }),
    );
  }

  console.log(`시딩 완료: fills ${fills.length}건`);
  console.log(`최종 상태: 보유 ${quantity}주, 평단 $${avgPrice}, Pool $${pool}`);
  await app.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
