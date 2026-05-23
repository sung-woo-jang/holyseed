import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { Case } from './case.entity';

@Entity('case_tags', { schema: 'jip' })
export class CaseTag extends BaseEntity {
  @Column({ name: 'case_id' })
  caseId: number;

  @Column({ length: 50 })
  tag: string;

  @ManyToOne(() => Case, (c) => c.tags)
  @JoinColumn({ name: 'case_id' })
  case: Case;
}
