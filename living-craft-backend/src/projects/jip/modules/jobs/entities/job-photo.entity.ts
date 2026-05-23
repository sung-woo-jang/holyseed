import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { Job } from './job.entity';

@Entity('job_photos', { schema: 'jip' })
export class JobPhoto extends BaseEntity {
  @Column({ name: 'job_id', length: 24 })
  jobId: string;

  @Column({ name: 'file_url', length: 500, nullable: true })
  fileUrl: string;

  @Column({ length: 10, default: 'before' })
  role: 'before' | 'after';

  @Column({ length: 200, nullable: true })
  label: string;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @ManyToOne(() => Job, (j) => j.photos)
  @JoinColumn({ name: 'job_id' })
  job: Job;
}
