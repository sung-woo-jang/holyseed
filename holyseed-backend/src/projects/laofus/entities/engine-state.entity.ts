import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

/** 무매 엔진 현재 상태 (symbol당 1행). 잔금(cash)은 무매 원장 기준 — 계좌 예수금 아님 */
@Entity('engine_state', { schema: 'laofus' })
export class LaofusEngineState {
  @PrimaryColumn({ length: 10 })
  symbol: string;

  @Column({ name: 't_value', type: 'decimal', precision: 10, scale: 4 })
  t: string;

  @Column({ type: 'decimal', precision: 18, scale: 6 })
  quantity: string;

  @Column({ name: 'avg_price', type: 'decimal', precision: 18, scale: 4 })
  avgPrice: string;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  cash: string;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  principal: string;

  @Column({ name: 'cycle_no', type: 'int' })
  cycleNo: number;

  @Column({ name: 'cycle_done', default: false })
  cycleDone: boolean;

  /** 마지막으로 매수/매도 판단을 실행한 미국 거래일 (YYYY-MM-DD) — 2거래일 주기 게이트용 */
  @Column({ name: 'last_decision_us_date', type: 'varchar', length: 10, nullable: true })
  lastDecisionUsDate: string | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
