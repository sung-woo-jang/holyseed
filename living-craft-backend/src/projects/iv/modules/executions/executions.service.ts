import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { IvExecution } from '../../entities/iv-execution.entity'
import { IvState } from '../../entities/iv-state.entity'
import { IvStrategy } from '../../entities/iv-strategy.entity'
import { IvDailyPlan } from '../../entities/iv-daily-plan.entity'
import { InfiniteBuyingStrategy } from '../../calculator/infinite/infinite-buying.strategy'
import type { Division, ExecType, FillInput, InfiniteMode, InfiniteState, Ticker } from '../../calculator/common/types'
import { CreateExecutionsDto } from './dto/request/create-executions.dto'

const calculator = new InfiniteBuyingStrategy()

@Injectable()
export class ExecutionsService {
  constructor(
    @InjectRepository(IvExecution) private readonly execRepo: Repository<IvExecution>,
    @InjectRepository(IvState) private readonly stateRepo: Repository<IvState>,
    @InjectRepository(IvStrategy) private readonly strategyRepo: Repository<IvStrategy>,
    @InjectRepository(IvDailyPlan) private readonly planRepo: Repository<IvDailyPlan>,
  ) {}

  async findAll(strategyId: string): Promise<IvExecution[]> {
    return this.execRepo.find({
      where: { strategyId },
      order: { execDate: 'DESC', createdAt: 'DESC' },
    })
  }

  private async rebuildState(strategyId: string): Promise<void> {
    const strategy = await this.strategyRepo.findOne({ where: { id: strategyId } })
    if (!strategy) throw new NotFoundException('전략을 찾을 수 없습니다.')

    const executions = await this.execRepo.find({
      where: { strategyId },
      order: { execDate: 'ASC', createdAt: 'ASC' },
    })

    let current: InfiniteState = {
      ticker: strategy.ticker as Ticker,
      division: strategy.division as Division,
      principal: strategy.principal,
      cycleNo: strategy.cycleNo,
      quantity: 0,
      cash: strategy.principal,
      avgPrice: 0,
      tValue: 0,
      mode: 'cycle_start',
      recentCloses: [],
      lastClose: 0,
    }

    for (const exec of executions) {
      const stateBefore = { ...current }
      if (exec.execType !== 'no_exec') {
        const fill: FillInput = {
          execType: exec.execType as ExecType,
          price: exec.execPrice ?? 0,
          qty: exec.execQty ?? 0,
        }
        const result = calculator.applyFills(current, [fill])
        current = result.newState
      }
      await this.execRepo.update(exec.id, {
        stateBefore: stateBefore as unknown as Record<string, unknown>,
        stateAfter: current as unknown as Record<string, unknown>,
      })
    }

    await this.stateRepo.update(strategyId, {
      quantity: current.quantity,
      cash: current.cash,
      avgPrice: current.avgPrice,
      tValue: current.tValue,
      mode: current.mode,
      recentCloses: current.recentCloses,
    })
  }

  async deleteOne(strategyId: string, execId: string): Promise<void> {
    const exec = await this.execRepo.findOne({ where: { id: execId, strategyId } })
    if (!exec) throw new NotFoundException('체결 내역을 찾을 수 없습니다.')
    await this.execRepo.delete(execId)
    await this.rebuildState(strategyId)
  }

  async updateOne(strategyId: string, execId: string, data: { execType?: string; price?: number; qty?: number }): Promise<void> {
    const exec = await this.execRepo.findOne({ where: { id: execId, strategyId } })
    if (!exec) throw new NotFoundException('체결 내역을 찾을 수 없습니다.')

    const newExecType = data.execType ?? exec.execType
    const isNoExec = newExecType === 'no_exec'
    const price = isNoExec ? null : (data.price ?? exec.execPrice)
    const qty = isNoExec ? null : (data.qty ?? exec.execQty)

    await this.execRepo.update(execId, {
      ...(data.execType ? { execType: data.execType } : {}),
      execPrice: price,
      execQty: qty,
      execAmount: price != null && qty != null ? price * qty : null,
    })
    await this.rebuildState(strategyId)
  }

  async create(strategyId: string, dto: CreateExecutionsDto) {
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

    const fills: FillInput[] = dto.rows.map((r) => ({
      execType: r.execType as ExecType,
      price: r.price,
      qty: r.qty,
    }))

    const stateBefore = { ...calcState }
    const result = calculator.applyFills(calcState, fills)
    const { newState, cycleEnded, profit, profitPct } = result

    // state 갱신
    await this.stateRepo.update(strategyId, {
      quantity: newState.quantity,
      cash: newState.cash,
      avgPrice: newState.avgPrice,
      tValue: newState.tValue,
      mode: newState.mode,
      recentCloses: newState.recentCloses,
    })

    // execution 저장
    const executions = await Promise.all(
      dto.rows.map((row) =>
        this.execRepo.save(
          this.execRepo.create({
            strategyId,
            execDate: dto.execDate,
            execType: row.execType,
            execPrice: row.price,
            execQty: row.qty,
            execAmount: row.price * row.qty,
            stateBefore: stateBefore as unknown as Record<string, unknown>,
            stateAfter: newState as unknown as Record<string, unknown>,
            note: row.note,
          }),
        ),
      ),
    )

    // 내일 계획 플래그: planRepo에서 오늘 plan 캐시 무효화 (다음 조회 시 재생성)
    await this.planRepo.delete({ strategyId, planDate: dto.execDate })

    return {
      executions,
      newState,
      cycleEnded,
      ...(cycleEnded && { profit, profitPct }),
    }
  }
}
