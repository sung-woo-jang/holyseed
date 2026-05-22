import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { IvState } from '../../entities/iv-state.entity'
import { IvStrategy } from '../../entities/iv-strategy.entity'
import { startNextCycleCompound, startNextCycleSimple } from '../../calculator/infinite/cycle-end'
import type { Division, InfiniteMode, InfiniteState, Ticker } from '../../calculator/common/types'

@Injectable()
export class CyclesService {
  constructor(
    @InjectRepository(IvState) private readonly stateRepo: Repository<IvState>,
    @InjectRepository(IvStrategy) private readonly strategyRepo: Repository<IvStrategy>,
  ) {}

  async startNext(strategyId: string, mode: 'compound' | 'simple') {
    const [strategy, state] = await Promise.all([
      this.strategyRepo.findOne({ where: { id: strategyId } }),
      this.stateRepo.findOne({ where: { strategyId } }),
    ])
    if (!strategy || !state) throw new NotFoundException('전략 또는 상태를 찾을 수 없습니다.')
    if (state.quantity !== 0) throw new BadRequestException('보유수량이 0이어야 새 사이클을 시작할 수 있습니다.')

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

    const newState = mode === 'compound'
      ? startNextCycleCompound(calcState)
      : startNextCycleSimple(calcState)

    await this.strategyRepo.update(strategyId, {
      cycleNo: newState.cycleNo,
      principal: newState.principal,
    })

    await this.stateRepo.update(strategyId, {
      quantity: 0,
      cash: newState.cash,
      avgPrice: 0,
      tValue: 0,
      mode: 'cycle_start',
      recentCloses: [],
    })

    return { cycleNo: newState.cycleNo, cash: newState.cash, principal: newState.principal }
  }

  async forceEnd(strategyId: string) {
    const strategy = await this.strategyRepo.findOne({ where: { id: strategyId } })
    if (!strategy) throw new NotFoundException('전략을 찾을 수 없습니다.')

    await this.strategyRepo.update(strategyId, { cycleNo: strategy.cycleNo + 1 })
    await this.stateRepo.update(strategyId, {
      quantity: 0,
      cash: strategy.principal,
      avgPrice: 0,
      tValue: 0,
      mode: 'cycle_start',
      recentCloses: [],
    })
  }
}
