import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm'

const numTransformer = { to: (v: number) => v, from: (v: string) => v ? parseFloat(v) : null }

@Entity('state', { schema: 'iv' })
export class IvState {
  @PrimaryColumn({ name: 'strategy_id', type: 'uuid' })
  strategyId: string

  @Column({ type: 'numeric', precision: 14, scale: 6, default: 0, transformer: numTransformer })
  quantity: number

  @Column({ type: 'numeric', precision: 14, scale: 2, transformer: numTransformer })
  cash: number

  @Column({ name: 'avg_price', type: 'numeric', precision: 14, scale: 4, default: 0, transformer: numTransformer })
  avgPrice: number

  @Column({ name: 'last_close', type: 'numeric', precision: 14, scale: 4, nullable: true, transformer: numTransformer })
  lastClose: number

  @Column({ nullable: true })
  mode: string

  @Column({ name: 't_value', type: 'numeric', precision: 10, scale: 6, default: 0, transformer: numTransformer })
  tValue: number

  @Column({
    name: 'recent_closes',
    type: 'numeric',
    precision: 14,
    scale: 4,
    array: true,
    nullable: true,
    transformer: { to: (v: number[]) => v, from: (v: string[]) => v?.map(parseFloat) ?? [] },
  })
  recentCloses: number[]

  @Column({ name: 'v_value', type: 'numeric', precision: 14, scale: 4, nullable: true, transformer: numTransformer })
  vValue: number

  @Column({ name: 'next_v_update', type: 'date', nullable: true })
  nextVUpdate: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
