import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { LedgerAssetType } from '../../entities';

export class CreateAssetDto {
  @ApiProperty({ description: '자산명', example: '신한은행' })
  @IsString()
  @MaxLength(50)
  name: string;

  @ApiProperty({ description: '자산 종류', enum: LedgerAssetType })
  @IsEnum(LedgerAssetType)
  type: LedgerAssetType;

  @ApiPropertyOptional({ description: '시작 잔액 (원)', example: 0 })
  @IsOptional()
  @IsInt()
  balance?: number;
}
