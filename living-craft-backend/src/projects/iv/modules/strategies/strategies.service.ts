import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { IvStrategy } from '../../entities/iv-strategy.entity'
import { IvState } from '../../entities/iv-state.entity'
import { CreateStrategyDto } from './dto/request/create-strategy.dto'

@Injectable()
export class StrategiesService {
  constructor(
    @InjectRepository(IvStrategy)
    private readonly strategyRepo: Repository<IvStrategy>,
    @InjectRepository(IvState)
    private readonly stateRepo: Repository<IvState>,
  ) {}

  async findAll(userId: string): Promise<IvStrategy[]> {
    return this.strategyRepo.find({ where: { userId }, order: { createdAt: 'ASC' } })
  }

  async findOne(id: string, userId: string): Promise<IvStrategy> {
    const strategy = await this.strategyRepo.findOne({ where: { id, userId } })
    if (!strategy) throw new NotFoundException('전략을 찾을 수 없습니다.')
    return strategy
  }

  async create(userId: string, dto: CreateStrategyDto): Promise<IvStrategy> {
    const strategy = this.strategyRepo.create({ ...dto, userId, cycleNo: 1, cycleDays: 14 })
    const saved = await this.strategyRepo.save(strategy)

    const state = this.stateRepo.create({
      strategyId: saved.id,
      quantity: 0,
      cash: saved.principal,
      avgPrice: 0,
      tValue: 0,
      mode: 'cycle_start',
      recentCloses: [],
    })
    await this.stateRepo.save(state)

    return saved
  }

  async getState(id: string, userId: string): Promise<IvState> {
    await this.findOne(id, userId)
    const state = await this.stateRepo.findOne({ where: { strategyId: id } })
    if (!state) throw new NotFoundException('전략 상태를 찾을 수 없습니다.')
    return state
  }

  async getPortfolioSummary(userId: string) {
    const strategies = await this.findAll(userId)
    const states = await Promise.all(
      strategies.map((s) => this.stateRepo.findOne({ where: { strategyId: s.id } })),
    )
    let totalPrincipal = 0, totalCash = 0, totalStockValue = 0
    for (let i = 0; i < strategies.length; i++) {
      const st = states[i]
      if (!st) continue
      totalPrincipal += Number(strategies[i].principal)
      totalCash += Number(st.cash)
      totalStockValue += Number(st.quantity) * Number(st.lastClose ?? st.avgPrice ?? 0)
    }
    const totalEvaluation = totalCash + totalStockValue
    const totalPnl = totalEvaluation - totalPrincipal
    const totalPnlPct = totalPrincipal > 0 ? (totalPnl / totalPrincipal) * 100 : 0
    return { totalPrincipal, totalCash, totalStockValue, totalEvaluation, totalPnl, totalPnlPct, count: strategies.length }
  }

  async update(id: string, userId: string, data: { principal?: number; division?: number }): Promise<IvStrategy> {
    const strategy = await this.findOne(id, userId)

    // 원금이 바뀌면 잔금에 차액을 반영
    if (data.principal != null && data.principal !== Number(strategy.principal)) {
      const diff = data.principal - Number(strategy.principal)
      await this.stateRepo
        .createQueryBuilder()
        .update()
        .set({ cash: () => `cash + ${diff}` })
        .where('strategy_id = :id', { id })
        .execute()
    }

    await this.strategyRepo.update(id, data)
    return this.findOne(id, userId)
  }

  async updateCycleNo(id: string, cycleNo: number): Promise<void> {
    await this.strategyRepo.update(id, { cycleNo })
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.findOne(id, userId)
    await this.stateRepo.delete({ strategyId: id })
    await this.strategyRepo.delete(id)
  }
}
