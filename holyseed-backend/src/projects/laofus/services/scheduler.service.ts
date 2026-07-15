import { Injectable, Logger } from '@nestjs/common'
import { Cron, SchedulerRegistry } from '@nestjs/schedule'
import { LaofusEngineService } from './engine.service'

/**
 * 무매 엔진 스케줄러 — 미국 정규장 마감 30분 전 실행.
 * KST 04:30 (EDT 마감 05:00 대비) + 05:30 (EST 마감 06:00 대비) 이중 등록,
 * checkWindow가 마감 20~35분 전 창을 검증하므로 해당 없는 쪽은 자동 스킵.
 *
 * env:
 * - LAOFUS_SCHEDULER=false 로 비활성 (기본 활성) — 로컬 dev와 서버 동시 가동 시 중복 방지
 * - LAOFUS_LIVE=true 로 실주문 (기본 dry-run)
 */
@Injectable()
export class LaofusSchedulerService {
  private readonly logger = new Logger('LaofusScheduler')

  constructor(
    private readonly engine: LaofusEngineService,
    private readonly registry: SchedulerRegistry
  ) {}

  private get enabled(): boolean {
    return process.env.LAOFUS_SCHEDULER !== 'false'
  }

  private get live(): boolean {
    return process.env.LAOFUS_LIVE === 'true'
  }

  /** 등록된 cron의 다음 발화 시각 (ISO, 오름차순) — 대시보드 카운트다운용 */
  getNextRuns(): { slot: string; at: string }[] {
    return [
      { slot: '04:30', name: 'laofus-edt' },
      { slot: '05:30', name: 'laofus-est' },
    ]
      .map(({ slot, name }) => ({
        slot,
        at: this.registry.getCronJob(name).nextDate().toJSDate().toISOString(),
      }))
      .sort((a, b) => a.at.localeCompare(b.at))
  }

  @Cron('30 4 * * 2-6', { name: 'laofus-edt', timeZone: 'Asia/Seoul' })
  async runEdt(): Promise<void> {
    await this.tick('04:30')
  }

  @Cron('30 5 * * 2-6', { name: 'laofus-est', timeZone: 'Asia/Seoul' })
  async runEst(): Promise<void> {
    await this.tick('05:30')
  }

  private async tick(slot: string): Promise<void> {
    if (!this.enabled) {
      this.logger.log(`스케줄 ${slot} — LAOFUS_SCHEDULER=false, 스킵`)
      return
    }
    this.logger.log(`스케줄 ${slot} 트리거 (${this.live ? 'LIVE' : 'dry-run'})`)
    await this.engine.run({ live: this.live, force: false, injectedPrice: null })
  }
}
