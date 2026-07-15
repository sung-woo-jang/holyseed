import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

/** 엔진 실행/오류 이벤트 로그 */
@Entity('events', { schema: 'laofus' })
export class LaofusEvent {
  @PrimaryGeneratedColumn()
  id: number

  @Index()
  @CreateDateColumn({ name: 'ts', type: 'timestamp' })
  ts: Date

  @Column({ length: 8 })
  level: string // info | warn | error

  @Column({ length: 16, default: 'engine' })
  source: string

  /** 엔진 실행 1회 단위 그룹 키 (수동 이벤트는 null) */
  @Index()
  @Column({ name: 'run_id', type: 'varchar', length: 36, nullable: true })
  runId: string | null

  @Column({ type: 'text' })
  message: string
}
