import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { QuoteRequest } from './quote-request.entity';

@Entity('quote_request_photos', { schema: 'jip' })
export class QuoteRequestPhoto extends BaseEntity {
  @Column({ name: 'quote_request_id' })
  quoteRequestId: number;

  @Column({ name: 'file_url', length: 500 })
  fileUrl: string;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @ManyToOne(() => QuoteRequest, (r) => r.photos)
  @JoinColumn({ name: 'quote_request_id' })
  quoteRequest: QuoteRequest;
}
