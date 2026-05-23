import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { Case } from './case.entity';

@Entity('case_photos', { schema: 'jip' })
export class CasePhoto extends BaseEntity {
  @Column({ name: 'case_id' })
  caseId: number;

  @Column({ name: 'file_url', length: 500, nullable: true })
  fileUrl: string;

  @Column({ name: 'role', length: 20, default: 'cover' })
  role: 'cover' | 'before' | 'after';

  @Column({ length: 200, nullable: true })
  label: string;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @ManyToOne(() => Case, (c) => c.photos)
  @JoinColumn({ name: 'case_id' })
  case: Case;
}
