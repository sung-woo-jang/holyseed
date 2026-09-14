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

  /** @deprecated 20분할 온주 LOC 전환 이후 미사용 — lastBuyDecisionUsDate/lastSellDecisionUsDate로 분리됨. 과거 데이터 보존용으로 컬럼만 유지 */
  @Column({ name: 'last_decision_us_date', type: 'varchar', length: 10, nullable: true })
  lastDecisionUsDate: string | null;

  /** 마지막으로 매수 LOC를 접수한 미국 거래일 (YYYY-MM-DD) — 당일 중복 접수 방지용 */
  @Column({ name: 'last_buy_decision_us_date', type: 'varchar', length: 10, nullable: true })
  lastBuyDecisionUsDate: string | null;

  /** 마지막으로 매도 LOC를 접수한 미국 거래일 (YYYY-MM-DD) — 당일 중복 접수 방지용 */
  @Column({ name: 'last_sell_decision_us_date', type: 'varchar', length: 10, nullable: true })
  lastSellDecisionUsDate: string | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
