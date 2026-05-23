import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { QuoteRequest } from './quote-request.entity';

@Entity('quote_request_items', { schema: 'jip' })
export class QuoteRequestItem extends BaseEntity {
  @Column({ name: 'quote_request_id' })
  quoteRequestId: number;

  @Column({ name: 'item_code', length: 20 })
  itemCode: string;

  @Column({ name: 'name_snapshot', length: 100 })
  nameSnapshot: string;

  @Column({ name: 'unit_snapshot', length: 100, nullable: true })
  unitSnapshot: string;

  @Column({ name: 'price_snapshot', type: 'int' })
  priceSnapshot: number;

  @Column({ name: 'product_code', length: 30, nullable: true })
  productCode: string;

  @Column({ name: 'product_snapshot', type: 'jsonb', nullable: true })
  productSnapshot: Record<string, any>;

  @ManyToOne(() => QuoteRequest, (r) => r.items)
  @JoinColumn({ name: 'quote_request_id' })
  quoteRequest: QuoteRequest;
}
