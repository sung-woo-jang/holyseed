import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { LaofusEngineService } from './engine.service';

/**
 * 무매 엔진 스케줄러.
 *
 * 20분할 온주 LOC 전환(2026-09) 이후 매수·매도 둘 다 engine_state만으로 계산되는 스탠딩 LOC라
 * 현재가 관찰이 필요 없다 — 그래서 하루 한 번 `engine.run()`을 부르는 크론(LAOFUS_LEGS_CRON,
 * 기본 KST 09:00, 월~금) 하나면 충분하다. 개장 시각(EDT/EST)과도 무관해서 이중 등록도 필요 없음.
 * 오늘이 휴장일이거나 이미 오늘 접수했으면(lastBuyDecisionUsDate/lastSellDecisionUsDate) 자동 스킵.
 *
 * 요일 범위는 반드시 월~금(1-5)이어야 한다 — 토스 market-calendar API의 today.date는 KST 날짜
 * 그대로가 그날의 미국 정규장 세션을 가리키므로(마켓 캘린더 응답으로 직접 확인, 2026-09-14),
 * 화~토(2-6)로 잡으면 월요일 정규장이 통째로 누락된다(2026-09-14 실제 발생 버그).
 *
 * (예전엔 매도가 현재가 판단이 필요해서 장중 5분 감시 + 마감 전 EOD 이중 크론이 있었는데,
 * 방법론 원문대로 매도도 "보유량 1/4+3/4 스탠딩 LOC"로 걸 수 있다는 걸 확인하고 통째로 걷어냄
 * — 겹치는 두 매도 leg를 더하면 정확히 100%라 오버셀 없이 매수와 완전히 대칭 구조가 됨.)
 *
 * 회수 크론은 두 타이밍에 고정 등록:
 * - 마감 5·10분 후(05:05/05:10 EDT, 06:05/06:10 EST) — 체결이 마감 직후 바로 반영되는 경우 대비
 * - 개장 10분 후(22:40/23:40) — "LOC 주문 개장 배치 체결" 회수용(토스가 마감 시점 대신 다음
 *   개장 배치에서 체결을 확정하는 경우 대비 안전망)
 * 마감 시각(05:00/06:00 KST)은 "그 전날 저녁에 개장한" 세션의 결과라 요일이 하루 밀림 —
 * 월요일 개장(월요일 KST 저녁)의 마감은 화요일 KST 새벽이므로 화~토(2-6)로 등록해야
 * 월~금 5세션의 마감을 전부 커버한다(개장 크론의 월~금(1-5)과는 다른 범위, 착각 주의 —
 * `laofus-wealth-snapshot`도 같은 이유로 2-6 사용).
 *
 * env:
 * - LAOFUS_SCHEDULER=false 로 비활성 (기본 활성) — 로컬 dev와 서버 동시 가동 시 중복 방지
 * - LAOFUS_LIVE=true 로 실주문 (기본 dry-run)
 */
@Injectable()
export class LaofusSchedulerService implements OnModuleInit {
  private readonly logger = new Logger('LaofusScheduler');
  private runJobs: { slot: string; name: string }[] = [];

  constructor(
    private readonly engine: LaofusEngineService,
    private readonly registry: SchedulerRegistry,
  ) {}

  private get enabled(): boolean {
    return process.env.LAOFUS_SCHEDULER !== 'false';
  }

  private get live(): boolean {
    return process.env.LAOFUS_LIVE === 'true';
  }

  /** cron 표현식 'm h * * d'에서 'HH:MM' 슬롯 라벨 추출 */
  private slotOf(cron: string): string {
    const [m, h] = cron.trim().split(/\s+/);
    const pad = (v: string) => v.padStart(2, '0');
    return /^\d+$/.test(m) && /^\d+$/.test(h) ? `${pad(h)}:${pad(m)}` : cron;
  }

  onModuleInit(): void {
    const spec = process.env.LAOFUS_LEGS_CRON ?? process.env.LAOFUS_BUY_CRON_1 ?? '0 9 * * 1-5';
    const name = 'laofus-legs-1';
    const slot = this.slotOf(spec);
    const job = new CronJob(spec, () => void this.tick(slot), null, false, 'Asia/Seoul');
    this.registry.addCronJob(name, job);
    job.start();
    this.runJobs.push({ slot, name });
    this.logger.log(`매수/매도 LOC 크론 등록: ${name} '${spec}' (KST ${slot})`);
  }

  /** 등록된 매매 크론의 다음 발화 시각 (ISO, 오름차순) — 대시보드 카운트다운용 */
  getNextRuns(): { slot: string; at: string }[] {
    return this.runJobs
      .map(({ slot, name }) => ({
        slot,
        at: this.registry.getCronJob(name).nextDate().toJSDate().toISOString(),
      }))
      .sort((a, b) => a.at.localeCompare(b.at));
  }

  @Cron('5 5 * * 2-6', { name: 'laofus-reconcile-close-edt-1', timeZone: 'Asia/Seoul' })
  async reconcileCloseEdt1(): Promise<void> {
    await this.reconcileTick('05:05');
  }

  @Cron('10 5 * * 2-6', { name: 'laofus-reconcile-close-edt-2', timeZone: 'Asia/Seoul' })
  async reconcileCloseEdt2(): Promise<void> {
    await this.reconcileTick('05:10');
  }

  @Cron('5 6 * * 2-6', { name: 'laofus-reconcile-close-est-1', timeZone: 'Asia/Seoul' })
  async reconcileCloseEst1(): Promise<void> {
    await this.reconcileTick('06:05');
  }

  @Cron('10 6 * * 2-6', { name: 'laofus-reconcile-close-est-2', timeZone: 'Asia/Seoul' })
  async reconcileCloseEst2(): Promise<void> {
    await this.reconcileTick('06:10');
  }

  @Cron('40 22 * * 1-5', { name: 'laofus-reconcile-edt', timeZone: 'Asia/Seoul' })
  async reconcileEdt(): Promise<void> {
    await this.reconcileTick('22:40');
  }

  @Cron('40 23 * * 1-5', { name: 'laofus-reconcile-est', timeZone: 'Asia/Seoul' })
  async reconcileEst(): Promise<void> {
    await this.reconcileTick('23:40');
  }

  private async reconcileTick(slot: string): Promise<void> {
    if (!this.enabled) {
      const message = `회수 스케줄 ${slot} — LAOFUS_SCHEDULER=false, 스킵`;
      this.logger.log(message);
      await this.engine.logSchedulerEvent('warn', message);
      return;
    }
    this.logger.log(`회수 스케줄 ${slot} 트리거`);
    await this.engine.reconcileOnly();
  }

  private async tick(slot: string): Promise<void> {
    if (!this.enabled) {
      const message = `스케줄 ${slot} — LAOFUS_SCHEDULER=false, 스킵`;
      this.logger.log(message);
      await this.engine.logSchedulerEvent('warn', message);
      return;
    }
    this.logger.log(`스케줄 ${slot} 트리거 (${this.live ? 'LIVE' : 'dry-run'})`);
    await this.engine.run({ live: this.live, force: false, injectedPrice: null });
  }

  @Cron('0 6 * * 2-6', { name: 'laofus-wealth-snapshot', timeZone: 'Asia/Seoul' })
  async wealthSnapshotTick(): Promise<void> {
    if (!this.enabled) {
      this.logger.log('스케줄 자산 스냅샷 — LAOFUS_SCHEDULER=false, 스킵');
      return;
    }
    try {
      const saved = await this.engine.captureAccountSnapshot();
      await this.engine.logSchedulerEvent('info', `일별 자산 스냅샷 기록: ${saved.date} = ₩${saved.totalValueKrw}`);
    } catch (e) {
      await this.engine.logSchedulerEvent('error', `자산 스냅샷 기록 실패: ${e instanceof Error ? e.message : e}`);
    }
  }
}
