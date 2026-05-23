import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { CaseTag } from './case-tag.entity';
import { CasePhoto } from './case-photo.entity';

@Entity('cases', { schema: 'jip' })
export class Case extends BaseEntity {
  @Column({ length: 200 })
  title: string;

  @Column({ length: 100, nullable: true })
  area: string;

  @Column({ nullable: true })
  hours: number;

  @Column({ name: 'date_text', length: 20, nullable: true })
  dateText: string;

  @Column({ length: 20, default: 'default' })
  color: string;

  @Column({ type: 'text', nullable: true })
  intro: string;

  @Column({ type: 'text', nullable: true })
  story: string;

  @Column({ name: 'is_published', default: true })
  isPublished: boolean;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @OneToMany(() => CaseTag, (t) => t.case)
  tags: CaseTag[];

  @OneToMany(() => CasePhoto, (p) => p.case)
  photos: CasePhoto[];
}
