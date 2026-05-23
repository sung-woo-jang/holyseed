import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

const numTransformer = { to: (v: number) => v, from: (v: string) => v ? parseFloat(v) : null }

@Entity('executions', { schema: 'iv' })
@Index(['strategyId', 'execDate'])
export class IvExecution {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'strategy_id', type: 'uuid' })
  strategyId: string

  @Column({ name: 'exec_date', type: 'date' })
  execDate: string

  @Column({ name: 'exec_type' })
  execType: string

  @Column({ name: 'exec_price', type: 'numeric', precision: 14, scale: 4, nullable: true, transformer: numTransformer })
  execPrice: number

  @Column({ name: 'exec_qty', type: 'numeric', precision: 14, scale: 6, nullable: true, transformer: numTransformer })
  execQty: number

  @Column({ name: 'exec_amount', type: 'numeric', precision: 14, scale: 2, nullable: true, transformer: numTransformer })
  execAmount: number

  @Column({ name: 'state_before', type: 'jsonb' })
  stateBefore: Record<string, unknown>

  @Column({ name: 'state_after', type: 'jsonb' })
  stateAfter: Record<string, unknown>

  @Column({ nullable: true })
  note: string

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date
}
