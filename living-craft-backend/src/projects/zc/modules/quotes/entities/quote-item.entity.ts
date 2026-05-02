import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Quote } from './quote.entity';
import { ProductModel } from '../../product-models/entities/product-model.entity';

@Entity({ schema: 'zc', name: 'quote_items' })
export class QuoteItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', comment: 'FK to quotes' })
  quoteId: string;

  @Column({ type: 'uuid', nullable: true, comment: 'FK to product_models (선택사항)' })
  productModelId: string;

  @Column({ type: 'varchar', length: 255, comment: '제품명' })
  productName: string;

  @Column({ type: 'int', comment: '수량' })
  quantity: number;

  @Column({ type: 'int', default: 0, comment: '자재 단가 (자재가 × (1 + 마진율))' })
  materialPrice: number;

  @Column({ type: 'int', default: 0, comment: '시공비 단가' })
  laborPrice: number;

  @Column({ type: 'int', comment: '단가 (= materialPrice + laborPrice)' })
  unitPrice: number;

  @Column({ type: 'int', comment: '총 가격 (수량 × 단가)' })
  totalPrice: number;

  @Column({ type: 'text', nullable: true, comment: '항목 메모' })
  note: string;

  @Column({ type: 'int', default: 0, comment: '정렬 순서' })
  sortOrder: number;

  @ManyToOne(() => Quote, (quote) => quote.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quoteId' })
  quote: Quote;

  @ManyToOne(() => ProductModel, { nullable: true })
  @JoinColumn({ name: 'productModelId' })
  productModel: ProductModel;
}
