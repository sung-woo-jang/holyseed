import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { VrEngineService } from './vr-engine.service';

/**
 * VR(TQQQ 밸류 리밸런싱) 스케줄러 — 5분마다 엔진 틱(회수 → 예약주문 계단 보충 → 안전장치)을 돌린다.
 * 하루 시작(09:00 첫 틱)에 전날 만료된 예약주문이 자동으로 다시 걸리고, 체결로 부족해진 단계는 다음 틱에 채워진다.
 * (세션/트레이딩 데이 판별은 VrEngineService.run()이 처리)
 *
 * env:
 * - VR_RUN_CRON (기본 매시 5분, 운영은 5분마다)
 * - VR_SCHEDULER=false 로 비활성 (기본 활성)
 * - VR_LIVE=true 로 실주문 (기본 dry-run)
 */
@Injectable()
export class VrSchedulerService implements OnModuleInit {
  private readonly logger = new Logger('VrScheduler');

  constructor(
    private readonly engine: VrEngineService,
    private readonly registry: SchedulerRegistry,
  ) {}

  private get enabled(): boolean {
    return process.env.VR_SCHEDULER !== 'false';
  }

  private get live(): boolean {
    return process.env.VR_LIVE === 'true';
  }

  onModuleInit(): void {
    const spec = process.env.VR_RUN_CRON ?? '5 * * * *';
    const job = new CronJob(spec, () => void this.tick(), null, false, 'Asia/Seoul');
    this.registry.addCronJob('vr-run', job);
    job.start();
    this.logger.log(`VR 크론 등록: 'vr-run' '${spec}' (KST)`);
  }

  /** 다음 발화 시각 (ISO) — 대시보드 카운트다운용 */
  getNextRun(): string {
    return this.registry.getCronJob('vr-run').nextDate().toJSDate().toISOString();
  }

  private async tick(): Promise<void> {
    if (!this.enabled) {
      const message = 'VR 스케줄 — VR_SCHEDULER=false, 스킵';
      this.logger.log(message);
      await this.engine.logSchedulerEvent('warn', message);
      return;
    }
    this.logger.log(`VR 스케줄 트리거 (${this.live ? 'LIVE' : 'dry-run'})`);
    await this.engine.run({ live: this.live, force: false });
  }
}
