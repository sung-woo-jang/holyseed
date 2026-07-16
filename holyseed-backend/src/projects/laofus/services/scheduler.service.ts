import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { Cron, SchedulerRegistry } from '@nestjs/schedule'
import { CronJob } from 'cron'
import { LaofusEngineService } from './engine.service'

/**
 * 무매 엔진 스케줄러 — 미국 정규장 마감 전 실행 창에 맞춰 판단·주문.
 * 매매 크론은 env로 조정 가능 (기본 KST 04:30/05:30 = EDT/EST 마감 30분 전 이중 등록):
 * - LAOFUS_RUN_CRON_1 (기본 '30 4 * * 2-6')
 * - LAOFUS_RUN_CRON_2 (기본 '30 5 * * 2-6')
 * 창 검증 폭은 LAOFUS_WINDOW_MIN/MAX (engine.service 참조) — 크론을 앞당기면 함께 조정.
 *
 * 회수 크론(개장 10분 후, 22:40/23:40)은 고정 — 소수점 주문 개장 배치 체결 회수용.
 *
 * env:
 * - LAOFUS_SCHEDULER=false 로 비활성 (기본 활성) — 로컬 dev와 서버 동시 가동 시 중복 방지
 * - LAOFUS_LIVE=true 로 실주문 (기본 dry-run)
 */
@Injectable()
export class LaofusSchedulerService implements OnModuleInit {
  private readonly logger = new Logger('LaofusScheduler')
  private runJobs: { slot: string; name: string }[] = []

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

  /** cron 표현식 'm h * * d'에서 'HH:MM' 슬롯 라벨 추출 */
  private slotOf(cron: string): string {
    const [m, h] = cron.trim().split(/\s+/)
    const pad = (v: string) => v.padStart(2, '0')
    return /^\d+$/.test(m) && /^\d+$/.test(h) ? `${pad(h)}:${pad(m)}` : cron
  }

  onModuleInit(): void {
    const specs = [
      process.env.LAOFUS_RUN_CRON_1 ?? '30 4 * * 2-6',
      process.env.LAOFUS_RUN_CRON_2 ?? '30 5 * * 2-6',
    ]
    specs.forEach((spec, i) => {
      const name = `laofus-run-${i + 1}`
      const slot = this.slotOf(spec)
      const job = new CronJob(spec, () => void this.tick(slot), null, false, 'Asia/Seoul')
      this.registry.addCronJob(name, job)
      job.start()
      this.runJobs.push({ slot, name })
      this.logger.log(`매매 크론 등록: ${name} '${spec}' (KST ${slot})`)
    })
  }

  /** 등록된 매매 크론의 다음 발화 시각 (ISO, 오름차순) — 대시보드 카운트다운용 */
  getNextRuns(): { slot: string; at: string }[] {
    return this.runJobs
      .map(({ slot, name }) => ({
        slot,
        at: this.registry.getCronJob(name).nextDate().toJSDate().toISOString(),
      }))
      .sort((a, b) => a.at.localeCompare(b.at))
  }

  // 개장 직후 체결 회수 — 소수점 금액주문은 다음 세션 개장 배치로 체결되므로
  // 개장(EDT 22:30 / EST 23:30 KST) 10분 뒤 체결분을 DB에 반영한다.
  @Cron('40 22 * * 1-5', { name: 'laofus-reconcile-edt', timeZone: 'Asia/Seoul' })
  async reconcileEdt(): Promise<void> {
    await this.reconcileTick('22:40')
  }

  @Cron('40 23 * * 1-5', { name: 'laofus-reconcile-est', timeZone: 'Asia/Seoul' })
  async reconcileEst(): Promise<void> {
    await this.reconcileTick('23:40')
  }

  private async reconcileTick(slot: string): Promise<void> {
    if (!this.enabled) return
    this.logger.log(`회수 스케줄 ${slot} 트리거`)
    await this.engine.reconcileOnly()
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
