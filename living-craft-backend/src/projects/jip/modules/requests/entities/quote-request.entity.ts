import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { QuoteRequestItem } from './quote-request-item.entity';
import { QuoteRequestPhoto } from './quote-request-photo.entity';

export type QuoteRequestStatus = 'pending' | 'accepted' | 'in_progress' | 'done' | 'cancelled';

@Entity('quote_requests', { schema: 'jip' })
export class QuoteRequest extends BaseEntity {
  @Column({ length: 30, unique: true })
  code: string;

  @Column({ length: 20, default: 'pending' })
  status: QuoteRequestStatus;

  @Column({ name: 'contact_name', length: 100 })
  contactName: string;

  @Column({ name: 'contact_phone', length: 30 })
  contactPhone: string;

  @Column({ name: 'contact_address', type: 'text' })
  contactAddress: string;

  @Column({ type: 'text', nullable: true })
  memo: string;

  @Column({ name: 'pref_date', length: 20, nullable: true })
  prefDate: string;

  @Column({ name: 'pref_time_slot', length: 50, nullable: true })
  prefTimeSlot: string;

  @Column({ name: 'visit_fee', type: 'int', default: 20000 })
  visitFee: number;

  @Column({ name: 'items_total', type: 'int', default: 0 })
  itemsTotal: number;

  @OneToMany(() => QuoteRequestItem, (i) => i.quoteRequest)
  items: QuoteRequestItem[];

  @OneToMany(() => QuoteRequestPhoto, (p) => p.quoteRequest)
  photos: QuoteRequestPhoto[];
}
