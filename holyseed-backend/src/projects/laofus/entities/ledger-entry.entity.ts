import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm';

/**
 * 토스증권 입출금·거래 원장 — 원화·달러 계좌를 한 표에 담은 기록 한 건 = 한 행.
 * 노션 "토스증권 원장" DB와 같은 컬럼 구성(2026-10-17 정리본)이고, 넣은 돈/주식 손익 화면(GET /laofus/ledger)의 원천.
 * 토스 Open API에는 입출금 내역 조회가 없어서 행은 토스 웹 내역을 정리한 파일로 적재한다(scripts/seed-ledger.ts).
 */
@Entity('ledger_entries', { schema: 'laofus' })
@Unique(['ledgerId'])
@Index(['occurredAt'])
export class LaofusLedgerEntry {
  @PrimaryGeneratedColumn()
  id: number;

  /** 통화-날짜-순번 (토스 compositeKey). 결제대기는 P-주문번호 */
  @Column({ name: 'ledger_id', length: 60 })
  ledgerId: string;

  /** 거래 시각. 결제대기 건은 체결일 00:00 KST */
  @Column({ name: 'occurred_at', type: 'timestamptz' })
  occurredAt: Date;

  @Column({ length: 3 })
  currency: 'KRW' | 'USD';

  /** 외부입금·외부출금·환전입금·환전출금·매수·매도·배당·이자·세금·세금환급·이벤트입고·분할입고·분할출고 */
  @Column({ length: 12 })
  category: string;

  @Column({ name: 'stock_name', type: 'varchar', length: 80, nullable: true })
  stockName: string | null;

  @Column({ name: 'stock_code', type: 'varchar', length: 30, nullable: true })
  stockCode: string | null;

  /** 보유 수량 변화 — 매수·입고 +, 매도·출고 − */
  @Column({ name: 'quantity_delta', type: 'decimal', precision: 20, scale: 6, nullable: true })
  quantityDelta: string | null;

  /** 해당 통화 현금 변화(수수료·세금 반영) — 입금·매도 +, 출금·매수 − */
  @Column({ name: 'cash_delta', type: 'decimal', precision: 20, scale: 6, nullable: true })
  cashDelta: string | null;

  /** 매수·매도 체결 금액(수수료 전) */
  @Column({ name: 'trade_amount', type: 'decimal', precision: 20, scale: 6, nullable: true })
  tradeAmount: string | null;

  @Column({ type: 'decimal', precision: 20, scale: 6, nullable: true })
  commission: string | null;

  @Column({ type: 'decimal', precision: 20, scale: 6, nullable: true })
  tax: string | null;

  /** 기록 직후 해당 통화 잔고(토스 원문) — 참고용 */
  @Column({ name: 'balance_after', type: 'decimal', precision: 20, scale: 6, nullable: true })
  balanceAfter: string | null;

  /** 결제완료 / 결제대기 */
  @Column({ length: 8 })
  status: string;

  @Column({ name: 'settle_date', type: 'date', nullable: true })
  settleDate: string | null;

  /** 토스 원문 summary */
  @Column({ name: 'source_summary', length: 60 })
  sourceSummary: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  memo: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
