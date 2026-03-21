import { Entity, Column, Index, PrimaryColumn } from 'typeorm';

@Entity('sessions')
export class SessionEntity {
  @PrimaryColumn('varchar', { length: 255 })
  id: string;

  @Index()
  @Column('bigint')
  expiredAt: number;

  @Column('text')
  json: string;
}
