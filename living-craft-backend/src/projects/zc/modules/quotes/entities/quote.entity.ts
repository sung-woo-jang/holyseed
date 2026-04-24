import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { QuoteItem } from './quote-item.entity';

@Entity({ schema: 'zc', name: 'quotes' })
export class Quote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, comment: '견적서 제목' })
  title: string;

  @Column({ type: 'varchar', length: 100, nullable: true, comment: '고객명' })
  customerName: string;

  @Column({ type: 'varchar', length: 20, nullable: true, comment: '고객 연락처' })
  customerPhone: string;

  @Column({ type: 'text', nullable: true, comment: '메모' })
  memo: string;

  @Column({ type: 'int', default: 0, comment: '총 금액' })
  totalAmount: number;

  @Column({ type: 'varchar', length: 20, default: 'draft', comment: '견적서 상태' })
  status: 'draft' | 'sent' | 'accepted' | 'rejected';

  @Column({ type: 'date', nullable: true, comment: '유효 기간' })
  validUntil: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => QuoteItem, (item) => item.quote, { cascade: true })
  items: QuoteItem[];
}
