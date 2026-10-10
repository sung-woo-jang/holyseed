import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { SpacexService } from './spacex.service';

/**
 * 매일 정해진 시각에 모으기 종목(SPCX·UPRO …)의 토스 체결 내역을 끌어와 기록에 채워 넣는 동기화 크론.
 * 실주문을 내는 게 아니라 이미 체결된 내역을 읽어서 우리 기록에 반영만 하는 거라
 * LIVE 플래그 없이 항상 켜짐 — orderId로 중복 방지되어 있어 여러 프로세스에서
 * 동시에 돌아도 안전.
 *
 * env: SPACEX_SYNC_CRON (기본 KST 09:10 '10 9 * * *')
 */
@Injectable()
export class SpacexSchedulerService implements OnModuleInit {
  private readonly logger = new Logger('SpacexScheduler');

  constructor(
    private readonly spacex: SpacexService,
    private readonly registry: SchedulerRegistry,
  ) {}

  onModuleInit(): void {
    const spec = process.env.SPACEX_SYNC_CRON ?? '10 9 * * *';
    const job = new CronJob(spec, () => void this.tick(), null, false, 'Asia/Seoul');
    this.registry.addCronJob('spacex-sync', job);
    job.start();
    this.logger.log(`스페이스X 동기화 크론 등록: 'spacex-sync' '${spec}' (KST)`);
  }

  private async tick(): Promise<void> {
    try {
      const { synced, bySymbol } = await this.spacex.syncFromToss();
      this.logger.log(`모으기 동기화 완료 — 신규 ${synced}건 ${JSON.stringify(bySymbol)}`);
    } catch (e) {
      this.logger.error(`모으기 동기화 실패: ${(e as Error).message}`);
    }
  }
}
