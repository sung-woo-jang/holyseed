import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';

@Entity('asset_snapshots', { schema: 'ad' })
@Index(['assetId', 'date'])
export class AssetSnapshot extends BaseEntity {
  @Column({ name: 'asset_id' })
  assetId: number;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'decimal', precision: 20, scale: 2 })
  value: number;

  @Column({ name: 'fx_rate_to_krw', type: 'decimal', precision: 15, scale: 6, default: 1 })
  fxRateToKRW: number;

  @Column({ name: 'value_krw', type: 'decimal', precision: 20, scale: 2 })
  valueKRW: number;

  @Column({ type: 'text', nullable: true })
  note: string;

  @Column({ name: 'created_by_user_id', nullable: true })
  createdByUserId: number;
}
