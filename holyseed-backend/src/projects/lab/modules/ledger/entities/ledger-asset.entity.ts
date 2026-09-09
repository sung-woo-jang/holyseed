import { Column, Entity } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '@common/entities/base.entity';

export enum LedgerAssetType {
  BANK = 'BANK',
  CARD = 'CARD',
  CASH = 'CASH',
  INVESTMENT = 'INVESTMENT',
  OTHER = 'OTHER',
}

@Entity('ledger_assets', { schema: 'lab' })
export class LedgerAsset extends BaseEntity {
  @ApiProperty({ description: '자산명', example: '신한은행' })
  @Column({ length: 50 })
  name: string;

  @ApiProperty({ description: '자산 종류', enum: LedgerAssetType })
  @Column({ type: 'enum', enum: LedgerAssetType, enumName: 'lab_ledger_asset_type', default: LedgerAssetType.BANK })
  type: LedgerAssetType;

  @ApiProperty({ description: '현재 잔액 (원) — 거래 등록/수정/삭제에 따라 자동 반영', example: 1200000 })
  @Column({ type: 'int', default: 0 })
  balance: number;
}
