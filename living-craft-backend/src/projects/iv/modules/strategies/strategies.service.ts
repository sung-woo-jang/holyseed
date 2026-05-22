import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { IvStrategy } from '../../entities/iv-strategy.entity'
import { IvState } from '../../entities/iv-state.entity'
import { CreateStrategyDto } from './dto/request/create-strategy.dto'

const DEFAULT_USER_ID = process.env.IV_DEFAULT_USER_ID ?? 'owner'

@Injectable()
export class StrategiesService {
  constructor(
    @InjectRepository(IvStrategy)
    private readonly strategyRepo: Repository<IvStrategy>,
    @InjectRepository(IvState)
    private readonly stateRepo: Repository<IvState>,
  ) {}

  async findAll(): Promise<IvStrategy[]> {
    return this.strategyRepo.find({ where: { userId: DEFAULT_USER_ID }, order: { createdAt: 'ASC' } })
  }

  async findOne(id: string): Promise<IvStrategy> {
    const strategy = await this.strategyRepo.findOne({ where: { id, userId: DEFAULT_USER_ID } })
    if (!strategy) throw new NotFoundException('전략을 찾을 수 없습니다.')
    return strategy
  }

  async create(dto: CreateStrategyDto): Promise<IvStrategy> {
    const strategy = this.strategyRepo.create({
      ...dto,
      userId: DEFAULT_USER_ID,
      cycleNo: 1,
      cycleDays: 14,
    })
    const saved = await this.strategyRepo.save(strategy)

    // 초기 state 생성
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

  async getState(id: string): Promise<IvState> {
    await this.findOne(id)
    const state = await this.stateRepo.findOne({ where: { strategyId: id } })
    if (!state) throw new NotFoundException('전략 상태를 찾을 수 없습니다.')
    return state
  }

  async update(id: string, data: { principal?: number; division?: number }): Promise<IvStrategy> {
    await this.findOne(id)
    await this.strategyRepo.update(id, data)
    return this.findOne(id)
  }

  async updateCycleNo(id: string, cycleNo: number): Promise<void> {
    await this.strategyRepo.update(id, { cycleNo })
  }

  async delete(id: string): Promise<void> {
    await this.findOne(id)
    await this.stateRepo.delete({ strategyId: id })
    await this.strategyRepo.delete(id)
  }
}
