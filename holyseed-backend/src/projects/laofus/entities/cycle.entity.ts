import { Column, Entity, OneToMany, PrimaryGeneratedColumn, Unique } from 'typeorm'
import { LaofusTrade } from './trade.entity'

@Entity('cycles', { schema: 'laofus' })
@Unique(['symbol', 'cycleNo'])
export class LaofusCycle {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ length: 10 })
  symbol: string

  @Column({ name: 'cycle_no', type: 'int' })
  cycleNo: number

  @Column({ name: 'start_date', type: 'date' })
  startDate: string

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate: string | null

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  principal: string

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  profit: string | null

  @Column({ name: 'profit_pct', type: 'decimal', precision: 10, scale: 4, nullable: true })
  profitPct: string | null

  @OneToMany(() => LaofusTrade, (trade) => trade.cycle)
  trades: LaofusTrade[]
}
