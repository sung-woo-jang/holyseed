import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { LaofusEngineService } from './engine.service';

/**
 * 무매 엔진 스케줄러 — 미국 정규장 마감 전 실행 창에 맞춰 판단·주문.
 * 매매 크론은 env로 조정 가능 (운용값은 KST 03:25/04:25 = EDT/EST 마감 95분 전 이중 등록 —
 * 토스 앱 소수점 주문가능시간 22:30~04:00(EDT)/23:30~05:00(EST) 대비 여유 확보):
 * - LAOFUS_RUN_CRON_1 (기본 '30 4 * * 2-6')
 * - LAOFUS_RUN_CRON_2 (기본 '30 5 * * 2-6')
 * 창 검증 폭은 LAOFUS_WINDOW_MIN/MAX (engine.service 참조) — 크론을 앞당기면 함께 조정.
 *
 * 회수 크론(개장 10분 후, 22:40/23:40)은 고정 — 소수점 주문 개장 배치 체결 회수용.
 *
 * 장중 쿼터매도/전량매도 즉시 감시(LAOFUS_SELL_MONITOR_CRON, 기본 5분 주기) — 정규장 시간에만
 * 동작하며, EOD 판단과 lastDecisionUsDate를 공유해 하루 1회로 제한(engine.service.monitorSell 참조).
 * LAOFUS_SELL_MONITOR=false 로 이 감시만 독립적으로 끌 수 있음(전체는 LAOFUS_SCHEDULER=false).
 * LAOFUS_SELL_MONITOR_LIVE — 신규 기능이라 EOD(LAOFUS_LIVE)와 별도로 dry-run 검증 기간을 둘 수 있게
 * 분리된 실주문 스위치(미설정 시 LAOFUS_LIVE를 그대로 따름). 'false'로 두면 EOD는 라이브인 채로
 * 이 감시만 로그만 남기고(주문 미실행) 지켜볼 수 있다.
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

  private get sellMonitorEnabled(): boolean {
    return process.env.LAOFUS_SELL_MONITOR !== 'false';
  }

  /** 미설정 시 LAOFUS_LIVE를 따름 — EOD는 라이브를 유지한 채 이 기능만 별도로 dry-run 검증 가능 */
  private get sellMonitorLive(): boolean {
    const override = process.env.LAOFUS_SELL_MONITOR_LIVE;
    if (override === 'true') return true;
    if (override === 'false') return false;
    return this.live;
  }

  /** cron 표현식 'm h * * d'에서 'HH:MM' 슬롯 라벨 추출 */
  private slotOf(cron: string): string {
    const [m, h] = cron.trim().split(/\s+/);
    const pad = (v: string) => v.padStart(2, '0');
    return /^\d+$/.test(m) && /^\d+$/.test(h) ? `${pad(h)}:${pad(m)}` : cron;
  }

  onModuleInit(): void {
    const specs = [process.env.LAOFUS_RUN_CRON_1 ?? '30 4 * * 2-6', process.env.LAOFUS_RUN_CRON_2 ?? '30 5 * * 2-6'];
    specs.forEach((spec, i) => {
      const name = `laofus-run-${i + 1}`;
      const slot = this.slotOf(spec);
      const job = new CronJob(spec, () => void this.tick(slot), null, false, 'Asia/Seoul');
      this.registry.addCronJob(name, job);
      job.start();
      this.runJobs.push({ slot, name });
      this.logger.log(`매매 크론 등록: ${name} '${spec}' (KST ${slot})`);
    });

    if (this.sellMonitorEnabled) {
      const spec = process.env.LAOFUS_SELL_MONITOR_CRON ?? '*/5 * * * *';
      const job = new CronJob(spec, () => void this.sellMonitorTick(), null, false, 'Asia/Seoul');
      this.registry.addCronJob('laofus-sell-monitor', job);
      job.start();
      this.logger.log(`장중 매도 감시 크론 등록: 'laofus-sell-monitor' '${spec}'`);
    } else {
      this.logger.log('장중 매도 감시 — LAOFUS_SELL_MONITOR=false, 등록 스킵');
    }
  }

  private async sellMonitorTick(): Promise<void> {
    if (!this.enabled) return;
    await this.engine.monitorSell({ live: this.sellMonitorLive });
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

  // 개장 직후 체결 회수 — 소수점 금액주문은 다음 세션 개장 배치로 체결되므로
  // 개장(EDT 22:30 / EST 23:30 KST) 10분 뒤 체결분을 DB에 반영한다.
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

  // 실계좌 총자산 일별 스냅샷 — 화~토 06:00 KST(EDT/EST 마감 모두 확정된 시점). 주문이 아니라 조회이므로 LAOFUS_LIVE와 무관하게 기록
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
