import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('strategies', { schema: 'iv' })
export class IvStrategy {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'user_id' })
  userId: string

  @Column({ name: 'strategy_type' })
  strategyType: string

  @Column()
  ticker: string

  @Column({ type: 'numeric', precision: 14, scale: 2, transformer: { to: (v) => v, from: (v) => parseFloat(v) } })
  principal: number

  @Column({ name: 'cycle_no', default: 1 })
  cycleNo: number

  @Column({ type: 'int', nullable: true })
  division: number

  @Column({ name: 'g_value', type: 'int', nullable: true })
  gValue: number

  @Column({ name: 'band_pct', type: 'numeric', precision: 4, scale: 3, nullable: true, transformer: { to: (v) => v, from: (v) => v ? parseFloat(v) : null } })
  bandPct: number

  @Column({ name: 'contribution_mode', nullable: true })
  contributionMode: string

  @Column({ name: 'contribution_amt', type: 'numeric', precision: 14, scale: 2, nullable: true, transformer: { to: (v) => v, from: (v) => v ? parseFloat(v) : null } })
  contributionAmt: number

  @Column({ name: 'cycle_days', default: 14 })
  cycleDays: number

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date
}
