import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * 엔진이 접수한 주문 원장 — 토스 소수점 금액주문은 다음 세션 개장 배치로 체결되므로
 * 접수 시점에 판단 컨텍스트를 기록해두고, 이후 실행(reconcile)에서 체결을 회수해 DB에 반영한다.
 */
@Entity('pending_orders', { schema: 'laofus' })
export class LaofusPendingOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ name: 'order_id', length: 80 })
  orderId: string;

  @Column({ name: 'client_order_id', length: 40 })
  clientOrderId: string;

  @Column({ length: 12 })
  symbol: string;

  @Column({ length: 4 })
  side: string; // BUY | SELL

  @Column({ length: 12 })
  kind: string; // 전액 | 절반 | 쿼터매도 | 전량매도 | 사이클시작

  @Column({ name: 't_before', type: 'numeric', precision: 10, scale: 4 })
  tBefore: string;

  @Column({ name: 't_after', type: 'numeric', precision: 10, scale: 4 })
  tAfter: string;

  /** BUY: 주문 금액(USD), SELL: null */
  @Column({ name: 'request_amount', type: 'numeric', precision: 12, scale: 2, nullable: true })
  requestAmount: string | null;

  /** SELL: 주문 수량, BUY: null */
  @Column({ name: 'request_quantity', type: 'numeric', precision: 16, scale: 6, nullable: true })
  requestQuantity: string | null;

  @Column({ name: 'cycle_id' })
  cycleId: number;

  /** PENDING(회수 대기) | APPLIED(DB 반영 완료) | FAILED(취소/거부) */
  @Index()
  @Column({ length: 10, default: 'PENDING' })
  status: string;

  @Column({ name: 'applied_trade_id', type: 'int', nullable: true })
  appliedTradeId: number | null;

  @CreateDateColumn({ name: 'placed_at', type: 'timestamp' })
  placedAt: Date;
}
