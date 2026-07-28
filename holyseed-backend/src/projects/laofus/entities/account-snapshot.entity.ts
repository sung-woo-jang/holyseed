import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

/**
 * 실계좌(토스증권, 라오어+VR 공유) 일별 총자산 스냅샷 — 자산일기(ad-front) 수동 입력 참고용.
 * 매일 06:00 KST 크론 + 수동 트리거(POST /account-snapshot/run)로 그날 값을 upsert.
 */
@Entity('account_snapshots', { schema: 'laofus' })
@Unique(['date'])
export class LaofusAccountSnapshot {
  @PrimaryGeneratedColumn()
  id: number;

  /** 미국 거래일이 아니라 기록 시점의 KST 날짜 (YYYY-MM-DD) */
  @Column({ length: 10 })
  date: string;

  @Column({ name: 'total_value_usd', type: 'decimal', precision: 18, scale: 2 })
  totalValueUsd: string;

  @Column({ name: 'total_value_krw', type: 'decimal', precision: 18, scale: 2 })
  totalValueKrw: string;

  @Column({ name: 'stock_value_usd', type: 'decimal', precision: 18, scale: 2 })
  stockValueUsd: string;

  @Column({ name: 'cash_usd', type: 'decimal', precision: 18, scale: 2 })
  cashUsd: string;

  @Column({ name: 'cash_krw', type: 'decimal', precision: 18, scale: 2 })
  cashKrw: string;

  @Column({ name: 'fx_rate', type: 'decimal', precision: 12, scale: 4 })
  fxRate: string;

  /** 종목별 {symbol, quantity, marketValueUsd} 배열 — 참고용, 계산에는 재사용 안 함 */
  @Column({ name: 'holdings_json', type: 'jsonb' })
  holdingsJson: { symbol: string; quantity: number; marketValueUsd: number }[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
