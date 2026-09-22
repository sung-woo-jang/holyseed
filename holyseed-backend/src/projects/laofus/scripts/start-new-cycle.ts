/**
 * laofus 새 사이클 수동 시작 — UI 없이 이 스크립트를 프롬프트로 요청해서 실행한다.
 * (laofus엔 VR의 cycles/rollover 같은 "새 사이클 시작" API가 아예 없음 — 2026-09-23
 * 2차 사이클 전환 때 이 방식으로 우선 처리하기로 함. 나중에 필요해지면 API/UI로 옮길 것.)
 *
 * 하는 일:
 * 1. 현재 열려있는 사이클(symbol 기준 endDate가 null인 가장 최근 cycleNo)을 종료 처리
 *    - endDate = 오늘(KST)
 *    - profit = (종료 시점 cash − 원금) + (남은 보유주식의 매입원가 avgPrice×quantity)
 *      ⚠ 단순 "총매도 − 총매수"로 계산하면 안 됨 — 아직 안 팔린 자투리에 물린 원가를
 *      손실처럼 빼먹는 오류가 생긴다(2026-09-23 실제로 $250 vs $362로 오차 발견·정정됨).
 *      정수 수량만 팔 수 있는 특성상 사이클이 끝나도 소수점 자투리가 항상 남으므로,
 *      recordFill()의 "총매도−총매수"(quantity===0 전제) 공식은 이 스크립트에 그대로
 *      못 쓴다.
 * 2. 새 cycle row 생성 (cycleNo = 이전+1, principal = 인자로 받은 원금, startDate = 오늘)
 * 3. engine_state 갱신
 *    - cycleNo = 새 사이클 번호, t = '0', cash = principal, principal = principal
 *    - quantity / avgPrice는 그대로 유지 — "이월잔고" 방식(1차 사이클 최초 시작 때도
 *      2026-06-16 이월잔고 0.037688주를 그대로 들고 시작했던 것과 동일 패턴). 0으로
 *      밀어버리면 실제 계좌엔 자투리가 남아있어서 다음날부터 "계좌 보유수량과 DB 상태
 *      불일치"로 매매가 중단된다.
 *    - cycleDone = false, lastBuyDecisionUsDate / lastSellDecisionUsDate = null(오늘
 *      크론이 "이미 접수함"으로 스킵되지 않도록)
 * 4. laofus.events에 전환 로그 기록(감사 추적용)
 *
 * 실행: yarn laofus:new-cycle <원금>
 * 예:   yarn laofus:new-cycle 7000
 */
import { NestFactory } from '@nestjs/core';
import { DataSource, IsNull } from 'typeorm';
import { AppModule } from '../../../app.module';
import { LaofusCycle } from '../entities/cycle.entity';
import { LaofusEngineState } from '../entities/engine-state.entity';
import { LaofusEvent } from '../entities/event.entity';

const SYMBOL = 'SOXL';
const round2 = (n: number) => Math.round(n * 100) / 100;

function kstDate(d: Date = new Date()): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(d);
}

async function main() {
  const principalArg = Number(process.argv[2]);
  if (!principalArg || principalArg <= 0) {
    console.error('사용법: yarn laofus:new-cycle <원금>');
    process.exit(1);
  }

  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  const ds = app.get(DataSource);

  const cycleRepo = ds.getRepository(LaofusCycle);
  const stateRepo = ds.getRepository(LaofusEngineState);
  const eventRepo = ds.getRepository(LaofusEvent);

  const state = await stateRepo.findOne({ where: { symbol: SYMBOL } });
  if (!state) throw new Error('engine_state 없음');

  const openCycle = await cycleRepo.findOne({
    where: { symbol: SYMBOL, endDate: IsNull() },
    order: { cycleNo: 'DESC' },
  });
  if (!openCycle) throw new Error('열려있는(진행 중인) 사이클이 없습니다');

  const quantity = Number(state.quantity);
  const avgPrice = Number(state.avgPrice);
  const cash = Number(state.cash);
  const principal = Number(openCycle.principal);
  const remainingCostBasis = round2(quantity * avgPrice);
  const profit = round2(cash - principal + remainingCostBasis);
  const profitPct = Math.round((profit / principal) * 1e4) / 1e4;

  const today = kstDate();

  await cycleRepo.update(openCycle.id, {
    endDate: today,
    profit: String(profit),
    profitPct: String(profitPct),
  });

  const newCycleNo = openCycle.cycleNo + 1;
  await cycleRepo.save({
    symbol: SYMBOL,
    cycleNo: newCycleNo,
    startDate: today,
    principal: String(principalArg),
  });

  await stateRepo.update(
    { symbol: SYMBOL },
    {
      cycleNo: newCycleNo,
      t: '0',
      cash: String(principalArg),
      principal: String(principalArg),
      cycleDone: false,
      lastBuyDecisionUsDate: null,
      lastSellDecisionUsDate: null,
    },
  );

  await eventRepo.save({
    level: 'info',
    source: 'engine',
    message:
      `수동 사이클 전환: ${openCycle.cycleNo}차 종료(순이익 $${profit}, ${(profitPct * 100).toFixed(2)}%) → ` +
      `${newCycleNo}차 시작(원금 $${principalArg}, 이월잔고 ${quantity}주 @ $${avgPrice})`,
  });

  console.log(`${openCycle.cycleNo}차 사이클 종료: profit=$${profit} (${(profitPct * 100).toFixed(2)}%)`);
  console.log(`${newCycleNo}차 사이클 시작: 원금 $${principalArg}, 이월잔고 ${quantity}주 @ $${avgPrice}`);
  await app.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
