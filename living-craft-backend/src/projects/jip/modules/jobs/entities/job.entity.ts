import { Entity, Column, OneToMany, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { JobPhoto } from './job-photo.entity';

export type JobStatus = '문의접수' | '시공대기' | '시공완료';

@Entity('jobs', { schema: 'jip' })
export class Job {
  @PrimaryColumn({ length: 24 })
  id: string;

  @Column({ name: 'is_published', default: false })
  isPublished: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // 공개 가능 필드
  @Column({ name: 'customer_name', length: 100, nullable: true })
  customerName: string;

  @Column({ length: 30, nullable: true })
  phone: string;

  @Column({ name: 'address_full', type: 'text', nullable: true })
  addressFull: string;

  @Column({ name: 'address_short', length: 100, nullable: true })
  addressShort: string;

  @Column({ name: 'inquiry_date', type: 'date', nullable: true })
  inquiryDate: string;

  @Column({ name: 'work_date', type: 'date', nullable: true })
  workDate: string;

  @Column({ length: 20, default: '문의접수' })
  status: JobStatus;

  @Column({ name: 'product_name', length: 100, nullable: true })
  productName: string;

  @Column({ length: 100, nullable: true })
  brand: string;

  @Column({ length: 100, nullable: true })
  model: string;

  @Column({ name: 'request_note', type: 'text', nullable: true })
  requestNote: string;

  @Column({ name: 'work_summary', type: 'text', nullable: true })
  workSummary: string;

  // 절대 비공개 필드
  @Column({ name: 'selling_price', type: 'numeric', nullable: true })
  sellingPrice: number;

  @Column({ name: 'cost_price', type: 'numeric', nullable: true })
  costPrice: number;

  @Column({ name: 'material_source', length: 200, nullable: true })
  materialSource: string;

  @Column({ default: false })
  paid: boolean;

  @Column({ name: 'paid_date', type: 'date', nullable: true })
  paidDate: string;

  @Column({ name: 'internal_memo', type: 'text', nullable: true })
  internalMemo: string;

  // 공개 필드 화이트리스트
  @Column({ name: 'public_fields', type: 'jsonb', default: '[]' })
  publicFields: string[];

  @OneToMany(() => JobPhoto, (p) => p.job)
  photos: JobPhoto[];
}
