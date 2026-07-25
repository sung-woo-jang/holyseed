/**
 * VR(TQQQ 밸류 리밸런싱) 사이클 시딩 — 노션 "TQQQ VR" 페이지 + 외부 앱 화면(2026-07-20~07-31,
 * 3사이클) 스냅샷 마이그레이션. 중간 체결 히스토리(1~2사이클)는 노션에 별도 DB로만 있고
 * 이 마이그레이션 시점에 전체를 확보하지 못해, 3사이클 시작 시점의 스냅샷 값을 직접 대입한다
 * (laofus 시딩의 "스냅샷 근사" 패턴과 동일 — laofus/scripts/seed.ts 참고).
 *
 * 실행: yarn workspace @holyseed/backend lab:vr:seed
 */
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../../../app.module';
import { VrCycle, VrFill, VrFillKind, VrSetting } from '../modules/vr/entities';

const APPROX = '스냅샷 근사 (외부 앱 화면 값 직접 대입, 중간 체결 히스토리 미보유 — 2026-07-25 이관)';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  const ds = app.get(DataSource);

  await ds.getRepository(VrFill).createQueryBuilder().delete().execute();
  await ds.getRepository(VrCycle).createQueryBuilder().delete().execute();

  // 설정값 확인/보정 (기존 default row가 이미 있을 수 있음)
  let settings = await ds.getRepository(VrSetting).findOne({ where: {} });
  if (!settings) settings = await ds.getRepository(VrSetting).save(ds.getRepository(VrSetting).create({}));
  await ds.getRepository(VrSetting).update(
    { id: settings.id },
    { symbol: 'TQQQ', gFactor: 10, bandPct: 15, depositAmount: 200, poolLimitPct: 75 },
  );

  // 3사이클 (노션 "2사이클" 07-06~07-17 다음, 2주 뒤 시작 — 1~2사이클 히스토리는 노션에 별도 보관)
  const cycle = await ds.getRepository(VrCycle).save(
    ds.getRepository(VrCycle).create({
      cycleNo: 3,
      startDate: '2026-07-20',
      endDate: '2026-07-31',
      vValue: 2432.71,
      poolStart: 3610.93,
      depositAmount: 200,
      isClosed: false,
    }),
  );

  // 3사이클 시작 시점 스냅샷 (외부 앱 화면: 매입금액 $2,006.53 / 평단 $77.174 / 보유 26주 / 현재잔액 $3,810.93)
  await ds.getRepository(VrFill).save(
    ds.getRepository(VrFill).create({
      fillDate: '2026-07-20',
      kind: VrFillKind.INITIAL_BUY,
      price: 77.174,
      quantity: 26,
      amount: 2006.52,
      poolChange: 200.0,
      poolAfter: 3810.93,
      qtyAfter: 26,
      avgPriceAfter: 77.174,
      cycleNo: cycle.cycleNo,
      note: APPROX,
    }),
  );

  console.log(`시딩 완료: cycle ${cycle.cycleNo}(${cycle.startDate}~${cycle.endDate}), V=${cycle.vValue}`);
  console.log(`상태: 보유 26주, 평단 $77.174, Pool $3,810.93`);
  await app.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
