import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { IvDailyPlan } from '../../entities/iv-daily-plan.entity'
import { IvExecution } from '../../entities/iv-execution.entity'
import { IvState } from '../../entities/iv-state.entity'
import { IvStrategy } from '../../entities/iv-strategy.entity'
import { IvPrice } from '../../entities/iv-price.entity'
import { InfiniteBuyingStrategy } from '../../calculator/infinite/infinite-buying.strategy'
import type { Division, InfiniteMode, InfiniteState, Ticker } from '../../calculator/common/types'

const calculator = new InfiniteBuyingStrategy()

@Injectable()
export class PlansService {
  constructor(
    @InjectRepository(IvDailyPlan) private readonly planRepo: Repository<IvDailyPlan>,
    @InjectRepository(IvState) private readonly stateRepo: Repository<IvState>,
    @InjectRepository(IvStrategy) private readonly strategyRepo: Repository<IvStrategy>,
    @InjectRepository(IvPrice) private readonly priceRepo: Repository<IvPrice>,
    @InjectRepository(IvExecution) private readonly execRepo: Repository<IvExecution>,
  ) {}

  async getTodayPlan(strategyId: string): Promise<IvDailyPlan> {
    const today = new Date().toISOString().slice(0, 10)

    // 캐시 조회 — closePrice null이면 시세 갱신 후 재생성
    const cached = await this.planRepo.findOne({ where: { strategyId, planDate: today } })
    if (cached && cached.closePrice !== null) return cached
    if (cached) await this.planRepo.delete({ strategyId, planDate: today })

    return this.generatePlan(strategyId, today)
  }

  async getPlanByDate(strategyId: string, date: string): Promise<IvDailyPlan> {
    const existing = await this.planRepo.findOne({ where: { strategyId, planDate: date } })
    if (existing) return existing
    return this.generatePlan(strategyId, date)
  }

  async generatePlan(strategyId: string, date: string): Promise<IvDailyPlan> {
    const [strategy, state] = await Promise.all([
      this.strategyRepo.findOne({ where: { id: strategyId } }),
      this.stateRepo.findOne({ where: { strategyId } }),
    ])
    if (!strategy || !state) throw new NotFoundException('전략 또는 상태를 찾을 수 없습니다.')

    const calcState: InfiniteState = {
      ticker: strategy.ticker as Ticker,
      division: strategy.division as Division,
      principal: strategy.principal,
      cycleNo: strategy.cycleNo,
      quantity: state.quantity,
      cash: state.cash,
      avgPrice: state.avgPrice,
      tValue: state.tValue,
      mode: (state.mode ?? 'cycle_start') as InfiniteMode,
      recentCloses: state.recentCloses ?? [],
      lastClose: state.lastClose ?? 0,
    }

    // 리버스 첫날 여부: reverse 모드 진입 후 매도 체결이 없으면 첫날
    let isReverseFirstDay = false
    if (calcState.mode === 'reverse') {
      const lastSell = await this.execRepo.findOne({
        where: { strategyId },
        order: { execDate: 'DESC', createdAt: 'DESC' },
      })
      // 마지막 체결의 stateAfter가 reverse 모드인지 확인
      const lastStateAfter = lastSell?.stateAfter as Record<string, unknown> | undefined
      const wasPrevReverse = lastStateAfter?.mode === 'reverse'
      isReverseFirstDay = !wasPrevReverse
    }

    const result = calculator.computeDailyPlan(calcState, isReverseFirstDay)

    const plan = this.planRepo.create({
      strategyId,
      planDate: date,
      strategyType: strategy.strategyType,
      tValue: state.tValue,
      mode: state.mode,
      avgPrice: state.avgPrice,
      cash: state.cash,
      closePrice: state.lastClose,
      buyRows: result.buyRows,
      sellRows: result.sellRows,
      largeNumberBuy: result.largeNumberBuy,
    })

    return this.planRepo.save(plan)
  }

  async upsertPlan(strategyId: string, date: string): Promise<IvDailyPlan> {
    await this.planRepo.delete({ strategyId, planDate: date })
    return this.generatePlan(strategyId, date)
  }
}
