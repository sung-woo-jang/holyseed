import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

const numTransformer = { to: (v: number) => v, from: (v: string) => v ? parseFloat(v) : null }

@Entity('daily_plans', { schema: 'iv' })
@Index(['strategyId', 'planDate'], { unique: true })
export class IvDailyPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'strategy_id', type: 'uuid' })
  strategyId: string

  @Column({ name: 'plan_date', type: 'date' })
  planDate: string

  @Column({ name: 'strategy_type' })
  strategyType: string

  @Column({ name: 't_value', type: 'numeric', precision: 10, scale: 6, nullable: true, transformer: numTransformer })
  tValue: number

  @Column({ nullable: true })
  mode: string

  @Column({ name: 'v_value', type: 'numeric', precision: 14, scale: 4, nullable: true, transformer: numTransformer })
  vValue: number

  @Column({ name: 'min_band', type: 'numeric', precision: 14, scale: 4, nullable: true, transformer: numTransformer })
  minBand: number

  @Column({ name: 'max_band', type: 'numeric', precision: 14, scale: 4, nullable: true, transformer: numTransformer })
  maxBand: number

  @Column({ name: 'avg_price', type: 'numeric', precision: 14, scale: 4, nullable: true, transformer: numTransformer })
  avgPrice: number

  @Column({ type: 'numeric', precision: 14, scale: 2, nullable: true, transformer: numTransformer })
  cash: number

  @Column({ name: 'close_price', type: 'numeric', precision: 14, scale: 4, nullable: true, transformer: numTransformer })
  closePrice: number

  @Column({ name: 'buy_rows', type: 'jsonb', default: '[]' })
  buyRows: object[]

  @Column({ name: 'sell_rows', type: 'jsonb', default: '[]' })
  sellRows: object[]

  @Column({ name: 'large_number_buy', type: 'jsonb', nullable: true })
  largeNumberBuy: { suggested: number; label: string } | null

  @Column({ default: false })
  triggered: boolean

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date
}
