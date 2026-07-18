import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { LaofusCycle } from './cycle.entity';

/** 사이클 내 m차 거래 (seq). 체결 후 스냅샷(avgAfter/qtyAfter/cashAfter) 포함 */
@Entity('trades', { schema: 'laofus' })
@Unique(['cycleId', 'seq'])
export class LaofusTrade {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'cycle_id' })
  cycleId: number;

  @ManyToOne(() => LaofusCycle, (cycle) => cycle.trades)
  @JoinColumn({ name: 'cycle_id' })
  cycle: LaofusCycle;

  @Column({ type: 'int' })
  seq: number;

  @Column({ type: 'date' })
  date: string;

  @Column({ length: 20 })
  kind: string;

  @Column({ length: 4 })
  side: string;

  @Column({ type: 'decimal', precision: 18, scale: 4 })
  price: string;

  @Column({ type: 'decimal', precision: 18, scale: 6 })
  quantity: string;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  amount: string;

  @Column({ name: 't_before', type: 'decimal', precision: 10, scale: 4 })
  tBefore: string;

  @Column({ name: 't_after', type: 'decimal', precision: 10, scale: 4 })
  tAfter: string;

  @Column({ name: 'avg_after', type: 'decimal', precision: 18, scale: 4 })
  avgAfter: string;

  @Column({ name: 'qty_after', type: 'decimal', precision: 18, scale: 6 })
  qtyAfter: string;

  @Column({ name: 'cash_after', type: 'decimal', precision: 18, scale: 2 })
  cashAfter: string;

  @Column({ name: 'order_id', nullable: true, type: 'varchar' })
  orderId: string | null;

  @Column({ nullable: true, type: 'varchar' })
  note: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
